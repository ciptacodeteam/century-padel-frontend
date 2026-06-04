'use client';

import logo from '@/assets/img/logo.webp';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const footerLinks = [
  { title: 'Home', path: '/' },
  { title: 'Booking', path: '/booking' },
  { title: 'Club', path: '/clubs' },
  { title: 'Tournaments', path: '/tournaments' },
  { title: 'Membership', path: '/membership' },
  { title: 'Invoice', path: '/invoice' }
];

const DesktopFooter = () => {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="hidden border-t bg-white lg:block">
      {/* <div className="bg-primary py-8 text-center flex">
        <p className="text-base font-medium text-white mb-2">Ready to Host Your Next Padel?</p>
        <p className="text-7xl font-semibold text-white">Let&apos;s Go!</p>
      </div> */}

      <div className="mx-auto grid w-11/12 max-w-7xl grid-cols-[1.4fr_1fr_1fr] gap-10 py-12">
        <section>
          <Link href="/" className="relative block h-16 w-40">
            <Image src={logo} alt="Century Padel" fill className="object-contain object-left" />
          </Link>
          <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-6">
            Book courts, join tournaments, and manage your padel activities in one place.
          </p>
          <p className='text-muted-foreground mt-4 max-w-sm text-sm leading-6'>Jalan Mongonsidi No.51, Medan Polonia - 20152, Indonesia.</p>
        </section>

        <section>
          <h3 className="text-primary mb-4 text-sm font-semibold tracking-wide uppercase">Menu</h3>
          <nav className="grid gap-3">
            {footerLinks.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </section>

        <section>
          <h3 className="text-primary mb-4 text-sm font-semibold tracking-wide uppercase">
            Contact
          </h3>
          <div className="text-muted-foreground space-y-3 text-sm leading-6">
            <p>Century Padel</p>
          </div>
        </section>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto flex w-11/12 max-w-7xl items-center justify-between py-5 text-sm">
          <span>©{new Date().getFullYear()} Century Padel. All rights reserved.</span>
          <Link href="/terms-and-conditions" className="hover:text-primary transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;
