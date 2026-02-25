'use client';

import Head from 'next/head';
import Navbar from '@/app/components/Landing/Navbar';
import FooterSection from '@/app/components/Landing/Footer';
import Image from 'next/image';

export default function Compliance() {
  return (
    <div className="overflow-hidden relative bg-white">
      <Head>
        <title>Compliance &amp; Security | Interworky</title>
        <meta
          name="description"
          content="Interworky’s compliance posture: infrastructure hardening, data encryption, IAM controls, monitoring, and secure development practices. For full documentation, contact us."
        />
        <link rel="canonical" href="https://www.interworky.com/compliance" />
      </Head>

      <Navbar />

      {/* Decorative shapes */}
      <div className="xl:block hidden absolute -right-32 top-[30%] w-[400px] h-[400px] z-10 pointer-events-none">
        <Image src="/shapes/green-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div className="xl:block hidden absolute -right-32 top-[28%] w-[600px] h-[600px] z-10 pointer-events-none">
        <Image src="/shapes/blured-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div className="xl:block hidden absolute right-28 top-[33%] z-20 w-16 h-16 pointer-events-none">
        <Image src="/shapes/gold-star.svg" alt="" fill style={{ objectFit: 'contain' }} />
      </div>

      <div className="flex flex-col justify-center items-center my-14 space-y-6">
        <h1 className="max-w-4xl text-4xl font-bold capitalize md:text-5xl lg:text-6xl xl:text-7xl text-primary">
          Compliance &amp; Security
        </h1>
      </div>

      <div className="flex flex-col gap-12 px-6 py-16 mx-auto max-w-4xl md:px-16 lg:px-32 text-secondary">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Infrastructure Hardening</h2>
          <p>
            Production and staging run on Google Cloud Compute Engine instances in multi-zone VPC networks, secured
            behind an HTTP/2-enabled Load Balancer. All ingress/egress traffic is encrypted with TLS 1.3 certificates
            provisioned via Let’s Encrypt (Certbot) and auto-renewed. Instances are hardened according to CIS benchmarks
            and receive automated OS patching.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Data Encryption &amp; Access Controls</h2>
          <p>
            We store customer data in a dedicated MongoDB replica set with the WiredTiger encrypted storage engine
            (AES-256). In-transit data uses TLS 1.3. Access is restricted via GCP IAM roles and service accounts under
            the principle of least privilege. SSH access requires key-based auth with 90-day rotation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Identity &amp; Authentication</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>MFA Enforcement:</strong> Admin consoles protected by multi-factor authentication (TOTP/U2F).
            </li>
            <li>
              <strong>JWT &amp; Keys:</strong> API clients authenticate using JWTs signed with RSA-2048 key pairs.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Monitoring &amp; Incident Response</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Cloud Monitoring &amp; Logging:</strong> Aggregates system, audit, and application logs with
              90-day retention.
            </li>
            <li>
              <strong>Sentry:</strong> Real-time error tracking and performance alerts.
            </li>
            <li>
              <strong>Alerting:</strong> PagerDuty notifications for P1/P2 incidents with 1-hour acknowledgment SLA.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Email &amp; Payments</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>SendGrid:</strong> Configured with DKIM, SPF, and DMARC for authenticated email delivery.
            </li>
            <li>
              <strong>Stripe:</strong> Uses Stripe Checkout (PCI DSS Level 1) so no card data is stored on our servers.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Secure Development Lifecycle</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>GitHub PRs:</strong> Branch protection, mandatory peer reviews, and enforced code coverage.
            </li>
            <li>
              <strong>CI/CD &amp; Scans:</strong> Automated unit/integration tests, ESLint, and Dependabot security
              updates on every push.
            </li>
            <li>
              <strong>Dependency Management:</strong> NPM audit and GitHub Security Alerts monitored weekly.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Standards &amp; Certifications</h2>
          <p>
            We align our controls with ISO 27001:2013 and SOC 2 Type II frameworks. A formal SOC 2 audit is scheduled
            for Q3 2025.
          </p>
        </section>

        <section className="pt-8 space-y-2 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-secondary">Full Compliance Documentation</h2>
          <p>
            For detailed network diagrams, policy matrices, and audit reports, please email{' '}
            <a href="mailto:hello@interworky.com" className="font-semibold underline text-primary">
              hello@interworky.com
            </a>
            . Sensitive implementation details are redacted here for security.
          </p>
        </section>
      </div>

      <FooterSection />
    </div>
  );
}
