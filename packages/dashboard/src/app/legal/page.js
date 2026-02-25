'use client';

import Head from 'next/head';
import Navbar from '@/app/components/Landing/Navbar';
import FooterSection from '@/app/components/Landing/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default function Legal() {
  return (
    <div className="bg-white relative overflow-hidden">
      <Head>
        <title>Legal &amp; Corporate Information | Interworky</title>
        <meta
          name="description"
          content="Legal details for Interworky - operated by MultiSync Inc., a Delaware C-Corp. Includes SLA, Terms of Service, Privacy Policy & corporate registry information."
        />
        <link rel="canonical" href="https://www.interworky.com/legal" />
      </Head>

      <Navbar />

      {/* Optional decorative shapes (copy or adjust from Product) */}
      <div className="xl:block hidden absolute -right-32 top-[20%] w-[400px] h-[400px] z-10 pointer-events-none">
        <Image src="/shapes/green-star.svg" alt="" width={400} height={400} className="w-full h-full object-contain" />
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-16 lg:px-32 py-16 flex flex-col gap-12 text-secondary">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary font-bold">Legal &amp; Corporate Information</h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Corporate Details</h2>
          <p>
            <strong>MultiSync Inc.</strong> is a Delaware C-Corporation (File No. 7156443), registered in the State of
            Delaware, USA.
          </p>
          <p>
            <strong>Registered Agent:</strong> As on file with the Delaware Division of Corporations.
          </p>
          <p>
            <strong>Founder &amp; CEO:</strong> Ahmed Schrute an Engineer, with 15+ years in software engineering and AI
            product development.
          </p>
        </section>

        <section className="space-y-6" id="service-level-agreement">
          <h2 className="text-2xl font-semibold text-secondary">Service Level Agreement (SLA)</h2>
          <p className="italic text-sm">Last updated: April 2025</p>
          <table className="table-auto w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="px-4 py-2 text-left">Metric</th>
                <th className="px-4 py-2 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2">Monthly Uptime</td>
                <td className="px-4 py-2">≥ 99.9% (excl. Scheduled Maintenance)</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2">Scheduled Maintenance</td>
                <td className="px-4 py-2">≤ 4 hrs/month (announced ≥ 72 hrs in advance)</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-2">
            <p className="font-semibold">Incident Response:</p>
            <ul className="list-disc list-inside">
              <li>P1 (Critical): acknowledge ≤ 1 hr, resolve ≤ 4 hrs</li>
              <li>P2 (High): acknowledge ≤ 4 hrs, resolve ≤ 1 business day</li>
              <li>P3 (Medium): acknowledge ≤ 1 business day, resolve ≤ 3 business days</li>
              <li>P4 (Low): acknowledge ≤ 2 business days, resolve ≤ 5 business days</li>
            </ul>
          </div>

          <p>
            <strong>Service Credits:</strong> If Monthly Uptime &lt; 99.9%, eligible customers may request a 5% credit
            on that month&apos;s fees. To claim, open a ticket titled &quot;<em>SLA Credit Request</em>&quot; within 30
            days of the incident, including timestamps, email at hello@interworky.com.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-2xl font-semibold text-secondary">Terms of Service</h2>
          <p>
            Our full{' '}
            <Link href="/terms" className="text-primary font-semibold underline">
              Terms of Service
            </Link>{' '}
            govern your use of Interworky.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-2xl font-semibold text-secondary">Privacy Policy</h2>
          <p>
            We respect your privacy. Read our{' '}
            <Link href="/privacy" className="text-primary font-semibold underline">
              Privacy Policy
            </Link>{' '}
            to learn how we collect, use, and protect your data.
          </p>
        </section>
      </div>

      <FooterSection />
    </div>
  );
}
