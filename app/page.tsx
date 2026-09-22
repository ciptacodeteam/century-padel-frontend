import ComingSoonView from '@/components/coming-soon/ComingSoonView';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import BannerSection from '@/components/section/home/BannerSection';
import MembershipCtaSection from '@/components/section/home/MembershipCtaSection';
import MenuSection from '@/components/section/home/MenuSection';
import SponsorshipMarqueSection from '@/components/section/home/SponsorshipMarqueSection';
import BookingSection from '@/components/section/home/BookingSection';
import InfoSection from '@/components/section/home/InformationSection';
import { isComingSoonEnabled } from '@/lib/coming-soon';
import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  if (!isComingSoonEnabled()) return {};

  return {
    title: 'Coming Soon | Century Padel Medan',
    description:
      'Century Padel Medan segera hadir. Lapangan padel premium, komunitas, dan booking online di Medan Polonia.'
  };
}

export default function HomePage() {
  if (isComingSoonEnabled()) {
    return <ComingSoonView />;
  }

  return (
    <>
      <MainHeader withNotificationBadge withBorder />
      <main className="mt-26 lg:mt-28">
        <BannerSection />
        <MenuSection />
        <BookingSection />
        <InfoSection />
        <SponsorshipMarqueSection />
        {/* <ActiveCourtSection /> */}
        <MembershipCtaSection />
      </main>
      <MainBottomNavigation />
    </>
  );
}
