export default function CancellationRefund() {
  return (
    <div className="bg-navy-900 text-white min-h-screen px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Cancellation & Refunds Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: July 2026</p>

        {[
          {
            title: "1. Digital Products — General Policy",
            content: "Since all products sold on NexOrbite are digital and are unlocked instantly upon successful payment, purchases generally cannot be cancelled or refunded once the product has been accessed or downloaded. Please review the product description, preview, and seller details carefully before purchasing."
          },
          {
            title: "2. Eligible Refund Cases",
            content: "A refund may be requested only in the following situations: (a) payment was deducted from your account but the product was not unlocked in your library due to a technical error, (b) you were charged more than once for the same product due to a duplicate transaction, or (c) the delivered product is significantly different from its description (e.g. corrupted or empty files)."
          },
          {
            title: "3. How to Request a Refund",
            content: "To request a refund, email us at support@nexorbite.com within 7 days of the transaction with your registered email, the product name, and the payment/transaction reference ID. Our team will review the request and respond within 3-5 business days."
          },
          {
            title: "4. Refund Processing",
            content: "Approved refunds are processed back to the original payment method via our payment partner (Razorpay) and typically reflect within 5-7 business days, depending on your bank or UPI provider. If a seller's payout for that transaction has already been withdrawn, NexOrbite will recover the corresponding amount from the seller's future earnings."
          },
          {
            title: "5. Cancellation Before Delivery",
            content: "Because digital delivery happens instantly upon successful payment, there is no order-processing window in which a purchase can be manually cancelled before delivery. If a payment is stuck or pending for an unusually long time, contact support and we will investigate before any product access is granted."
          },
          {
            title: "6. Seller Withdrawals",
            content: "This policy governs refunds to buyers. It is separate from seller payouts — sellers can withdraw their available earnings to their UPI ID subject to the minimum withdrawal amount shown in their Earnings dashboard."
          },
          {
            title: "7. Contact Us",
            content: "For any cancellation or refund queries, reach out to us at support@nexorbite.com."
          },
        ].map((s) => (
          <div key={s.title} className="mb-8">
            <h2 className="text-xl font-semibold mb-2 text-brand-400">{s.title}</h2>
            <p className="text-gray-400 leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}