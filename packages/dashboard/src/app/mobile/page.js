import AppHero from '../components/AppLanding/AppHero';
import ProblemSolution from '../components/AppLanding/ProblemSolution';
import FeaturePreview from '../components/AppLanding/FeaturePreview';
import WaitlistCTA from '../components/AppLanding/WaitlistCTA';

export const metadata = {
  title: 'Interworky — Your AI Executive Assistant',
  description:
    'You talk. It listens. It remembers. It plans. It executes. One app for all your work. Coming soon.',
  keywords: [
    'AI executive assistant',
    'productivity app',
    'work assistant',
    'mobile app',
    'iOS app',
    'task management',
    'calendar',
    'files',
    'reminders',
  ],
  openGraph: {
    title: 'Interworky — Your AI Executive Assistant',
    description:
      'You talk. It listens. It remembers. It plans. It executes. Coming soon.',
    type: 'website',
    url: 'https://interworky.com/mobile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interworky — Your AI Executive Assistant',
    description:
      'You talk. It listens. It remembers. It plans. It executes. Coming soon.',
  },
};

export default function MobileAppLandingPage() {
  return (
    <main className="min-h-screen bg-black">
      <AppHero />
      <ProblemSolution />
      <FeaturePreview />
      <WaitlistCTA />

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-10">
        <div className="lg:max-w-7xl sm:px-10 md:px-12 lg:px-5 px-5 mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">iW</span>
              </div>
              <span className="text-white font-semibold">Interworky</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-gray-300 transition-colors">Terms</a>
              <a href="https://multisync.io" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">MultiSync</a>
            </div>
            <p className="text-gray-600 text-sm">&copy; 2026 MultiSync LLC</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
