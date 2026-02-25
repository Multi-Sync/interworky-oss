'use client';

import Head from 'next/head';
import Navbar from '@/app/components/Landing/Navbar';
import FooterSection from '@/app/components/Landing/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'service', title: 'Description of Service' },
    { id: 'accounts', title: 'User Accounts' },
    { id: 'acceptable-use', title: 'Acceptable Use' },
    { id: 'privacy', title: 'Privacy Policy' },
    { id: 'fees', title: 'Fees and Payments' },
    { id: 'termination', title: 'Termination' },
    { id: 'liability', title: 'Limitation of Liability' },
    { id: 'changes', title: 'Changes to Terms' },
    { id: 'contact', title: 'Contact Information' },
  ];

  const scrollToSection = sectionId => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white relative overflow-hidden">
      <Head>
        <title>Terms of Service | Interworky</title>
        <meta
          name="description"
          content="Interworky's Terms of Service - Learn about the terms and conditions governing your use of our AI-powered services."
        />
        <link rel="canonical" href="https://www.interworky.com/terms" />
      </Head>

      <Navbar />

      {/* Decorative shapes */}
      <div className="xl:block hidden absolute -right-32 top-[20%] w-[400px] h-[400px] z-10 pointer-events-none">
        <Image src="/shapes/green-star.svg" alt="" width={400} height={400} className="w-full h-full object-contain" />
      </div>
      <div className="xl:block hidden absolute -right-32 top-[28%] w-[600px] h-[600px] z-10 pointer-events-none">
        <Image src="/shapes/blured-star.svg" alt="" width={600} height={600} className="w-full h-full object-contain" />
      </div>

      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-32 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 mb-2">Effective Date: February 01, 2025</p>
          <p className="text-base text-gray-500 max-w-3xl mx-auto">
            These Terms of Service govern your use of Interworky&apos;s AI-powered services. By using our service, you
            agree to these terms and conditions.
          </p>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-50 rounded-xl p-6 mb-12"
        >
          <h2 className="text-2xl font-semibold text-secondary mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`text-left p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  activeSection === section.id ? 'bg-primary text-white' : 'text-gray-700 hover:text-primary'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Overview Section */}
          <motion.section
            id="overview"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Overview</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Interworky. These Terms of Service (&quot;Terms&quot;) govern your access to and use of
                Interworky&apos;s services, including our AI-powered website analytics and chatbot services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part
                of these terms, then you may not access the Service.
              </p>
            </div>
          </motion.section>

          {/* Acceptance of Terms Section */}
          <motion.section
            id="acceptance"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">1. Acceptance of Terms</h2>
            <div className="bg-blue-50 border-l-4 border-primary p-6 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed">
                By accessing or using Interworky (&quot;Service&quot;), you agree to comply with and be bound by these
                Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
              </p>
            </div>
          </motion.section>

          {/* Description of Service Section */}
          <motion.section
            id="service"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">2. Description of Service</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Interworky provides AI-powered website analytics and chatbot services to businesses and website owners.
                Our services include:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary mb-2">AI Analytics</h4>
                  <p className="text-gray-700">
                    Advanced website analytics powered by artificial intelligence to provide insights and
                    recommendations.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-secondary mb-2">Chatbot Services</h4>
                  <p className="text-gray-700">
                    Intelligent chatbot solutions to enhance customer engagement and support.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* User Accounts Section */}
          <motion.section
            id="accounts"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">3. User Accounts</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                To use certain features of our Service, you may be required to create an account. You are responsible
                for:
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary mb-1">Account Security</h4>
                    <p className="text-gray-700">
                      Maintaining the confidentiality of your account credentials and password.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary mb-1">Account Activity</h4>
                    <p className="text-gray-700">All activities that occur under your account or password.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary mb-1">Account Information</h4>
                    <p className="text-gray-700">
                      Providing accurate and complete information when creating your account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Acceptable Use Section */}
          <motion.section
            id="acceptable-use"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">4. Acceptable Use</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-secondary mb-4">
                You agree not to misuse the Service, including but not limited to:
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Violating any applicable laws or regulations</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Attempting to interfere with the Service&apos;s functionality</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Using the Service to distribute malware or harmful content</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Engaging in any activity that could harm our systems or other users
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Privacy Policy Section */}
          <motion.section
            id="privacy"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">5. Privacy Policy</h2>
            <div className="bg-primary-light rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms
                by reference.
              </p>
              <Link
                href="/privacy"
                className="inline-flex items-center space-x-2 text-primary font-semibold hover:underline"
              >
                <span>Read our Privacy Policy</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </Link>
            </div>
          </motion.section>

          {/* Fees and Payments Section */}
          <motion.section
            id="fees"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">6. Fees and Payments</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Some features of the Service may require payment. By purchasing, you agree to pay all applicable fees as
                outlined on our pricing page.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary mb-2">Payment Terms</h4>
                <ul className="text-gray-700 space-y-1">
                  <li>• All fees are non-refundable unless otherwise stated</li>
                  <li>• Prices may change with 30 days notice</li>
                  <li>• Payment is due immediately upon purchase</li>
                  <li>• Failed payments may result in service suspension</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Termination Section */}
          <motion.section
            id="termination"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">7. Termination</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-secondary mb-4">We reserve the right to:</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Suspend or terminate your access to the Service at our sole discretion if you violate these Terms
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Discontinue the Service at any time with reasonable notice</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">Remove or delete any content that violates these Terms</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Limitation of Liability Section */}
          <motion.section
            id="liability"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">8. Limitation of Liability</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-secondary mb-4">Important Legal Notice</h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                Interworky is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
                direct, indirect, or incidental damages resulting from your use of the Service.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• We do not guarantee uninterrupted or error-free service</p>
                <p>• We are not responsible for any data loss or corruption</p>
                <p>• Our liability is limited to the amount you paid for the service</p>
                <p>• We are not liable for any third-party actions or content</p>
              </div>
            </div>
          </motion.section>

          {/* Changes to Terms Section */}
          <motion.section
            id="changes"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">9. Changes to Terms</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We may update these Terms at any time. The latest version will be available on this page.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary mb-2">Notification Process</h4>
                <p className="text-gray-700">
                  We will notify you of any material changes to these Terms via email or through a prominent notice on
                  our website. Your continued use of the Service after such changes constitutes acceptance of the new
                  Terms.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Contact Information Section */}
          <motion.section
            id="contact"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">10. Contact Information</h2>
            <div className="bg-primary-light rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a href="mailto:hello@interworky.com" className="text-primary font-semibold hover:underline">
                    hello@interworky.com
                  </a>
                </div>

                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">MultiSync Inc., Delaware, United States</span>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Back to Top Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center mt-16"
        >
          <button
            onClick={() => scrollToSection('overview')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Back to Top</span>
          </button>
        </motion.div>
      </div>

      <FooterSection />
    </div>
  );
}
