// src/lib/group.api.js
//
// Centralized calls for the group system (create/manage/chat), same
// defensive pattern as community.api.js — every function resolves to a
// predictable shape and never throws a raw axios error into a component.

import api from "./api";

const fail = (err, fallback) => ({
  success: false,
  msg: err.response?.data?.msg || err.response?.data?.message || fallback,
  status: err.response?.status,
});

// ── Groups (CRUD) ─────────────────────────────────────────────────────────
export const getGroups = async (collegeId) => {
  try {
    const res = await api.get(`/api/ecosystem/groups${collegeId ? `?collegeId=${collegeId}` : ""}`);
    return { success: true, groups: res.data?.groups || [] };
  } catch (err) {
    return { success: false, groups: [], msg: fail(err, "Could not load groups").msg };
  }
};

export const getMyGroups = async (collegeId) => {
  try {
    const res = await api.get(`/api/ecosystem/groups/my-groups${collegeId ? `?collegeId=${collegeId}` : ""}`);
    return { success: true, groups: res.data?.groups || [] };
  } catch (err) {
    return { success: false, groups: [], msg: fail(err, "Could not load your groups").msg };
  }
};

export const getGroupById = async (groupId) => {
  try {
    const res = await api.get(`/api/ecosystem/groups/${groupId}`);
    return { success: true, group: res.data?.group || null, myRole: res.data?.myRole || null };
  } catch (err) {
    return { success: false, group: null, myRole: null, msg: fail(err, "Could not load group").msg };
  }
};

export const createGroup = async (payload) => {
  try {
    const res = await api.post("/api/ecosystem/groups", payload);
    return res.data;
  } catch (err) {
    return fail(err, "Could not create group");
  }
};

export const updateGroup = async (groupId, updates) => {
  try {
    const res = await api.put(`/api/ecosystem/groups/${groupId}`, updates);
    return res.data;
  } catch (err) {
    return fail(err, "Could not update group");
  }
};

export const uploadGroupAvatar = async (groupId, file) => {
  try {
    const formData = new FormData();
    formData.append("icon", file);
    const res = await api.post(`/api/ecosystem/groups/${groupId}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    return fail(err, "Could not upload group photo");
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const res = await api.delete(`/api/ecosystem/groups/${groupId}`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not delete group");
  }
};

// ── Membership ────────────────────────────────────────────────────────────
export const requestToJoinGroup = async (groupId) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/join`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not send join request");
  }
};

export const cancelJoinRequest = async (groupId) => {
  try {
    const res = await api.delete(`/api/ecosystem/groups/${groupId}/join`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not cancel join request");
  }
};

export const getJoinRequests = async (groupId) => {
  try {
    const res = await api.get(`/api/ecosystem/groups/${groupId}/join-requests`);
    return { success: true, requests: res.data?.requests || [] };
  } catch (err) {
    return { success: false, requests: [], msg: fail(err, "Could not load join requests").msg };
  }
};

export const respondToJoinRequest = async (groupId, requestId, action) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/join-requests/${requestId}/respond`, { action });
    return res.data;
  } catch (err) {
    return fail(err, "Could not respond to join request");
  }
};

export const getGroupMembers = async (groupId) => {
  try {
    const res = await api.get(`/api/ecosystem/groups/${groupId}/members`);
    return { success: true, members: res.data?.members || [] };
  } catch (err) {
    return { success: false, members: [], msg: fail(err, "Could not load members").msg };
  }
};

export const addMemberDirect = async (groupId, userId) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/members`, { userId });
    return res.data;
  } catch (err) {
    return fail(err, "Could not add member");
  }
};

export const removeMember = async (groupId, userId) => {
  try {
    const res = await api.delete(`/api/ecosystem/groups/${groupId}/members/${userId}`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not remove member");
  }
};

export const leaveGroup = async (groupId) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/leave`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not leave group");
  }
};

export const promoteToAdmin = async (groupId, userId) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/members/${userId}/promote`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not promote member");
  }
};

export const demoteAdmin = async (groupId, userId) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/members/${userId}/demote`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not demote admin");
  }
};

// ── Chat ──────────────────────────────────────────────────────────────────
export const getGroupMessages = async (groupId, page = 1, limit = 50) => {
  try {
    const res = await api.get(`/api/ecosystem/groups/${groupId}/messages?page=${page}&limit=${limit}`);
    return { success: true, messages: res.data?.messages || [] };
  } catch (err) {
    return { success: false, messages: [], msg: fail(err, "Could not load messages").msg };
  }
};

export const sendGroupMessage = async (groupId, text, replyTo) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/messages`, { text, replyTo });
    return res.data;
  } catch (err) {
    return fail(err, "Could not send message");
  }
};

export const sendGroupMediaMessage = async (groupId, file, extra = {}) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (extra.text) formData.append("text", extra.text);
    if (extra.isVoice) formData.append("isVoice", "true");
    if (extra.duration) formData.append("duration", String(extra.duration));

    const res = await api.post(`/api/ecosystem/groups/${groupId}/messages/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    return fail(err, "Could not send media");
  }
};

export const sendGroupSticker = async (groupId, stickerId) => {
  try {
    const res = await api.post(`/api/ecosystem/groups/${groupId}/messages/sticker`, { stickerId });
    return res.data;
  } catch (err) {
    return fail(err, "Could not send sticker");
  }
};

export const getStickerPack = async () => {
  try {
    const res = await api.get("/api/ecosystem/groups/stickers");
    return res.data?.stickers || [];
  } catch {
    return [];
  }
};

export const markGroupMessagesSeen = async (groupId) => {
  try {
    await api.put(`/api/ecosystem/groups/${groupId}/messages/seen`);
  } catch {
    // best-effort, ignore
  }
};

export const deleteGroupMessageForMe = async (groupId, messageId) => {
  try {
    const res = await api.delete(`/api/ecosystem/groups/${groupId}/messages/${messageId}/delete-me`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not delete message");
  }
};

export const deleteGroupMessageForAll = async (groupId, messageId) => {
  try {
    const res = await api.delete(`/api/ecosystem/groups/${groupId}/messages/${messageId}/delete-all`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not delete message");
  }
};

export const reactToGroupMessage = async (groupId, messageId, emoji) => {
  try {
    const res = await api.put(`/api/ecosystem/groups/${groupId}/messages/${messageId}/react`, { emoji });
    return res.data;
  } catch (err) {
    return fail(err, "Could not react");
  }
};

export const removeGroupMessageReaction = async (groupId, messageId) => {
  try {
    const res = await api.delete(`/api/ecosystem/groups/${groupId}/messages/${messageId}/react`);
    return res.data;
  } catch (err) {
    return fail(err, "Could not remove reaction");
  }
};

export const getOnlineGroupMembers = async (groupId) => {
  try {
    const res = await api.get(`/api/ecosystem/groups/${groupId}/online-members`);
    return { success: true, members: res.data?.members || [] };
  } catch (err) {
    return { success: false, members: [], msg: fail(err, "Could not load online members").msg };
  }
};