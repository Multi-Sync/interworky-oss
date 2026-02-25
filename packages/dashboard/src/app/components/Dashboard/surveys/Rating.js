const Rating = ({ rating }) => {
  return (
    <div
      className="w-[78px] h-[30px] lg:w-[95px] lg:h-[40px] rounded-[28px] border border-[#FFDD67]
  flex justify-center items-center
  "
    >
      <div className="gap flex items-center gap-1 text-secondary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#FFDD67"
          stroke="#FFDD67"
          className="fill-[#FFDD67] stroke-[#FFDD67] mr-2"
        >
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </svg>

        <p> {rating} / 5</p>
      </div>
    </div>
  );
};

export default Rating;
