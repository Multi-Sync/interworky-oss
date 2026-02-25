import InfoLabel from '../../InfoTooltip';
import MediaDisplay from './MediaDisplay';
import { useAssistantContext } from '@/_common/context/AssistantContext';

const AssistantProfilePicture = ({ onFileChange }) => {
  const { state } = useAssistantContext();

  return (
    <>
      <div className="flex-1">
        <InfoLabel label={'Agent Profile Picture'} tooltipText={'Give your AI Agent a profile picture'} />
      </div>
      <div className="flex-[2] self-center justify-center items-start  ">
        <div className="w-fit relative -ml-20">
          <MediaDisplay
            mediaUrl={state.imageUrl}
            alt="Uploaded profile"
            width={153}
            height={153}
            style={
              'object-cover mb-4 rounded-full w-[103px] ring-2 ring-primary ring-offset-2 ring-offset-[#0a0e27] h-[103px]'
            }
          />
          <label
            htmlFor="myFile"
            className="cursor-pointer absolute bottom-0 right-1 bg-gradient-to-r from-primary to-primary text-white p-2 rounded-full hover:shadow-lg hover:shadow-primary/50 transition-all border border-primary/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M7 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1" />
                <path d="M20.385 6.585a2.1 2.1 0 0 0-2.97-2.97L9 12v3h3zM16 5l3 3" />
              </g>
            </svg>
            <input type="file" id="myFile" name="filename" className="hidden" onChange={onFileChange} />
          </label>
        </div>
      </div>
    </>
  );
};

export default AssistantProfilePicture;
