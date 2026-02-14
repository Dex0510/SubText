import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="text-xl font-bold tracking-tight">Subtext</div>
        <div className="flex items-center gap-6">
          <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link href="/auth" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-6">
          Zero-Knowledge Privacy
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
          Don&apos;t guess.
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Know.</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Get a clinical-grade forensic analysis of your relationship communication.
          Completely private, data-driven, and objective.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/scan"
            className="px-8 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free Analysis
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-4 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            How it works
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          No credit card required • Completely free forever
        </p>
      </section>

      {/* Social proof */}
      <section className="max-w-4xl mx-auto px-6 pb-16 text-center">
        <div className="flex items-center justify-center gap-8 text-gray-400 text-sm">
          <span>Used by 1,000+ people</span>
          <span>|</span>
          <span>4.8 star average rating</span>
          <span>|</span>
          <span>Zero data breaches</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Upload',
              description: 'Drop your screenshots, chat exports, or text messages. We support WhatsApp, iMessage, and more.',
            },
            {
              step: '2',
              title: 'Analyze',
              description: 'Our multi-agent AI council examines your data through 5 specialized lenses — Gottman framework, attachment theory, and more.',
            },
            {
              step: '3',
              title: 'Know',
              description: 'Receive a comprehensive report with evidence-based insights, red flag detection, and actionable guidance.',
            },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-700">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Choose your analysis</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Analysis */}
          <div className="border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="text-sm font-medium text-blue-600">Start Free</div>
            <h3 className="text-2xl font-bold">Free Analysis</h3>
            <div className="text-3xl font-bold">$0</div>
            <p className="text-gray-500">Comprehensive conversation analysis with guided platform export and multiple focus areas. Results in ~15 minutes.</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Platform-specific export guide</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Choose your analysis focus</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Gottman Four Horsemen analysis</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Communication patterns</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Timeline insights</li>
            </ul>
            <Link
              href="/scan"
              className="block text-center py-3 border-2 border-black text-black rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Start Free Analysis
            </Link>
          </div>

          {/* Pro Features */}
          <div className="border-2 border-black rounded-2xl p-8 space-y-4 relative hover:shadow-lg transition-shadow">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
              Most Popular
            </div>
            <div className="text-sm font-medium text-purple-600">Full Suite</div>
            <h3 className="text-2xl font-bold">Pro Features</h3>
            <div className="text-3xl font-bold">$20 <span className="text-sm font-normal text-gray-400">per conversation</span></div>
            <p className="text-gray-500">Deep Analysis, MRI Q&A, and Chat Recommender. 87% less than a single therapy session.</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Everything in Free Analysis</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Deep Analysis (5-agent forensic council)</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> MRI Q&A — ask questions, get answers</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Chat Recommender — suggested replies</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Gottman Scorecard + Attachment Map</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Pattern Analysis + Action Guide</li>
            </ul>
            <Link
              href="/auth"
              className="block text-center py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started — $20
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Your privacy is non-negotiable</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Subtext uses zero-knowledge architecture. Your conversations are encrypted on your device before
            they ever reach our servers. We mathematically cannot read your data.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              { title: 'Client-Side Encryption', desc: 'All PII is detected and masked in your browser before upload' },
              { title: 'Ephemeral Processing', desc: 'Data is automatically deleted within 24 hours' },
              { title: 'Zero-Knowledge', desc: 'Our servers only see tokenized data — names are replaced with [Person A]' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">FAQ</h2>
        <div className="space-y-6">
          {[
            { q: 'Is this therapy?', a: 'No. Subtext is a data analysis tool, not therapy. We identify communication patterns using established research frameworks like the Gottman Method. Always consult a licensed professional for clinical guidance.' },
            { q: 'What formats do you support?', a: 'WhatsApp exports (.txt, .zip), iMessage exports, screenshots (PNG, JPG), CSV, and JSON text logs.' },
            { q: 'How long does analysis take?', a: 'Free Analysis: ~5 minutes. Deep Analysis: 10-20 minutes. MRI Q&A: ~30 seconds per question. Chat Recommender: ~45 seconds.' },
            { q: 'Can you see my conversations?', a: 'No. Your data is encrypted on your device using AES-256 before upload. Our servers process tokenized data where names are replaced with generic labels. We mathematically cannot identify who is in your conversations.' },
            { q: 'What if I get a result I disagree with?', a: 'Our analysis includes confidence scores for each finding. Low-confidence findings are clearly marked. We recommend discussing results with a therapist for personalized interpretation.' },
          ].map(({ q, a }) => (
            <div key={q} className="border-b pb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Stop guessing. Start knowing.</h2>
        <p className="text-gray-500 mb-8">Get objective, data-driven insights in minutes.</p>
        <Link
          href="/scan"
          className="inline-block px-8 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
        >
          Start Your Free Analysis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">&#169; 2026 Subtext. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
