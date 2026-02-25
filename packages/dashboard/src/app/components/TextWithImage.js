import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import Image from 'next/image';
import VoiceInterface from './Landing/BenefitsComponents/voice-interface';
import VoiceAIIcon from './ProductIcons/VoiceAIIcon';
import N8nWorkflowMockup from './Landing/N8nWorkflowMockup';
import AutoDiscoveryIcon from './ProductIcons/AutoDiscoveryIcon';

const containerVariants = cva('flex gap-8 md:gap-20 justify-between md:min-h-[320px] z-10 flex-col md:flex-row', {
  variants: {
    order: {
      row: 'md:flex-row',
      reverse: 'md:flex-row-reverse',
    },
  },
  defaultVariants: {
    order: 'row',
  },
});

const textVariants = cva('flex justify-center md:justify-start', {
  variants: {
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    },
  },
  defaultVariants: {
    align: 'center',
  },
});

const TextWithImage = ({ order, align, imageSrc, icon: IconComponent, containerClassName, children, alt }) => {
  // Check if we should render special components
  const isVoiceAI = IconComponent === VoiceAIIcon;
  const isCustomization = IconComponent === AutoDiscoveryIcon;

  return (
    <div className={cn(containerVariants({ order }), containerClassName)}>
      <div className="flex-shrink-0 w-full lg:w-[500px] flex justify-center items-center px-6 md:px-0 relative z-0">
        {/* Gradient frame container matching N8nWorkflowMockup size */}
        <div className="relative w-full max-w-md">
          {isVoiceAI ? (
            // Render VoiceInterface directly without the frame (it has its own)
            <div className="overflow-hidden md:overflow-visible">
              <VoiceInterface isInView={true} showWaveform={true} />
            </div>
          ) : isCustomization ? (
            // Render N8nWorkflowMockup for the n8n integration section
            <div className="relative">
              <N8nWorkflowMockup />
            </div>
          ) : (
            <div className="h-[340px] md:h-[400px] flex items-center justify-center">
              {IconComponent ? (
                <IconComponent className="w-full max-w-[380px] max-h-[340px]" />
              ) : (
                <Image
                  src={imageSrc}
                  alt={alt}
                  width={380}
                  height={340}
                  className="w-full max-w-[380px] max-h-[340px] object-contain"
                />
              )}
            </div>
          )}
        </div>
      </div>
      <div className={cn(textVariants({ align }), 'relative z-10')}>
        <div className="h-fit w-full max-w-[400px] px-4 md:px-0 text-center md:text-left">{children}</div>
      </div>
    </div>
  );
};

export default TextWithImage;
