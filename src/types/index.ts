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

export type EvidenceType = 'image' | 'video' | 'audio' | 'document' | 'link';

export type CategoryParent =
  | 'TRAFFIC'
  | 'CIVIC'
  | 'PUBLIC_SAFETY'
  | 'GOVERNMENT'
  | 'HOUSING'
  | 'ENVIRONMENT'
  | 'UTILITIES'
  | 'DIGITAL'
  | 'ACCESS_INTEGRATION';

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
  ai_scenario_match?: string;
  ai_confidence?: number;
  ai_reason?: string;
  created_at: string;
  updated_at: string;
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
