/**
 * Coming soon mode for the public website.
 *
 * Flip `COMING_SOON_ENABLED` to `false` when Century Padel is ready to go live.
 * `NEXT_PUBLIC_COMING_SOON` overrides this when set to `"true"` or `"false"`.
 *
 * Admin routes stay available either way.
 */
export const COMING_SOON_ENABLED = true;

export function isComingSoonEnabled() {
  const envValue = process.env.NEXT_PUBLIC_COMING_SOON;

  if (envValue === 'true') return true;
  if (envValue === 'false') return false;

  return COMING_SOON_ENABLED;
}
