import { useEffect, useRef, useState } from 'react';

const PatientInfo = ({ patient, isOpen, onToggle }) => {
  const ref = useRef(null);
  const [showAbove, setShowAbove] = useState(false);

  useEffect(() => {
    const handleClickOutside = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        onToggle();
      }
    };

    const checkPosition = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        setShowAbove(rect.bottom > viewportHeight - 150);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      checkPosition();
      window.addEventListener('resize', checkPosition);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', checkPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', checkPosition);
    };
  }, [isOpen, onToggle]);

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-4 h-4 text-tertiary cursor-pointer transition-all duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        onClick={onToggle}
        fill="none"
        viewBox="0 0 24 24"
        stroke="#908E8E"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
      </svg>

      {isOpen && (
        <div className={`absolute ${showAbove ? 'bottom-full' : 'top-full'}`} ref={ref}>
          <div
            className={`absolute flex flex-col gap-3 w-fit h-fit ${showAbove ? 'bottom-0' : 'top-0'} -left-full lg:left-[70%] shadow-lg z-40 border border-[#D9D9D9] bg-white rounded-lg py-[25px] px-5 text-left`}
          >
            <p className="text-primary text-nowrap">
              Name:{' '}
              <span className="text-secondary">
                {patient.first_name || 'Anonymous'} {patient.last_name || 'Anonymous'}
              </span>
            </p>
            <p className="text-primary text-nowrap">
              Phone: <span className="text-secondary">{patient.phone || 'N/A'}</span>
            </p>
            <p className="text-primary text-nowrap">
              Email: <span className="text-secondary">{patient.email || 'Anonymous'}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientInfo;
