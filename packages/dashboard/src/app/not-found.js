'use client';
import Link from 'next/link';
import { Button } from './components/ui/Button';

const Custom404 = () => {
  return (
    <main className="flex flex-col justify-center items-center space-y-8 h-screen bg-black">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg">Page not found</p>
      <Link href="/">
        <Button className={'text-white bg-primary'}>Return to Home</Button>
      </Link>
    </main>
  );
};

export default Custom404;
