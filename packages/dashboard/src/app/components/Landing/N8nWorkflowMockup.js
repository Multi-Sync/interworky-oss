'use client';

import Image from 'next/image';
import { N8nLogo, GoogleSheetsLogo, SlackLogo, HubSpotLogo } from '../ProductIcons/IntegrationLogos';

export default function N8nWorkflowMockup() {
  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Container */}
      <div className="relative rounded-[24px] h-[340px] md:h-[400px]">
        {/* Inner container */}
        <div className="bg-[#0F1615] border border-white/10 backdrop-blur-lg rounded-[20px] p-5 h-full flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <N8nLogo className="w-8 h-8" />
            <div>
              <h4 className="text-white font-semibold text-sm">n8n Workflow</h4>
              <p className="text-gray-400 text-xs">Powered by Interworky</p>
            </div>
          </div>

          {/* Simple workflow list */}
          <div className="space-y-3">
            {/* Step 1: Interworky Trigger */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 p-1.5">
                <Image src="/logo.jpg" alt="Interworky" width={28} height={28} className="object-contain rounded" />
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-medium">Interworky Trigger</p>
                <p className="text-gray-400 text-[10px]">On new lead captured</p>
              </div>
              <div className="text-emerald-400 text-lg">→</div>
            </div>

            {/* Step 2: Google Sheets */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center shadow-lg">
                <GoogleSheetsLogo className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-medium">Add to Sheet</p>
                <p className="text-gray-400 text-[10px]">Save lead data</p>
              </div>
              <div className="text-purple-400 text-lg">→</div>
            </div>

            {/* Step 3: Parallel actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 bg-white/5 rounded-lg p-2 border border-purple-400/30">
                <div className="w-8 h-8 bg-white/10 border border-purple-400/40 rounded-md flex items-center justify-center">
                  <SlackLogo className="w-4 h-4" />
                </div>
                <p className="text-white text-[10px] font-medium">Notify Team</p>
              </div>
              <div className="flex items-center gap-2 flex-1 bg-white/5 rounded-lg p-2 border border-pink-400/30">
                <div className="w-8 h-8 bg-white/10 border border-pink-400/40 rounded-md flex items-center justify-center">
                  <HubSpotLogo className="w-4 h-4" />
                </div>
                <p className="text-white text-[10px] font-medium">Create Contact</p>
              </div>
            </div>
          </div>

          {/* Footer stats */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-gray-400 text-xs">200+ integrations</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-medium rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
