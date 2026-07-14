// src/lib/community.api.js
//
// Centralized calls for the multi-community backend changes (Day 1):
//   - a user can join exactly ONE private community
//   - a user can join MANY public communities
//   - /api/createcollege/my-communities returns { privateCommunity, publicCommunities }
//
// Every function here is defensive: it never throws a raw axios error up to
// a component render path — it always resolves to a predictable shape, so a
// failed network call can never crash a page mid-render.

import api from "./api";

/**
 * Join a community (private or public) using an invite code.
 * Backend decides private-vs-public capping — the frontend does not need to.
 * @returns {{ success: boolean, msg: string, college?: object }}
 */
export const joinCommunity = async (inviteCode) => {
  try {
    const res = await api.post("/api/createcollege/join", { invite_code: inviteCode });
    return res.data;
  } catch (err) {
    return {
      success: false,
      msg: err.response?.data?.msg || "Could not join community. Please try again.",
      status: err.response?.status,
    };
  }
};

/**
 * Leave a community (private or public) by its collegeId.
 * @returns {{ success: boolean, msg: string }}
 */
export const leaveCommunity = async (collegeId) => {
  try {
    const res = await api.post("/api/createcollege/leave", { collegeId });
    return res.data;
  } catch (err) {
    return {
      success: false,
      msg: err.response?.data?.msg || "Could not leave community. Please try again.",
      status: err.response?.status,
    };
  }
};

/**
 * Get every community the current user belongs to.
 * Always resolves to a safe default shape — never leaves callers with
 * `undefined.privateCommunity` to crash on.
 * @returns {{ privateCommunity: object|null, publicCommunities: object[] }}
 */
export const getMyCommunities = async () => {
  try {
    const res = await api.get("/api/createcollege/my-communities");
    return {
      privateCommunity: res.data?.privateCommunity || null,
      publicCommunities: Array.isArray(res.data?.publicCommunities) ? res.data.publicCommunities : [],
    };
  } catch {
    return { privateCommunity: null, publicCommunities: [] };
  }
};