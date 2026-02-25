import Dialog from '../../Dialog';
import FullSurveyRating from './FullSurveyRating';
import Image from 'next/image';
import { useState } from 'react';

export default function FullSurvey({ survey }) {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-[152px] h-[30px] lg:w-[225px] lg:h-[40px] bg-primary-light flex items-center justify-center rounded-md"
      >
        <div className=" flex items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#058A7C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-eye"
          >
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
            <circle cx="12" cy="12" r="3" />
          </svg>

          <p className="text-primary text-body">View Full Survey</p>
        </div>
      </button>
      <Dialog title={'Survey details'} isOpen={isOpen} onClose={onClose} className="min-w-xl w-[520px]">
        <div className="sp flex flex-col space-y-5">
          <div className="flex items-center  gap-6 lg:gap-[22px] ">
            <h1 className="py-4 font-bold text-base capitalize">
              {survey.patient.first_name} {survey.patient.last_name}
            </h1>
            <FullSurveyRating rating={survey.rating} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-primary flex gap-2 text-base font-medium">
              <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
              Rating
            </h3>
            <p className="pl-5 font-medium">{survey.rating} / 5</p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-primary flex gap-2 text-base font-medium">
              <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
              What was good?
            </h3>
            <p className="pl-5 font-medium">{survey.what_was_good} </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-primary flex gap-2 text-base font-medium">
              <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
              What was bad?
            </h3>
            <p className="pl-5 font-medium">{survey.what_was_bad} </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-primary flex gap-2 text-base font-medium">
              <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
              Can we use your feedback in marketing?
            </h3>
            <p className="pl-5 font-medium">
              {survey.can_we_add_you_as_a_happy_customer_on_our_social_website ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </Dialog>
      {/* <Dialog open={isOpen} onClose={() => setIsOpen(false)} className=" relative z-50">
        <DialogBackdrop className="bg-secondary/30 fixed inset-0" />
        <div className=" lg:p-4 fixed inset-0 flex items-center justify-center w-screen text-secondary bg-[#D9D9D999]">
          <DialogPanel className="bg-white rounded-[10px] border border-primary py-10 lg:py-12 px-12 lg:px-[60px] w-[375px] lg:w-[716px] lg:h-[660px] shadow-lg relative mr-auto lg:mr-0 md:mr-0">
            <button className="top-10 right-12 lg:top-14 lg:right-12 absolute w-6 h-6" onClick={() => setIsOpen(false)}>
              <XMarkIcon />
            </button>
            <DialogTitle className="text-lg lg:text-[28px] lg:text-center mb-16">Survey details</DialogTitle>
            <div className="sp flex flex-col space-y-5">
              <div className="flex items-center  gap-6 lg:gap-[22px] ">
                <h1 className="lg:text-title text-subTitle font-semiBold capitalize">
                  {survey.patient.first_name} {survey.patient.last_name}
                </h1>
                <FullSurveyRating rating={survey.rating} />
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-primary lg:text-subTitle flex gap-2 text-base font-medium">
                  <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
                  Rating
                </h3>
                <p className="pl-5 font-medium">{survey.rating} / 5</p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-primary lg:text-subTitle flex gap-2 text-base font-medium">
                  <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
                  What was good?
                </h3>
                <p className="pl-5 font-medium">{survey.what_was_good} </p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-primary lg:text-subTitle flex gap-2 text-base font-medium">
                  <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
                  What was bad?
                </h3>
                <p className="pl-5 font-medium">{survey.what_was_bad} </p>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-primary lg:text-subTitle flex gap-2 text-base font-medium">
                  <Image src={'/circle.svg'} width={8} height={8} alt={'circle-icon'} />
                  Can we use your feedback in marketing?
                </h3>
                <p className="pl-5 font-medium">
                  {survey.can_we_add_you_as_a_happy_customer_on_our_social_website ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog> */}
    </>
  );
}
