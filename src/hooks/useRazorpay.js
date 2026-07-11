// src/hooks/useRazorpay.js
//
// FIX 1: Razorpay handler mein verifyPayment ke baad caller ko
//         success signal dena zaroori tha — ab Promise resolve/reject properly karta hai
// FIX 2: Script already loaded check — duplicate script injection avoid kiya
// FIX 3: payment_failed event properly reject karta hai

import { useState } from "react";
import { createOrder, verifyPayment } from "../lib/PaymentApi";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    // Already loaded check
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);

  const buyProduct = async (product, userInfo = {}) => {
    setLoading(true);

    try {
      // Step 1: Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Razorpay SDK load nahi hua. Internet check karo.");

      // Step 2: Backend se order banao
      const orderData = await createOrder(product._id);
      if (!orderData?.success) throw new Error(orderData?.message || "Order create nahi hua");

      // Step 3: Razorpay checkout open karo — Promise mein wrap karo
      await new Promise((resolve, reject) => {
        const options = {
          key:      orderData.keyId,
          amount:   orderData.amount,
          currency: "INR",
          name:     "NexOrbite",
          description: product.title,
          image:    product.thumbnailUrl || "",
          order_id: orderData.orderId,
          prefill: {
            name:  userInfo.userName  || "",
            email: userInfo.userEmail || "",
          },
          theme: { color: "#7c3aed" },

          handler: async (response) => {
            try {
              // Step 4: Verify karo backend pe
              const verifyRes = await verifyPayment({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                productId:           product._id,
              });

              if (verifyRes?.success) {
                resolve(verifyRes);
              } else {
                reject(new Error(verifyRes?.message || "Payment verify nahi hua"));
              }
            } catch (err) {
              reject(err);
            }
          },

          modal: {
            ondismiss: () => reject(new Error("Payment cancel kar diya")),
          },
        };

        // payment_failed event
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          reject(new Error(resp?.error?.description || "Payment fail ho gayi"));
        });
        rzp.open();
      });

    } finally {
      setLoading(false);
    }
  };

  return { buyProduct, loading };
};