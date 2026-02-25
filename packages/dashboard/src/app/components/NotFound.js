import Image from 'next/image';

const NotFound = ({ title }) => {
  return (
    <div className="top-1/2 left-1/2 absolute flex flex-col items-center justify-center gap-10 -translate-x-1/2 -translate-y-1/2">
      <div>
        <Image src={'/not-found.svg'} height={250} width={250} alt="not-found-icon" />
      </div>
      <div>
        <h1 className="text-title font-bold text-center text-secondary">{title}</h1>
      </div>
    </div>
  );
};

export default NotFound;
