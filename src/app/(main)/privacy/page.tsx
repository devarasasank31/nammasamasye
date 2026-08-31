'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">Privacy Policy</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Anonymous by Default</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Namma Samasye is designed to be anonymous by default. We do not require your name, phone number,
              email address, Aadhaar number, or any social media account to use the service.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">What We Collect</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Anonymous session identifier (random, not linked to identity)</li>
              <li>Incident reports you choose to submit</li>
              <li>Evidence links you choose to attach</li>
              <li>Language preference</li>
              <li>Usage analytics (anonymized)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">What We Do NOT Collect</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Your real name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Aadhaar or government ID</li>
              <li>Social media accounts</li>
              <li>Location data beyond what you voluntarily provide</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Evidence Handling</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Evidence is stored as external links (e.g., Google Drive). We do not host or store media files
              directly in MVP. You are responsible for managing sharing permissions on your external links.
              Evidence is only accessible to authorized administrators for review purposes.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Admin Access</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Authorized administrators can view incident reports and evidence for review purposes.
              All admin actions are logged in an audit trail. Public users can never see another user&apos;s
              identity or private information.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">AI Processing</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              AI is used to understand and classify reports. AI output is advisory only and does not
              determine facts or guilt. AI does not make accusations or legal conclusions.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Community Aggregation</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Community-level statistics are shown as aggregated, anonymized data. We never publicly
              expose individual reports with identifying details. Area-level aggregation is used.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Data Retention</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Incident data is retained for the purpose of tracking and community analytics.
              You may request deletion of your anonymous session data by contacting the administrators.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Limitations</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              While we design for privacy, we cannot guarantee that official government authorities
              will accept anonymous submissions. Official channels may have their own identity requirements.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
