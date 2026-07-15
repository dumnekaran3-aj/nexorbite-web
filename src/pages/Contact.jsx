export default function Contact() {
  return (
    <div className="bg-navy-900 text-white min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-400 mb-12">
          Have questions? We'd love to hear from you.
        </p>

        <div className="grid grid-cols-1 gap-6 text-left">
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-brand-400 font-semibold mb-1">📧 Email</h3>
            <p className="text-gray-400">support@nexorbite.com</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-brand-400 font-semibold mb-1">🏢 Founded By</h3>
            <p className="text-gray-400">Karan & Aryan — Co-Founders, NexOrbit</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-brand-400 font-semibold mb-1">📍 Based In</h3>
            <p className="text-gray-400">India</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-brand-400 font-semibold mb-1">⏰ Response Time</h3>
            <p className="text-gray-400">We typically respond within 24-48 hours.</p>
          </div>

        </div>
      </div>
    </div>
  );
}