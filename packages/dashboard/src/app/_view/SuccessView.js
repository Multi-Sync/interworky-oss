'use client';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import CheckInboxButton from '../components/auth/CheckInboxButton';

const SuccessView = () => {
  const params = useSearchParams();
  const type = params.get('type');

  const renderContent = type => {
    switch (type) {
      case 'register':
        return (
          <div className="text-center">
            <Image src="/email-sent.png" alt="Success" width={50} height={50} className="mx-auto mb-4" />
            <h2 className="text-lg font-semiBold text-secondary">We sent you an email</h2>
            <p className=" text-secondary-light">Please check your inbox for a registration email from Interworky.</p>
          </div>
        );
      case 'reset':
        return (
          <div className="text-center">
            <Image src="/email-sent.png" alt="Success" width={50} height={50} className="mx-auto mb-4" />
            <h2 className="text-lg font-semiBold text-secondary">We sent you an email</h2>
            <p className=" text-secondary-light">Please check your inbox for a registration email from Interworky.</p>
          </div>
        );
      case 'onboarding':
        return (
          <div className="text-center flex flex-col items-center">
            <Image
              src="/finallogo.png"
              alt="Interworky Logo"
              width={223}
              height={31}
              className="mb-8 w-[122px] h-auto lg:w-[223px]"
            />
            <Image src="/email-sent.png" alt="Success" width={50} height={50} className="mx-auto mb-4" />
            <h2 className="text-lg font-semiBold text-secondary">We sent you an email</h2>
            <p className=" text-secondary-light">Please check your inbox for an onboarding email from Interworky.</p>

            <CheckInboxButton userEmail={params.get('email')} />
            <span className="text-secondary-light subTitle primary-light">
              Didn&apos;t receive email!
              <br />
              Contact hello@interworky.com{' '}
            </span>
          </div>
        );
      case 'fallback':
        return (
          <div className="text-center">
            <Image src="/email-sent.png" alt="Success" width={50} height={50} className="mx-auto mb-4" />
            <h2 className="text-lg font-semiBold text-secondary">Success</h2>
            <p className=" text-secondary-light">Your action was successful.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-gray-100  rounded-lg shadow-md">
      {renderContent(type)}
    </div>
  );
};

export default SuccessView;
