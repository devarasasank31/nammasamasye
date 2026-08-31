'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">Terms of Use</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Terms of Use</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              By using Namma Samasye, you agree to these terms. This platform helps citizens document
              and navigate reported incidents. It is not a replacement for official channels.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Not an Emergency Service</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Namma Samasye is NOT an emergency-response service. If you are in immediate danger,
              please call emergency services at 112.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Not Legal Advice</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Namma Samasye does not provide legal advice. AI outputs are advisory and do not constitute
              legal conclusions. Consult a legal professional for legal matters.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Not a Determination of Guilt</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Namma Samasye does not determine guilt, corruption, or wrongdoing. Reports are community-submitted
              and unverified unless explicitly stated otherwise by an authorized authority.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">User Responsibilities</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Do not submit knowingly false reports</li>
              <li>Do not use the platform for targeted harassment</li>
              <li>Do not publish personal information of others</li>
              <li>Do not submit fabricated evidence</li>
              <li>Do not use the platform for threats or hate speech</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Community Reports</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Community reports are not automatically verified facts. They are submitted by users and
              reviewed by administrators. Display of community reports does not establish wrongdoing.
            </p>
          </section>
        </div>

        {/* Community Guidelines */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Community Guidelines</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Be truthful and accurate in your reports</li>
              <li>Do not target specific individuals publicly</li>
              <li>Do not share others&apos; personal information</li>
              <li>Do not submit revenge content or harassment</li>
              <li>Do not fabricate evidence</li>
              <li>Respect the privacy of others</li>
            </ul>
          </section>
        </div>

        {/* Safety Disclaimer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Safety Disclaimer</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Namma Samasye helps citizens document incidents and navigate available resources.
              It does not guarantee resolution, does not dispatch emergency responders,
              and does not replace official authorities. Your safety is your priority.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
