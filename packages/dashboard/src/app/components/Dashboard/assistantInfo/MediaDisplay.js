import Image from 'next/image';

const MediaDisplay = ({ mediaUrl, width, height, style }) => {
  const isVideo = /\.(mp4)$/i.test(mediaUrl); // Check if the URL ends with `.mp4`
  const staticClassName = style;
  return (
    <>
      {isVideo ? (
        <video
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          controlsList="nodownload nofullscreen noremoteplayback"
          className={staticClassName}
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <Image src={mediaUrl} width={width} height={height} className={staticClassName} alt="Agent Profile Picture" />
      )}
    </>
  );
};

export default MediaDisplay;
