// src/lib/directChat.api.js
//
// Feature-parity additions for 1-on-1 chat (ChatPanel.jsx) — everything
// here already exists for group chat (group.api.js); this file adds the
// same calls for the direct/1-on-1 chat backend endpoints added alongside
// it (Eco.chat.router.js). Same defensive pattern as group.api.js: every
// function resolves to a predictable shape, never throws a raw axios
// error into a component.

import api from "./api";

const fail = (err, fallback) => ({
  success: false,
  msg: err.response?.data?.msg || err.response?.data?.message || fallback,
  status: err.response?.status,
});

export const sendSticker = async (chatId, stickerId) => {
  try {
    const res = await api.post("/api/ecosystem/chat/send-sticker", { chatId, stickerId });
    return res.data;
  } catch (err) {
    return fail(err, "Could not send sticker");
  }
};

// Reuses the same static sticker pack the group chat already fetches —
// it's one shared pack, no need for a second copy of this list server-side.
export const getStickerPack = async () => {
  try {
    const res = await api.get("/api/ecosystem/groups/stickers");
    return res.data?.stickers || [];
  } catch {
    return [];
  }
};

export const searchMessages = async (chatId, query) => {
  try {
    const res = await api.get(`/api/ecosystem/chat/${chatId}/messages/search?q=${encodeURIComponent(query)}`);
    return { success: true, results: res.data?.results || [] };
  } catch (err) {
    return { success: false, results: [], msg: fail(err, "Search failed").msg };
  }
};

export const bulkDeleteForMe = async (chatId, messageIds) => {
  try {
    const res = await api.put(`/api/ecosystem/chat/${chatId}/messages/bulk-delete-me`, { messageIds });
    return res.data;
  } catch (err) {
    return fail(err, "Could not delete messages");
  }
};

export const bulkDeleteForAll = async (chatId, messageIds) => {
  try {
    const res = await api.put(`/api/ecosystem/chat/${chatId}/messages/bulk-delete-all`, { messageIds });
    return res.data;
  } catch (err) {
    return fail(err, "Could not delete messages");
  }
};

export const toggleMuteChat = async (chatId, muted) => {
  try {
    const res = await api.put(`/api/ecosystem/chat/${chatId}/mute`, { muted });
    return res.data;
  } catch (err) {
    return fail(err, "Could not update mute setting");
  }
};

export const toggleFavoriteChat = async (chatId, favorite) => {
  try {
    const res = await api.put(`/api/ecosystem/chat/${chatId}/favorite`, { favorite });
    return res.data;
  } catch (err) {
    return fail(err, "Could not update favorite");
  }
};