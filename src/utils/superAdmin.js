/**
 * Check if a given email is a super admin.
 * Reads from VITE_SUPER_ADMIN_EMAIL (comma-separated list).
 */
export const isSuperAdmin = (email) => {
  if (!email) return false;
  const superAdmins = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return superAdmins.includes(email.toLowerCase());
};
