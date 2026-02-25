'use client';

import AssistantCapabilities from './Capabilities';
import CustomCapabilities from './CustomCapabilities';

const CapabilitiesTab = () => {
  return (
    <div className="w-full" id="enable-appointments">
      <div className="flex flex-col items-center gap-8 mt-6">
        <AssistantCapabilities />
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CustomCapabilities />
      </div>
    </div>
  );
};

export default CapabilitiesTab;
