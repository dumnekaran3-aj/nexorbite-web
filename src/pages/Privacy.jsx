export default function Privacy() {
  return (
    <div className="bg-navy-900 text-white min-h-screen px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: June 2025</p>

        {[
          {
            title: "1. Information We Collect",
            content: "We collect information you provide during registration such as name, email address, college name, and branch. We also collect usage data to improve our services."
          },
          {
            title: "2. How We Use Your Information",
            content: "We use your information to provide and improve NexOrbit services, enable community features, process transactions, and send important updates about your account."
          },
          {
            title: "3. Data Sharing",
            content: "We do not sell your personal data to third parties. Your information may be shared only with payment processors (Razorpay) for transaction purposes."
          },
          {
            title: "4. Data Security",
            content: "We implement industry-standard security measures to protect your data. All data is encrypted in transit using SSL/TLS."
          },
          {
            title: "5. Your Rights",
            content: "You can request deletion of your account and associated data at any time by contacting us at support@nexorbite.com."
          },
          {
            title: "6. Cookies",
            content: "NexOrbit uses minimal cookies for authentication and session management only. We do not use tracking or advertising cookies."
          },
          {
            title: "7. Changes to This Policy",
            content: "We may update this policy from time to time. We will notify users of significant changes via email or in-app notification."
          },
          {
            title: "8. Contact Us",
            content: "If you have any questions about this Privacy Policy, please contact us at support@nexorbite.com."
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