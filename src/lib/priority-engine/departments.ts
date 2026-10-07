// ============================================================
// DEPARTMENT ROUTING — priority first, then category/facts → owning
// department(s). Reuses the app's existing 27-category taxonomy; the
// incident family from the fact extractor can refine or add a unit
// (a fallen wire under util_power goes to BESCOM's hazard cell, not
// the billing office).
// ============================================================

import { IncidentType } from './types';

type CategoryRow = { departments: string[] };

const BY_CATEGORY: Record<string, CategoryRow> = {
  traffic_accident: { departments: ['Bengaluru Traffic Police', 'BBMP Road Infrastructure'] },
  traffic_wrong_side: { departments: ['Bengaluru Traffic Police'] },
  traffic_pothole: { departments: ['BBMP Road Infrastructure'] },
  traffic_parking: { departments: ['Bengaluru Traffic Police'] },
  traffic_interaction: { departments: ['Bengaluru Traffic Police'] },
  civic_garbage: { departments: ['BBMP Solid Waste Management'] },
  civic_streetlight: { departments: ['BESCOM Street Lighting'] },
  civic_footpath: { departments: ['BBMP Road Infrastructure'] },
  civic_drainage: { departments: ['BWSSB Sewerage'] },
  civic_parks: { departments: ['BBMP Parks & Gardens'] },
  civic_water_supply: { departments: ['BWSSB Water Supply'] },
  civic_stray_animals: { departments: ['BBMP Animal Control'] },
  civic_sense: { departments: ['BBMP'] },
  util_power: { departments: ['BESCOM'] },
  env_noise: { departments: ['KSPCC / BBMP'] },
  safety_harassment: { departments: ['Karnataka State Police'] },
  cybercrime: { departments: ['Cyber Crime Cell, KSP'] },
  bribes: { departments: ['Lokayukta / Vigilance'] },
  unofficial_payment: { departments: ['Lokayukta / Vigilance'] },
  housing_tenant: { departments: ['BDA / Tenancy Welfare'] },
  govt_service: { departments: ['Concerned Government Office'] },
  access_language: { departments: ['BBMP Citizen Services'] },
  bmtc_service: { departments: ['BMTC'] },
  bmtc_staff: { departments: ['BMTC'] },
  bmtc_fare_ticket: { departments: ['BMTC'] },
  metro_service: { departments: ['BMRCL'] },
  custom_issue: { departments: ['BBMP'] },
};

const BY_INCIDENT: Partial<Record<IncidentType, string[]>> = {
  vehicle_collision: ['Bengaluru Traffic Police', 'Emergency Medical Services'],
  electrical_hazard: ['BESCOM Electrical Safety'],
  fire_explosion: ['Karnataka Fire & Emergency Services'],
  structural_collapse: ['BBMP Building Permission', 'Karnataka Fire & Emergency Services'],
  trapped_rescue: ['Karnataka Fire & Emergency Services', 'Emergency Medical Services'],
  drowning: ['Karnataka Fire & Emergency Services', 'Emergency Medical Services'],
  physical_violence: ['Karnataka State Police'],
  animal_attack: ['BBMP Animal Control', 'Emergency Medical Services'],
  sewage_contamination: ['BWSSB Sewerage'],
  gas_chemical_hazard: ['Karnataka Fire & Emergency Services', 'Pollution Control Board'],
};

/**
 * Department list for one report: scenario id first (matches the app's
 * 27-category taxonomy), then the category parent as fallback, then the
 * fact-derived emergency unit, deduplicated.
 */
export function departmentsFor(ids: { subcategory?: string; category?: string }, incidentType: IncidentType): string[] {
  const out: string[] = [];
  const push = (d?: string) => {
    if (d && !out.includes(d)) out.push(d);
  };
  for (const d of BY_CATEGORY[ids.subcategory || '']?.departments || []) push(d);
  if (out.length === 0) for (const d of BY_CATEGORY[(ids.category || '').toLowerCase()]?.departments || []) push(d);
  for (const d of BY_INCIDENT[incidentType] || []) push(d);
  if (out.length === 0) push('BBMP');
  return out;
}
