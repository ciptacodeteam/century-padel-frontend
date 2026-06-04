import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import BannerSection from '@/components/section/home/BannerSection';
import MembershipCtaSection from '@/components/section/home/MembershipCtaSection';
import MenuSection from '@/components/section/home/MenuSection';
import SponsorshipMarqueSection from '@/components/section/home/SponsorshipMarqueSection';
import BookingSection from '@/components/section/home/BookingSection';
import InfoSection from '@/components/section/home/InformationSection';

export default function HomePage() {
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
