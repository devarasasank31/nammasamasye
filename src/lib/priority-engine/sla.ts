// ============================================================
// SLA POLICY — assigned AFTER the priority band, never before.
//
// Default policy matches the existing app (P1 3d / P2 7d / P3 21d /
// P4 30d, grounded in CPGRAMS + BBMP practice) but every value is
// env-overridable so nothing is hard-coded:
//
//   PRIORITY_SLA_P1_DAYS, PRIORITY_SLA_P2_DAYS,
//   PRIORITY_SLA_P3_DAYS, PRIORITY_SLA_P4_DAYS
// ============================================================

import { PriorityLevel } from '../../types';
import { SlaClass } from './types';

export const SLA_CLASS_FOR: Record<PriorityLevel, SlaClass> = {
  P1: 'EMERGENCY',
  P2: 'RAPID',
  P3: 'NORMAL',
  P4: 'ROUTINE',
};

const DEFAULT_DAYS: Record<PriorityLevel, number> = { P1: 3, P2: 7, P3: 21, P4: 30 };

function envDays(level: PriorityLevel, fallback: number): number {
  const raw = process.env[`PRIORITY_SLA_${level}_DAYS`];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function slaDaysFor(level: PriorityLevel): number {
  return envDays(level, DEFAULT_DAYS[level]);
}

export function slaClassFor(level: PriorityLevel): SlaClass {
  return SLA_CLASS_FOR[level];
}
