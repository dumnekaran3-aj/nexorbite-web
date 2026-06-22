export default function Terms() {
  return (
    <div className="bg-black text-white min-h-screen px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last updated: June 2025</p>

        {[
          {
            title: "1. Acceptance of Terms",
            content: "By using NexOrbit, you agree to these Terms of Service. If you do not agree, please do not use our platform."
          },
          {
            title: "2. Eligibility",
            content: "NexOrbit is intended for students and educators. You must be at least 13 years old to use this platform."
          },
          {
            title: "3. User Accounts",
            content: "You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration."
          },
          {
            title: "4. Marketplace Rules",
            content: "Sellers are responsible for the accuracy of their product listings. NexOrbit takes a 10% commission on all digital product sales. Physical product transactions are between buyers and sellers directly."
          },
          {
            title: "5. Prohibited Content",
            content: "You may not post illegal, harmful, or misleading content. Academic fraud, plagiarism, or misrepresentation of work is strictly prohibited."
          },
          {
            title: "6. Intellectual Property",
            content: "You retain ownership of content you upload. By posting on NexOrbit, you grant us a license to display your content on our platform."
          },
          {
            title: "7. Termination",
            content: "We reserve the right to suspend or terminate accounts that violate these terms without prior notice."
          },
          {
            title: "8. Limitation of Liability",
            content: "NexOrbit is not liable for any indirect, incidental, or consequential damages arising from use of our platform."
          },
          {
            title: "9. Contact",
            content: "For questions about these Terms, contact us at support@nexorbite.com."
          },
        ].map((s) => (
          <div key={s.title} className="mb-8">
            <h2 className="text-xl font-semibold mb-2 text-purple-400">{s.title}</h2>
            <p className="text-gray-400 leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}