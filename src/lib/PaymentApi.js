// src/api/payment.api.js
import api from "../lib/api";

// ── POST /api/payments/create-order ─────────────────────────────────────────
// body: { productId } → { success, orderId, amount, keyId }
export const createOrder = async (productId) => {
  const res = await api.post(`/api/payments/create-order`, { productId });
  return res.data;
};

// ── POST /api/payments/verify-payment ───────────────────────────────────────
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId }
export const verifyPayment = async (payload) => {
  const res = await api.post(`/api/payments/verify-payment`, payload);
  return res.data; // { success, message, transactionId }
};