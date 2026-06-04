'use client';

import Image from 'next/image';
import Marquee from 'react-fast-marquee';
import { useQuery } from '@tanstack/react-query';
import { partnershipsQueryOptions } from '@/queries/partnership';

const SponsorshipMarqueSection = () => {
  const { data: partnerships, isLoading } = useQuery(partnershipsQueryOptions());

  // Don't render if loading or no partnerships
  if (isLoading || !partnerships || partnerships.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto lg:my-28 w-11/12 lg:max-w-7xl pb-38 lg:pb-0">
      <main className="mx-auto">
        <div className='text-center mb-8'>
          <h1 className='text-gray-500'>Sponsor & Partnership</h1>
        </div>
        <div className="relative overflow-hidden">
          {/* left gradient overlay */}
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-linear-to-r from-white via-white/80 to-transparent" />

          {/* right gradient overlay */}
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-linear-to-l from-white via-white/80 to-transparent" />

          <Marquee autoFill speed={50}>
            {partnerships.map((partnership) => (
              <Image
                key={partnership.id}
                src={partnership.logo || ''}
                alt={partnership.name}
                unoptimized
                className="h-auto w-30 object-contain px-4 transition duration-300 ease-in-out sm:h-12 md:w-42 lg:w-46 lg:px-8"
                width={100}
                height={100}
              />
            ))}
          </Marquee>
        </div>
      </main>
    </section>
  );
};
export default SponsorshipMarqueSection;
