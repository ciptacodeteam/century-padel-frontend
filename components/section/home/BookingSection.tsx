import BookingPageContent from '@/components/booking/BookingPageContent';
import { Button } from '@/components/ui/button';

import Image from 'next/image';
import court1 from '@/public/court1.webp';

export default function BookingSection() {
  return (
    <>
      <section className="hidden lg:block">
        <div className="mx-auto my-20 w-11/12 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-primary me-6 h-16 w-1"></span>
              <p className="text-primary w-2/3 text-2xl font-semibold">
                Book Your Court in Seconds{' '}
                <span className="text-black">With Real Time Availability</span>
              </p>
            </div>

            <div>
              <Button className="bg-primary h-11 px-6 text-white hover:bg-[#cc452c]">
                Booking Now
              </Button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-4 gap-4">
            <div className="col-span-3 border border-gray-200">
              <BookingPageContent embedded />
            </div>
            <div className="border border-gray-200 p-4">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <Image src={court1} alt="banner1" />
                </div>
                <div>
                  <h1 className="mb-2 text-lg font-semibold">Membership Program</h1>
                  <p className="mb-2 text-sm text-gray-400">
                    Exclusive access, premium benefits, and a better experience await you.
                  </p>
                  <Button className="bg-primary h-11 w-full px-6 text-white hover:bg-[#cc452c]">
                    Unlock Benefits
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
