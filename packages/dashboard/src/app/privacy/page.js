'use client';

import Head from 'next/head';
import Navbar from '@/app/components/Landing/Navbar';
import FooterSection from '@/app/components/Landing/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'definitions', title: 'Definitions' },
    { id: 'data-collection', title: 'Data Collection' },
    { id: 'data-usage', title: 'Data Usage' },
    { id: 'data-sharing', title: 'Data Sharing' },
    { id: 'data-security', title: 'Data Security' },
    { id: 'your-rights', title: 'Your Rights' },
    { id: 'cookies', title: 'Cookies' },
    { id: 'children', title: "Children's Privacy" },
    { id: 'changes', title: 'Changes' },
    { id: 'contact', title: 'Contact Us' },
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
        <title>Privacy Policy | Interworky</title>
        <meta
          name="description"
          content="Interworky's Privacy Policy - Learn how we collect, use, and protect your personal information. Your privacy is our priority."
        />
        <link rel="canonical" href="https://www.interworky.com/privacy" />
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 mb-2">Last updated: June 09, 2022</p>
          <p className="text-base text-gray-500 max-w-3xl mx-auto">
            This Privacy Policy describes how Interworky collects, uses, and protects your personal information when you
            use our service. Your privacy is fundamental to our mission.
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
                This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your
                information when You use the Service and tells You about Your privacy rights and how the law protects
                You.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We use Your Personal data to provide and improve the Service. By using the Service, You agree to the
                collection and use of information in accordance with this Privacy Policy.
              </p>
            </div>
          </motion.section>

          {/* Definitions Section */}
          <motion.section
            id="definitions"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Interpretation and Definitions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-secondary mb-3">Interpretation</h3>
                <p className="text-gray-700 leading-relaxed">
                  The words of which the initial letter is capitalized have meanings defined under the following
                  conditions. The following definitions shall have the same meaning regardless of whether they appear in
                  singular or in plural.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-secondary mb-4">Definitions</h3>
                <p className="text-gray-700 mb-4">For the purposes of this Privacy Policy:</p>

                <div className="grid gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary mb-2">Account</h4>
                    <p className="text-gray-700">
                      A unique account created for You to access our Service or parts of our Service.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary mb-2">Company</h4>
                    <p className="text-gray-700">
                      MultiSync Inc., a Delaware C-Corporation (referred to as either &quot;the Company&quot;,
                      &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement).
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary mb-2">Cookies</h4>
                    <p className="text-gray-700">
                      Small files that are placed on Your computer, mobile device or any other device by a website,
                      containing the details of Your browsing history on that website among its many uses.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary mb-2">Personal Data</h4>
                    <p className="text-gray-700">
                      Any information that relates to an identified or identifiable individual.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary mb-2">Service</h4>
                    <p className="text-gray-700">
                      Refers to Interworky, accessible from{' '}
                      <a href="https://interworky.com" className="text-primary underline">
                        https://interworky.com
                      </a>
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-secondary mb-2">You</h4>
                    <p className="text-gray-700">
                      The individual accessing or using the Service, or the company, or other legal entity on behalf of
                      which such individual is accessing or using the Service.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Data Collection Section */}
          <motion.section
            id="data-collection"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Collecting and Using Your Personal Data</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-secondary mb-3">Types of Data Collected</h3>

                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-primary p-4 rounded-r-lg">
                    <h4 className="font-semibold text-secondary mb-2">Personal Data</h4>
                    <p className="text-gray-700 mb-3">
                      While using Our Service, We may ask You to provide Us with certain personally identifiable
                      information that can be used to contact or identify You. Personally identifiable information may
                      include, but is not limited to:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Email address</li>
                      <li>First name and last name</li>
                      <li>Phone number</li>
                      <li>Usage Data</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-secondary mb-2">Usage Data</h4>
                    <p className="text-gray-700 mb-3">Usage Data is collected automatically when using the Service.</p>
                    <p className="text-gray-700">
                      Usage Data may include information such as Your Device&apos;s Internet Protocol address (e.g. IP
                      address), browser type, browser version, the pages of our Service that You visit, the time and
                      date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic
                      data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Data Usage Section */}
          <motion.section
            id="data-usage"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Use of Your Personal Data</h2>

            <p className="text-gray-700 mb-4">The Company may use Personal Data for the following purposes:</p>

            <div className="grid gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-secondary mb-1">To provide and maintain our Service</h4>
                  <p className="text-gray-700">Including to monitor the usage of our Service.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-secondary mb-1">To manage Your Account</h4>
                  <p className="text-gray-700">
                    To manage Your registration as a user of the Service. The Personal Data You provide can give You
                    access to different functionalities of the Service that are available to You as a registered user.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-secondary mb-1">To contact You</h4>
                  <p className="text-gray-700">
                    To contact You by email, telephone calls, SMS, or other equivalent forms of electronic
                    communication, such as a mobile application&apos;s push notifications regarding updates or
                    informative communications related to the functionalities, products or contracted services.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-secondary mb-1">To provide You</h4>
                  <p className="text-gray-700">
                    With news, special offers and general information about other goods, services and events which we
                    offer that are similar to those that you have already purchased or enquired about unless You have
                    opted not to receive such information.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Data Sharing Section */}
          <motion.section
            id="data-sharing"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Sharing Your Personal Data</h2>

            <p className="text-gray-700 mb-4">We may share Your personal information in the following situations:</p>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary mb-2">With Service Providers</h4>
                <p className="text-gray-700">
                  We may share Your personal information with Service Providers to monitor and analyze the use of our
                  Service, to contact You.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary mb-2">For business transfers</h4>
                <p className="text-gray-700">
                  We may share or transfer Your personal information in connection with, or during negotiations of, any
                  merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to
                  another company.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary mb-2">With Your consent</h4>
                <p className="text-gray-700">
                  We may disclose Your personal information for any other purpose with Your consent.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Data Security Section */}
          <motion.section
            id="data-security"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Security of Your Personal Data</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-secondary mb-2">Important Security Notice</h4>
                  <p className="text-gray-700">
                    The security of Your Personal Data is important to Us, but remember that no method of transmission
                    over the Internet, or method of electronic storage is 100% secure. While We strive to use
                    commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute
                    security.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Your Rights Section */}
          <motion.section
            id="your-rights"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Your Privacy Rights</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-primary-light p-6 rounded-lg">
                <h4 className="font-semibold text-secondary mb-3">Access Your Data</h4>
                <p className="text-gray-700">
                  You have the right to request access to the personal data we hold about you.
                </p>
              </div>

              <div className="bg-primary-light p-6 rounded-lg">
                <h4 className="font-semibold text-secondary mb-3">Correct Your Data</h4>
                <p className="text-gray-700">
                  You have the right to request correction of any inaccurate personal data we hold about you.
                </p>
              </div>

              <div className="bg-primary-light p-6 rounded-lg">
                <h4 className="font-semibold text-secondary mb-3">Delete Your Data</h4>
                <p className="text-gray-700">
                  You have the right to request deletion of your personal data in certain circumstances.
                </p>
              </div>

              <div className="bg-primary-light p-6 rounded-lg">
                <h4 className="font-semibold text-secondary mb-3">Object to Processing</h4>
                <p className="text-gray-700">
                  You have the right to object to our processing of your personal data in certain circumstances.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Cookies Section */}
          <motion.section
            id="cookies"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Tracking Technologies and Cookies</h2>

            <p className="text-gray-700 mb-4">
              We use Cookies and similar tracking technologies to track the activity on Our Service and store certain
              information. The technologies We use may include:
            </p>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary mb-2">Necessary / Essential Cookies</h4>
                <p className="text-gray-700 mb-2">Type: Session Cookies</p>
                <p className="text-gray-700 mb-2">Administered by: Us</p>
                <p className="text-gray-700">
                  Purpose: These Cookies are essential to provide You with services available through the Website and to
                  enable You to use some of its features.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary mb-2">Functionality Cookies</h4>
                <p className="text-gray-700 mb-2">Type: Persistent Cookies</p>
                <p className="text-gray-700 mb-2">Administered by: Us</p>
                <p className="text-gray-700">
                  Purpose: These Cookies allow us to remember choices You make when You use the Website, such as
                  remembering your login details or language preference.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Children's Privacy Section */}
          <motion.section
            id="children"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Children&apos;s Privacy</h2>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-secondary mb-2">Age Restriction</h4>
                  <p className="text-gray-700 mb-3">
                    Our Service does not address anyone under the age of 13. We do not knowingly collect personally
                    identifiable information from anyone under the age of 13.
                  </p>
                  <p className="text-gray-700">
                    If You are a parent or guardian and You are aware that Your child has provided Us with Personal
                    Data, please contact Us. If We become aware that We have collected Personal Data from anyone under
                    the age of 13 without verification of parental consent, We take steps to remove that information
                    from Our servers.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Changes Section */}
          <motion.section
            id="changes"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Changes to this Privacy Policy</h2>

            <div className="space-y-4">
              <p className="text-gray-700">
                We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new
                Privacy Policy on this page.
              </p>
              <p className="text-gray-700">
                We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming
                effective and update the &quot;Last updated&quot; date at the top of this Privacy Policy.
              </p>
              <p className="text-gray-700">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
                Policy are effective when they are posted on this page.
              </p>
            </div>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            id="contact"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="scroll-mt-20"
          >
            <h2 className="text-3xl font-bold text-secondary mb-6">Contact Us</h2>

            <div className="bg-primary-light rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, You can contact us:
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
