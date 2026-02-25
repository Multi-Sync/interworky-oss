'use client';

import InfoLabel from '@/app/components/InfoTooltip';
import ToggleSwitch from '@/app/components/ToggleSwitch';
import { useAssistantContext } from '@/_common/context/AssistantContext';

export default function AssistantCapabilities() {
  const { state, dispatch } = useAssistantContext();

  return (
    <div className="w-full space-y-4">
      {/* Existing Managed Capabilities UI */}
      <div className="flex items-center gap-2 text-secondary">
        {/* <h2 className="py-3 text-base font-semiBold">Managed capabilities</h2> */}
        <InfoLabel
          label="Managed Capabilities"
          tooltipText="These are built-in features that can be activated with a toggle."
        />
      </div>
      <div className="lg:grid-cols-2 grid grid-cols-1 gap-4">
        <div className="w-full">
          <ToggleSwitch
            id="contact-toggle"
            label="Collect email prior to chat"
            checked={state.contactInfoRequired}
            onChange={() =>
              dispatch({
                type: 'SET_CAPABILITIES',
                payload: { contactInfoRequired: !state.contactInfoRequired },
              })
            }
          />
        </div>
        <div className="w-full">
          <ToggleSwitch
            id="appointment-toggle"
            label={
              <div className="flex items-center">
                <div>Appointment Mode</div>
                <div className="ml-3 hidden sm:block"></div>
                <span className="ml-2 ">
                  <InfoLabel tooltipText=" Enable Appointments to start receiving Appointment request from your Agent." />
                </span>
              </div>
            }
            checked={state.enableAppointments}
            onChange={() =>
              dispatch({
                type: 'SET_CAPABILITIES',
                payload: { enableAppointments: !state.enableAppointments },
              })
            }
          />
        </div>
        <div className="w-full">
          <ToggleSwitch
            id="voice-toggle"
            label={
              <div className="flex items-center">
                <div>Voice Mode</div>
              </div>
            }
            checked={state.voiceEnabled}
            onChange={() =>
              dispatch({
                type: 'SET_CAPABILITIES',
                payload: { voiceEnabled: !state.voiceEnabled },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
