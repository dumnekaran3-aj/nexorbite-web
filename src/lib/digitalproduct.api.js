// src/api/digitalProduct.api.js
//
// Har function ka backend route yahan comment mein likha hai —
// koi bhi field yahan se backend controller ke expected req.body/req.files
// se match honi chahiye. Agar backend route change ho, YAHAN update karo.

import api from "../lib/api";

const BASE = "/api/digital-products";

// ── POST /api/digital-products/create ──────────────────────────────────────
// multer .fields() expects: cover (required) + dynamic slot fields (per branch)
// body: title, description, branch, category, price, attributes(JSON string), pushTo
export const createDigitalProduct = async (formData) => {
  const res = await api.post(`${BASE}/create`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { success, product }
};

// ── GET /api/digital-products/all ───────────────────────────────────────────
// query: branch, category, search, seller, page, limit
export const getAllProducts = async (params = {}) => {
  const res = await api.get(`${BASE}/all`, { params });
  return res.data; // { success, count, totalProducts, data }
};

// ── GET /api/digital-products/slots ─────────────────────────────────────────
// (authoritative slot definitions from backend — constants file is a mirror/fallback)
export const getSlotDefinitions = async () => {
  const res = await api.get(`${BASE}/slots`);
  return res.data; // { success, data: BRANCH_ASSET_SLOTS }
};

// ── GET /api/digital-products/my-products ───────────────────────────────────
// ⚠️ Backend returns 404 when seller has ZERO products — NOT an error state.
export const getMyProducts = async () => {
  try {
    const res = await api.get(`${BASE}/my-products`);
    return res.data.data || [];
  } catch (err) {
    if (err?.response?.status === 404) return []; // empty state, not a failure
    throw err;
  }
};

// ── DELETE /api/digital-products/delete/:productId ──────────────────────────
export const deleteDigitalProduct = async (productId) => {
  const res = await api.delete(`${BASE}/delete/${productId}`);
  return res.data; // { success, message }
};

// ── GET /api/digital-products/my-library ────────────────────────────────────
export const getUserLibrary = async () => {
  const res = await api.get(`${BASE}/my-library`);
  return res.data; // { success, count, data }
};

// ── GET /api/digital-products/:productId ────────────────────────────────────
export const getProductDetails = async (productId) => {
  const res = await api.get(`${BASE}/${productId}`);
  return res.data.data; // product object (assets stripped if no access)
};

// ── POST /api/digital-products/:productId/leave ─────────────────────────────
// Called on modal-close / navigate-away — tells backend to stop bounce timer
export const leaveProductEngagement = async (productId) => {
  const res = await api.post(`${BASE}/${productId}/leave`);
  return res.data;
};

// ── GET /api/digital-products/download-bundle/:productId ────────────────────
// Downloads the ENTIRE bundle as one ZIP file (not one-by-one asset downloads).
// Uses blob + responseType because the request needs the Authorization header
// (a plain <a href> / window.open can't attach that header).
export const downloadProductBundle = async (productId, productTitle = "bundle") => {
  const res = await api.get(`${BASE}/download-bundle/${productId}`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "application/zip" });
  const url = window.URL.createObjectURL(blob);
  const safeName = productTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 60) || "bundle";

  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}_bundle.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// ── GET /api/digital-products/download/:productId/:slot ─────────────────────
// (kept for potential future single-file use — not used in the UI anymore)
export const getAssetDownloadUrl = async (productId, slot) => {
  const res = await api.get(`${BASE}/download/${productId}/${slot}`);
  return res.data; // { success, downloadUrl, label }
};

// ── POST /api/digital-products/:productId/claim-free ────────────────────────
// NEW endpoint (backend addition needed — see claimFreeProduct.diff.js)
// Only works when product.price === 0.
export const claimFreeProduct = async (productId) => {
  const res = await api.post(`${BASE}/${productId}/claim-free`);
  return res.data; // { success, message, assets }
};