const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

export function formatDate(iso: string | null): string {
  if (iso == null) return '';

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

export function isOverdue(iso: string | null): boolean {
  if (iso == null) return false;

  const date = new Date(iso);

  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export function profileLabel(profile: {
  username: string | null;
  first_name: string | null;
  last_name: string | null;
} | null): string {
  if (profile == null) return 'Unknown';

  const full = [profile.first_name, profile.last_name].filter((part): part is string => part != null && part !== '').join(' ');

  return full !== '' ? full : (profile.username ?? 'Unknown');
}
