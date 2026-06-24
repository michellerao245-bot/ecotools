import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-8 text-center">
          About <span className="text-blue-500">EcoScanner AI</span>
        </h1>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-gray-400 text-lg leading-relaxed text-center">
            EcoScanner AI ek mission-driven platform hai jo crypto space ko safe aur transparent 
            banana chahta hai. Humara goal investors ko real-time data aur AI-powered insights 
            provide karna hai taaki wo scam-free investment decisions le sakein.
          </p>
        </section>

        {/* Why Choose Us */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Accuracy</h3>
            <p className="text-gray-400 text-sm">Real-time on-chain data analysis jo kabhi jhooth nahi bolta.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Safety First</h3>
            <p className="text-gray-400 text-sm">Rug-pulls aur malicious contracts se bachane ke liye advanced algorithms.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-2">User-Centric</h3>
            <p className="text-gray-400 text-sm">Minimalist design taaki har koi bina kisi mushkil ke use kar sake.</p>
          </div>
        </div>

        {/* Footer/CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm italic">
            "Transparency is the foundation of the future of finance."
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;