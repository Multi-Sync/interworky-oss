'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    if (window.innerWidth >= 768) {
      router.push('/dashboard/home');
    }
  }, [router]);

  return (
    <div className="md:hidden h-screen">
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <Image src={'/dashboard-mobile.svg'} width={300} height={300} alt="image" />
        <h1 className="mb-4 text-m text-secondary">
          While our mobile view has essential features, the full dashboard experience - including our tutorial page - is
          best enjoyed on a desktop.
        </h1>
        <Button onClick={() => router.push('/dashboard/home')} intent={'underline'}>
          Continue with mobile
        </Button>
      </div>
    </div>
  );
};

export default Page;
