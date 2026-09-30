// ============================================================
// DUPLICATE / CLUSTER DETECTION
//
// "12 citizens reported this same issue at this place" — reports are
// grouped by (ward or area) + subcategory inside a rolling 14-day
// window. Only clusters with 2+ independent citizens are surfaced,
// and 5+ is the threshold the priority engine escalates on.
// ============================================================

import { CategoryParent, Incident, PriorityLevel } from '@/types';
import { computePriority } from '@/lib/priority';

export const CLUSTER_WINDOW_DAYS = 14;
export const CLUSTER_MIN_REPORTS = 2;
export const CLUSTER_ESCALATION_CITIZENS = 5;

export interface IssueCluster {
  key: string;
  ward: string;
  wardNumber: number | null;
  area: string;
  category: string;
  subcategory: string;
  citizenCount: number;
  reportCount: number;
  incidentIds: string[];
  priority: PriorityLevel;
  firstReported: string;
  lastReported: string;
}

function placeOf(inc: Incident): string {
  if (inc.ward) return `ward:${inc.ward_number ?? ''}:${inc.ward}`;
  if (inc.location_area) return `area:${inc.location_area.trim().toLowerCase()}`;
  return `id:${inc.incident_id}`;
}

export function clusterKeyFor(inc: Incident): string {
  return `${placeOf(inc)}|${inc.subcategory}`;
}

const MS_WINDOW = CLUSTER_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Groups reports into clusters; also returns citizen counts per incident id. */
export function buildClusters(incidents: Incident[]): {
  clusters: IssueCluster[];
  citizenCountByIncident: Map<string, number>;
  clusterKeyByIncident: Map<string, string>;
} {
  const sorted = [...incidents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const buckets = new Map<string, Incident[]>();
  for (const inc of sorted) {
    const key = clusterKeyFor(inc);
    const list = buckets.get(key);
    if (list) list.push(inc);
    else buckets.set(key, [inc]);
  }

  const clusters: IssueCluster[] = [];
  const citizenCountByIncident = new Map<string, number>();
  const clusterKeyByIncident = new Map<string, string>();

  for (const [key, list] of buckets) {
    // Split long-running groups into rolling windows so an old report
    // does not keep inflating a fresh one.
    let window: Incident[] = [];
    let windowStart = 0;
    const flush = () => {
      if (window.length === 0) return;
      const citizens = new Set(window.map(i => i.session_id || i.incident_id));
      const subcategory = key.split('|').slice(1).join('|');
      const place = splitPlace(key);
      const top = window.reduce((a, b) => {
        const pa = computePriority({
          category: a.category_id as CategoryParent,
          subcategory: a.subcategory,
          text: a.original_text,
        });
        const pb = computePriority({
          category: b.category_id as CategoryParent,
          subcategory: b.subcategory,
          text: b.original_text,
        });
        return pb.score > pa.score ? b : a;
      });
      for (const inc of window) {
        citizenCountByIncident.set(inc.incident_id, citizens.size);
        clusterKeyByIncident.set(inc.incident_id, key);
      }
      if (window.length >= CLUSTER_MIN_REPORTS && citizens.size >= CLUSTER_MIN_REPORTS) {
        clusters.push({
          key,
          ward: place.ward,
          wardNumber: place.wardNumber,
          area: place.area,
          category: top.category_id,
          subcategory,
          citizenCount: citizens.size,
          reportCount: window.length,
          incidentIds: window.map(i => i.incident_id),
          priority: top.priority || 'P3',
          firstReported: window[0].created_at,
          lastReported: window[window.length - 1].created_at,
        });
      }
      window = [];
    };

    for (let i = 0; i < list.length; i++) {
      if (i > 0 && new Date(list[i].created_at).getTime() - windowStart > MS_WINDOW) {
        flush();
        windowStart = new Date(list[i].created_at).getTime();
      }
      if (window.length === 0) windowStart = new Date(list[i].created_at).getTime();
      window.push(list[i]);
    }
    flush();
  }

  clusters.sort((a, b) => b.citizenCount - a.citizenCount);
  return { clusters, citizenCountByIncident, clusterKeyByIncident };
}

function splitPlace(key: string): {
  ward: string;
  wardNumber: number | null;
  area: string;
} {
  const place = key.split('|')[0];
  if (place.startsWith('ward:')) {
    const parts = place.split(':');
    const wardNumber = Number(parts[1]);
    const name = parts.slice(2).join(':');
    return {
      ward: name || place,
      wardNumber: Number.isFinite(wardNumber) ? wardNumber : null,
      area: name,
    };
  }
  if (place.startsWith('area:')) {
    const label = place.slice(5);
    return { ward: label, wardNumber: null, area: label };
  }
  return { ward: '', wardNumber: null, area: '' };
}

/** True when a cluster is worth showing to the admin as "N citizens reported". */
export function isSignificant(cluster: IssueCluster): boolean {
  return cluster.citizenCount >= CLUSTER_MIN_REPORTS;
}
