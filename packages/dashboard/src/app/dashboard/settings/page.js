import SettingsView from '@/app/_view/SettingsView';
import ThemeToggle from '@/app/components/ThemeToggle';

const Settings = () => {
  return (
    <div className="relative min-h-screen pb-20">
      {/* Theme Toggle - Top Right */}
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <SettingsView />
    </div>
  );
};

export default Settings;
