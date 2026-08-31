import { IncidentStatus } from '@/types';

// Centralized status colors — same for admin and user
export const statusColors: Record<IncidentStatus, { bg: string; text: string; hover: string; dot: string }> = {
  NEW: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-200',
    dot: 'bg-blue-500',
  },
  UNDER_REVIEW: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    hover: 'hover:bg-yellow-200',
    dot: 'bg-yellow-500',
  },
  MISSING_INFORMATION: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-200',
    dot: 'bg-purple-500',
  },
  ON_HOLD: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-200',
    dot: 'bg-orange-500',
  },
  PROCEEDING: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    hover: 'hover:bg-green-200',
    dot: 'bg-green-500',
  },
  INVALID: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    hover: 'hover:bg-red-200',
    dot: 'bg-red-500',
  },
  CLOSED: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    hover: 'hover:bg-gray-200',
    dot: 'bg-gray-400',
  },
  RESOLVED: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    hover: 'hover:bg-emerald-200',
    dot: 'bg-emerald-500',
  },
};

export function getStatusColor(status: IncidentStatus) {
  return statusColors[status] || statusColors.NEW;
}

export function getStatusBadgeClass(status: IncidentStatus): string {
  const c = getStatusColor(status);
  return `${c.bg} ${c.text}`;
}

export function getStatusDotClass(status: IncidentStatus): string {
  return getStatusColor(status).dot;
}
