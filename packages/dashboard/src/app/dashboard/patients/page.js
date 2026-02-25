'use client';

import dynamic from 'next/dynamic';

// Dynamically import with ssr: false to prevent server-side rendering
const PatientsView = dynamic(() => import('@/app/_view/PatientsView'), {
  ssr: false,
});

const Patients = () => {
  return <PatientsView />;
};

export default Patients;
