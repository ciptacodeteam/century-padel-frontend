'use client';

import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveMediaUrl } from '@/lib/utils';
import defaultBannerImage from '@/public/assets/img/banner.webp';
import { bannersQueryOptions } from '@/queries/banner';
import type { Banner } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Autoplay from 'embla-carousel-autoplay';
import Image, { type StaticImageData } from 'next/image';
import { useEffect, useRef, useState } from 'react';

type DisplayBanner = {
  id: string;
  image: string | StaticImageData | null;
  link?: string | null;
};

const DEFAULT_BANNERS: DisplayBanner[] = [
  {
    id: 'default-banner',
    image: defaultBannerImage
  }
];

const isBannerWithinSchedule = (banner: Banner, now = dayjs()) => {
  const afterStart = !banner.startAt || !now.isBefore(dayjs(banner.startAt));
  const beforeEnd = !banner.endAt || !now.isAfter(dayjs(banner.endAt));
  return afterStart && beforeEnd;
};

const getBanners = (banners: Banner[] | undefined): DisplayBanner[] => {
  if (!banners || banners.length === 0) {
    return DEFAULT_BANNERS;
  }

  const filtered = banners
    .filter((banner) => banner.isActive && isBannerWithinSchedule(banner))
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  if (filtered.length === 0) {
    return DEFAULT_BANNERS;
  }

  return filtered;
};

const getBannerImageSrc = (image: DisplayBanner['image']) => {
  if (!image || typeof image !== 'string') {
    return image ?? defaultBannerImage;
  }

  return resolveMediaUrl(image) ?? defaultBannerImage;
};

export default function BannerSection() {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const { data, isLoading } = useQuery(bannersQueryOptions());
  const banners = getBanners(data);
  const [emblaApi, setEmblaApi] = useState<any>(null);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [banners.length, emblaApi]);

  if (isLoading) {
    return (
      <section className="mx-auto w-11/12 lg:max-w-7xl">
        <Skeleton className="aspect-[calc(4*3+1)/5] w-full border border-black/10" />
      </section>
    );
  }

  return (
    <section className="mx-auto w-11/12 lg:max-w-7xl">
      <div>
        <Carousel
          plugins={[plugin.current]}
          className="group/carousel relative lg:px-0"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          setApi={setEmblaApi}
        >
          <CarouselContent className="ml-0">
            {banners.map((banner, index) => {
              const image = getBannerImageSrc(banner.image);

              const content = (
                <div className="relative aspect-[calc(4*3+1)/5] w-full overflow-hidden">
                  <Image
                    src={image}
                    alt={banner.id ? `Banner ${banner.id}` : `Banner ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              );

              return (
                <CarouselItem className="basis-full pl-0" key={banner.id || `banner-${index}`}>
                  <div className="overflow-hidden border border-black/10">
                    {banner.link ? (
                      <a
                        href={banner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full w-full"
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <CarouselDots className="absolute bottom-0 left-1/2 mb-4 -translate-x-1/2 lg:bottom-2" />
        </Carousel>
      </div>
    </section>
  );
}
