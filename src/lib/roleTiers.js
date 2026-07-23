// Shared role → tier mapping used everywhere a member's community role is
// displayed (CommunityView, publicProfile, AdminPanel, ProfileView, ChatPanel).
//
// IMPORTANT: this is a DISPLAY-ONLY mapping. The backend role strings
// ("student" | "teacher" | "hod" | "principal" | "owner") are unchanged —
// this file only decides how each one is labelled/grouped in the UI, so any
// community type (college, company, club, etc.) can be shown with a generic
// tier hierarchy instead of college-specific words.
//
// Tier order (as decided): 1 = highest (community creator), 4 = lowest.
//   Tier 1 -> owner              (creator of the community)
//   Tier 2 -> principal / hod    (leadership roles)
//   Tier 3 -> teacher
//   Tier 4 -> student

export const ROLE_TIER_MAP = {
  owner:     { tier: 1, tierLabel: "Tier 1" },
  principal: { tier: 2, tierLabel: "Tier 2" },
  hod:       { tier: 2, tierLabel: "Tier 2" },
  teacher:   { tier: 3, tierLabel: "Tier 3" },
  student:   { tier: 4, tierLabel: "Tier 4" },
};

// Returns { tier, tierLabel } for a given backend role string.
// Falls back to the lowest tier (student) for unknown/missing roles so the
// UI never crashes or shows a blank tier for legacy/unexpected data.
export const getRoleTier = (role) => ROLE_TIER_MAP[role] || ROLE_TIER_MAP.student;

// Returns the full display string, e.g. "Tier 1 · OWNER".
// `role` is used as-is (uppercased) so the underlying role name still shows
// alongside the tier — nothing about the backend value is hidden or renamed.
export const getRoleDisplay = (role) => {
  if (!role) return null;
  const { tierLabel } = getRoleTier(role);
  return `${tierLabel} · ${String(role).toUpperCase()}`;
};