export default function ShippingPolicy() {
  return (
    <div className="bg-navy-900 text-white min-h-screen px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Shipping Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: July 2026</p>

        {[
          {
            title: "1. Nature of Our Products",
            content: "NexOrbite is a digital-goods marketplace. Every product listed and sold on the platform — including but not limited to source code, CAD files, PCB layouts, UI kits, notes, and completed academic/software projects — is delivered electronically. No physical items are shipped by NexOrbite or by sellers through the platform."
          },
          {
            title: "2. Delivery Method",
            content: "Once a payment is successfully verified, the purchased digital product is instantly unlocked and made available in the buyer's account under \"My Library\". No courier, postal service, or physical transit is involved at any stage."
          },
          {
            title: "3. Delivery Timeline",
            content: "Delivery is instant and automatic upon successful payment confirmation. In rare cases of a payment-processing delay, access is granted as soon as the payment is confirmed by our payment partner, typically within a few minutes."
          },
          {
            title: "4. Non-Delivery Issues",
            content: "If a payment was successfully deducted but the corresponding product does not appear in your account within 30 minutes, please contact us immediately at support@nexorbite.com with your payment reference/transaction ID, and we will resolve it promptly."
          },
          {
            title: "5. Future Physical Products",
            content: "Should NexOrbite introduce physical products (such as hardware kits) in the future, a dedicated shipping process, timeline, and applicable charges will be clearly communicated at the time of purchase and this policy will be updated accordingly."
          },
          {
            title: "6. Contact Us",
            content: "For any questions regarding delivery of your digital purchase, reach out to us at support@nexorbite.com."
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