import { CalendarDays, PackageCheck, Trophy, UsersRound } from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import court from '@/public/assets/img/court.webp';
import club from '@/public/assets/img/club.webp';
import membership from '@/public/assets/img/membership.webp';
import tournament from '@/public/assets/img/tournament.webp';

type HomeMenuItem = {
  title: string;
  subtitle: string;
  href: string;
  image: StaticImageData;
  icon: React.ReactNode;
};

const menuList: HomeMenuItem[] = [
  {
    title: 'Booking',
    subtitle: 'Quick & Easy',
    href: '/booking',
    image: court,
    icon: <CalendarDays className="size-5" strokeWidth={2.5} />
  },
  {
    title: 'Club',
    subtitle: 'Find Playmates',
    href: '/clubs',
    image: club,
    icon: <UsersRound className="size-5" strokeWidth={2.5} />
  },
  {
    title: 'Value Pack',
    subtitle: 'Save More',
    href: '/membership',
    image: membership,
    icon: <PackageCheck className="size-5" strokeWidth={2.5} />
  },
  {
    title: 'Tournament',
    subtitle: 'Join Events',
    href: '/tournaments',
    image: tournament,
    icon: <Trophy className="size-5" strokeWidth={2.5} />
  }
];

const MenuSection = () => {
  return (
    <section className="mx-auto my-8 w-11/12 lg:hidden">
      <div className="grid grid-cols-2 gap-3">
        {menuList.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            prefetch
            className="group overflow-hidden border border-black/10 bg-white transition active:scale-[0.98]"
          >
            <div className="relative">
              <div className="relative h-24 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="50vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/25" />
              </div>

              <div className="bg-primary absolute -bottom-5 left-4 flex size-10 items-center justify-center text-white">
                {item.icon}
              </div>
            </div>

            <div className="px-4 pt-8 pb-4">
              <h2 className="text-base leading-tight font-semibold text-neutral-800">
                {item.title}
              </h2>
              <p className="mt-1 text-xs leading-tight font-medium text-neutral-400">
                {item.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MenuSection;
