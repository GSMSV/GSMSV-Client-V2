/**
 * Resolve a resource link only when it matches a supported service GRN.
 * This is navigation routing only; the parsed type is never used for access control.
 */
export function getNotificationResourcePath(grn: string): string | null {
  const match = /^grn:(?:user|team)-[0-9a-hjkmnp-tv-z]{12}:(vm|fn|db|app)-[0-9a-hjkmnp-tv-z]{12}$/.exec(grn);
  if (!match) return null;

  const resourceType = match[1];
  const encodedGrn = encodeURIComponent(grn);
  if (resourceType === 'db') return `/databases/${encodedGrn}`;
  if (resourceType === 'app') return `/apps/${encodedGrn}`;
  if (resourceType === 'vm') return `/vms/${encodedGrn}/network`;
  return null;
}
