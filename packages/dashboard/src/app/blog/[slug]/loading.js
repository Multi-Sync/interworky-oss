'use client';

import { BeatLoader } from 'react-spinners';

export default function Loading() {
  return (
    <div className="flex justify-center items-center w-full min-h-screen">
      <BeatLoader color="#058A7C" size={20} />
    </div>
  );
}
