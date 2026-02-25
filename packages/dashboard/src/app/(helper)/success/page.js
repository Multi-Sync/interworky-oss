import { Suspense } from 'react';
import SuccessView from '@/app/_view/SuccessView';
import { BeatLoader } from 'react-spinners';

function SuccessPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-interworky-gradient">
      <SuccessView />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <BeatLoader color="#058A7C" size={24} />
        </div>
      }
    >
      <SuccessPage />
    </Suspense>
  );
}
