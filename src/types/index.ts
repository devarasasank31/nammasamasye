export type Language = 'kn' | 'en' | 'hi' | 'te';

export type IncidentStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'MISSING_INFORMATION'
  | 'ON_HOLD'
  | 'PROCEEDING'
  | 'INVALID'
  | 'CLOSED'
  | 'RESOLVED';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'REVIEWER' | 'VIEW_ONLY';

/** P1 = immediate life-safety risk (3 days), P4 = routine/low impact (30 days). */
export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export type EvidenceType = 'image' | 'video' | 'audio' | 'document' | 'link';

export type CategoryParent =
  | 'TRAFFIC'
  | 'CIVIC'
  | 'PUBLIC_SAFETY'
  | 'GOVERNMENT'
  | 'HOUSING'
  | 'ENVIRONMENT'
  | 'UTILITIES'
  | 'TRANSPORT'
  | 'DIGITAL'
  | 'ACCESS_INTEGRATION'
  | 'CORRUPTION'
  | 'OTHER';

export interface IncidentCategory {
  id: string;
  parent: CategoryParent;
  name: string;
  nameKn?: string;
  nameHi?: string;
  nameTe?: string;
  icon: string;
  workflow: WorkflowQuestion[];
}

export interface WorkflowQuestion {
  id: string;
  text: Record<Language, string>;
  type: 'text' | 'select' | 'boolean' | 'date' | 'location' | 'evidence';
  required: boolean;
  options?: { label: Record<Language, string>; value: string }[];
  suggest?: 'bengaluru';
}

export interface AttachmentMeta {
  id: string;
  name: string;
  kind: 'image' | 'video';
  mime: string;
  size: number;
  added_at: string;
}

export interface Incident {
  id: string;
  incident_id: string;
  session_id: string;
  category_id: string;
  subcategory: string;
  original_text: string;
  structured_interpretation: string;
  ai_summary: string;
  location: string;
  location_area?: string;
  location_lat?: number;
  location_lng?: number;
  date_of_incident?: string;
  language: Language;
  status: IncidentStatus;
  severity?: string;
  is_recurring?: boolean;
  attachments?: AttachmentMeta[];
  ai_scenario_match?: string;
  ai_confidence?: number;
  ai_reason?: string;
  created_at: string;
  updated_at: string;
  /** Auto-detected from the pinned coordinate (offline gazetteer). */
  ward?: string;
  ward_number?: number;
  zone?: string;
  police_station?: string;
  ward_distance_km?: number;
  /** Computed by the priority engine (P1 = life safety, P4 = routine). */
  priority?: PriorityLevel;
  priority_base?: PriorityLevel;
  priority_score?: number;
  priority_reason?: string;
  sla_days?: number;
  /** Citizen support (upvotes) and moderation signals from the public feed. */
  support_count?: number;
  flag_count?: number;
  cluster_key?: string;
  cluster_citizens?: number;
  resolved_at?: string;
}

/**
 * Sanitised view of an incident for the public issue feed.
 * Deliberately omits original_text, answers, attachments, session id and
 * exact coordinates — only the issue, place and severity are public.
 */
export interface PublicIncident {
  incident_id: string;
  category_id: string;
  subcategory: string;
  ward?: string;
  ward_number?: number;
  zone?: string;
  police_station?: string;
  area: string;
  priority: PriorityLevel;
  severity: string;
  status: IncidentStatus;
  support_count: number;
  flag_count: number;
  cluster_citizens: number;
  sla_days?: number;
  created_at: string;
  resolved_at?: string;
  supported?: boolean;
  flagged?: boolean;
}

export interface Evidence {
  id: string;
  incident_id: string;
  type: EvidenceType;
  description: string;
  url: string;
  status: 'pending' | 'verified' | 'rejected';
  date_added: string;
}

export interface StatusHistory {
  id: string;
  incident_id: string;
  previous_status: IncidentStatus | null;
  new_status: IncidentStatus;
  admin_id: string;
  admin_note?: string;
  timestamp: string;
}

export interface AdminNote {
  id: string;
  incident_id: string;
  admin_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
}

export interface OfficialResource {
  id: string;
  title: string;
  category: string;
  authority: string;
  official_url: string;
  official_phone?: string;
  description: string;
  language: Language;
  last_verified_at: string;
  source: string;
  active: boolean;
}

export interface CommunityCluster {
  id: string;
  area: string;
  category: string;
  incident_count: number;
  evidence_count: number;
  first_reported: string;
  last_reported: string;
  verified: boolean;
  status: 'potential' | 'confirmed' | 'dismissed';
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface Session {
  id: string;
  language: Language;
  created_at: string;
  last_active: string;
}

export interface Notification {
  id: string;
  session_id: string;
  incident_id: string;
  type: 'status_change' | 'info_requested' | 'info_submitted' | 'report_proceeding' | 'report_closed';
  message: string;
  read: boolean;
  created_at: string;
}

export interface AreaStats {
  area: string;
  total_reports: number;
  categories: Record<string, number>;
  trends: { period: string; count: number }[];
}

export interface DashboardStats {
  total: number;
  new_count: number;
  under_review: number;
  missing_info: number;
  on_hold: number;
  proceeding: number;
  invalid: number;
  closed: number;
  resolved: number;
  reports_per_day: { date: string; count: number }[];
  reports_per_category: { category: string; count: number }[];
  reports_per_area: { area: string; count: number }[];
}

export interface IncidentStats {
  total: number;
  byCategory: Record<string, number>;
  byArea: Record<string, number>;
  byLang: Record<string, number>;
}
