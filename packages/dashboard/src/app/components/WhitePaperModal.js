'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function WhitePaperModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent">
            Carla: The AI Agent for Next.js Applications
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-8 text-gray-300">
          <div className="prose prose-invert prose-emerald max-w-none">
            {/* Executive Summary */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">Executive Summary</h3>
              <p className="leading-relaxed">
                Modern web applications face a critical challenge: maintaining consistent performance, reliability, and
                user experience across thousands of devices and browsers.
              </p>
              <p className="leading-relaxed mt-3">
                Carla is an AI-driven agent purpose-built for Next.js developers. It acts as a third eye for your web
                application , continuously monitoring, detecting, and improving performance, usability, and customer
                interactions without human intervention.
              </p>
              <p className="leading-relaxed mt-3">
                Embedded directly into your website and connected to your source code, Carla bridges the gap between
                client-side analytics and server-side intelligence. With Carla, every bug, crash, or missed optimization
                becomes visible , before it impacts your users.
              </p>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* Introduction */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">1. Introduction</h3>
              <p className="leading-relaxed">
                Next.js has become the framework of choice for building fast, dynamic, and scalable web applications.
                Yet as applications scale, so do their challenges:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Errors occur across different browsers and devices.</li>
                <li>User-reported bugs are often vague or missing critical details.</li>
                <li>Performance regressions slip into production unnoticed.</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Carla addresses these challenges by becoming an always-on agent that sees what developers can&apos;t. It
                lives both inside your codebase and within the browser, monitoring your app&apos;s real-world behavior
                across thousands of environments.
              </p>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* What Is Carla */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">2. What Is Carla?</h3>
              <p className="leading-relaxed">
                Carla is an AI agent embedded in your Next.js website and connected to your GitHub repository. It
                operates at two levels:
              </p>
              <ol className="list-decimal list-inside space-y-2 mt-3 ml-4">
                <li>
                  <strong className="text-white">In the Browser</strong> – Observes performance, rendering issues, and
                  client-side errors as users interact with your app.
                </li>
                <li>
                  <strong className="text-white">In the Codebase</strong> – Integrates with GitHub to open pull requests
                  (PRs) with suggested fixes, performance tweaks, or security updates.
                </li>
              </ol>

              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-bold text-cyan-400">Key Capabilities</h4>

                <div className="bg-white/5 border border-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Error Detection and Resolution</h5>
                  <p className="text-sm leading-relaxed">
                    Carla automatically detects frontend issues across browsers and devices, then creates actionable PRs
                    or GitHub issues with suggested fixes.
                  </p>
                </div>

                <div className="bg-white/5 border border-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Performance Monitoring</h5>
                  <p className="text-sm leading-relaxed">
                    Tracks real-time metrics and ensures consistent rendering across platforms. Carla acts as your QA
                    teammate that never sleeps.
                  </p>
                </div>

                <div className="bg-white/5 border border-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Developer-Focused Analytics</h5>
                  <p className="text-sm leading-relaxed">
                    Simplified analytics for developers , highlighting what matters: load times, crash points, and
                    navigation flows. Exportable data lets you feed deeper insights into external tools if needed.
                  </p>
                </div>

                <div className="bg-white/5 border border-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">AI-Powered Customer Support</h5>
                  <p className="text-sm leading-relaxed">
                    Carla includes a fully integrated conversational assistant , available in both voice and text.
                    Trained on your website&apos;s content, it provides human-like support while maintaining brand tone
                    and personality.
                  </p>
                </div>

                <div className="bg-white/5 border border-gray-800 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Multi-Device Awareness</h5>
                  <p className="text-sm leading-relaxed">
                    With over 10,000+ device types and 7 major browsers, Carla ensures your app renders correctly
                    everywhere. Instead of relying on user reports, Carla identifies device-specific bugs automatically.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* Architecture and Integration */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">3. Architecture and Integration</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-cyan-400 mb-2">A. Website Integration</h4>
                  <p className="leading-relaxed">
                    Carla is embedded directly into your Next.js frontend via a lightweight script. Once installed, it
                    begins monitoring:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2 ml-4 text-sm">
                    <li>JavaScript and rendering errors</li>
                    <li>Page load and hydration performance</li>
                    <li>Device and browser compatibility</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-cyan-400 mb-2">B. Source Code Integration</h4>
                  <p className="leading-relaxed">
                    Developers can connect Carla to their GitHub repositories. This enables Carla to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2 ml-4 text-sm">
                    <li>Create automated PRs for detected issues</li>
                    <li>Suggest code optimizations</li>
                    <li>Track deployment health from staging to production</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-cyan-400 mb-2">C. MCP Server Generation</h4>
                  <p className="leading-relaxed">
                    Carla also offers a CLI tool ,{' '}
                    <code className="bg-white/10 px-2 py-1 rounded text-xs">npx carla-nextjs scan</code> , which
                    converts your Next.js project into an MCP (Model Context Protocol) server. This makes your website
                    AI-friendly, allowing Carla and other agents to understand and interact with your site&apos;s APIs.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* Customer Interaction Layer */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">4. The Customer Interaction Layer</h3>
              <p className="leading-relaxed">
                Carla isn&apos;t just a backend observer , it also improves the user experience.
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>
                  <strong className="text-white">Conversational Interface:</strong> Add Carla as a badge, bubble, or
                  embedded widget.
                </li>
                <li>
                  <strong className="text-white">Voice and Text:</strong> Carla speaks naturally with users using the
                  market&apos;s most human-sounding AI voice.
                </li>
                <li>
                  <strong className="text-white">API Integration:</strong> Connect your API routes through MCP to allow
                  Carla to perform real actions (e.g., booking, tracking, or fetching data).
                </li>
              </ul>
              <p className="leading-relaxed mt-3">
                With this setup, Carla becomes a live bridge between your customers, your code, and your development
                team.
              </p>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* Developer Analytics */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">5. Developer Analytics , Simplified</h3>
              <p className="leading-relaxed">
                Traditional analytics platforms overwhelm developers with marketing metrics. Carla flips the script ,
                focusing on what actually matters for web maintenance:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Core Web Vitals and performance bottlenecks</li>
                <li>Error clusters and user impact reports</li>
                <li>Exportable visitor journeys for further analysis</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Currently available as a beta feature, this module ensures that developers get insights without noise.
              </p>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* Philosophy and Pricing */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">6. Philosophy and Pricing</h3>
              <p className="leading-relaxed">
                Carla is built by developers, for developers. The project is entirely self-funded, created without
                venture capital or external pressure , allowing the team to focus on meaningful features instead of
                growth hacks.
              </p>
              <div className="mt-4 bg-emerald-900/20 border border-emerald-800 rounded-lg p-4">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>
                      <strong className="text-white">Current pricing:</strong> $20/month
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">•</span>
                    <span>
                      <strong className="text-white">Future model:</strong> Considering a pay-as-you-go plan for
                      flexibility and accessibility.
                    </span>
                  </li>
                </ul>
              </div>
              <p className="leading-relaxed mt-4">
                The mission is clear: make website maintenance intelligent, automated, and transparent , without locking
                developers into heavy enterprise contracts.
              </p>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* Roadmap */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">7. Roadmap</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-cyan-400 mb-2">In Progress:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Enhanced browser/device compatibility mapping</li>
                    <li>Deeper GitHub Actions integration</li>
                    <li>Improved analytics visualization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-cyan-400 mb-2">Planned:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>MCP-based cross-agent collaboration</li>
                    <li>Pay-as-you-go infrastructure for scalability</li>
                    <li>Advanced voice-based debugging assistant</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-gray-800 my-8" />

            {/* Conclusion */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-3">8. Conclusion</h3>
              <p className="leading-relaxed">
                Carla represents the next step in web application intelligence. By combining AI-driven performance
                monitoring, automatic code updates, and real-time support, Carla acts as a third eye that never blinks ,
                watching over your Next.js application in production.
              </p>
              <p className="leading-relaxed mt-3">
                For developers, this means fewer late-night bug hunts, faster release cycles, and happier users.
              </p>
              <p className="leading-relaxed mt-3 font-semibold text-white">
                Carla isn&apos;t just another analytics tool , she&apos;s your co-developer, QA engineer, and support
                assistant in one.
              </p>
            </section>

            {/* Footer CTA */}
            <div className="mt-8 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-800 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-white mb-4">Ready to get started?</p>
              <code className="bg-black/50 px-4 py-2 rounded text-emerald-400 text-sm">
                npx @interworky/carla-nextjs init
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
