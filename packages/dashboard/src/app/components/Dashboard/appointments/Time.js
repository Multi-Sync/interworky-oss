import Image from 'next/image';

const Time = ({ status, date }) => {
  let displayTime = new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  let iconSrc = '/clock.svg';
  // Parse the time string into hours and minutes
  const hours = new Date(date).getHours();
  if (status === 'Requested') {
    if (hours >= 8 && hours < 10) {
      displayTime = 'Early Morning';
      iconSrc = '/morning.svg';
    } else if (hours >= 10 && hours < 12) {
      displayTime = 'Morning';
      iconSrc = '/morning.svg';
    } else if (hours >= 12 && hours < 17) {
      displayTime = 'Afternoon';
      iconSrc = '/afternoon.svg';
    } else {
      displayTime = 'Evening';
      iconSrc = '/evening.svg';
    }
  }
  return (
    <div className="flex gap-1 text-secondary">
      <Image src={iconSrc} alt={displayTime} width={15} height={15} />
      {displayTime}
    </div>
  );
};

export default Time;
