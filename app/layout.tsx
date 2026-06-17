import AppProvider from '@/providers/AppProvider';
import DesktopFooter from '@/components/footers/DesktopFooter';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';

import Script from 'next/script';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Century Padel Medan | Booking Lapangan Century Padel Secara Online',
  description:
    'Century Padel Medan hadir dengan fasilitas padel modern dan sistem booking online yang mudah. Cek jadwal lapangan, pilih waktu bermain, dan lakukan reservasi dalam hitungan detik.',

  verification: {
    google: 'tN-4z93m_2EmHsvCDPWEXlLrfjinAPNNcBGpuYZH4LE'
  },
  
  keywords: [
    'century padel',
    'century padel medan',
    'padel medan',
    'lapangan padel medan',
    'booking padel medan',
    'booking lapangan padel',
    'sewa lapangan padel',
    'padel indonesia',
    'main padel medan',
    'reservasi padel online',
    'court padel medan',
    'sports club medan',
    'padel club medan',
    'padel court medan'
  ],

  alternates: {
    canonical: 'https://www.centurypadelid.com/'
  },

  openGraph: {
    title: 'Century Padel Medan | Booking Lapangan Century Padel Secara Online',
    description:
      'Century Padel Medan hadir dengan fasilitas padel modern dan sistem booking online yang mudah.',
    url: 'https://www.centurypadelid.com/',
    siteName: 'Century Padel',
    images: [
      {
        url: 'https://www.centurypadelid.com/assets/img/og-image.png',
        width: 1200,
        height: 1200,
        alt: 'Century Padel - Booking Lapangan Online'
      }
    ],
    locale: 'id_ID',
    type: 'website'
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={cn('antialiased', plusJakartaSans.className, plusJakartaSans.variable)}>
        <AppProvider>{children}</AppProvider>
        <DesktopFooter />

        {/* ✅ JSON-LD Structured Data */}
        <Script
          id="json-ld-century-padel"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SportsActivityLocation',
              name: 'Century Padel',
              description:
                'Century Padel Medan hadir dengan fasilitas padel modern dan sistem booking online yang mudah.',
              url: 'https://www.centurypadelid.com/',
              image: 'https://www.centurypadelid.com/assets/img/og-image.png',
              logo: 'https://www.centurypadelid.com/assets/img/og-image.png',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'ID',
                addressRegion: 'Indonesia'
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday'
                  ],
                  opens: '06:00',
                  closes: '00:00'
                }
              ],
              potentialAction: {
                '@type': 'ReserveAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://www.centurypadelid.com/booking'
                },
                result: {
                  '@type': 'Reservation',
                  name: 'Booking Lapangan Padel Century Padel'
                }
              }
            })
          }}
        />
      </body>
    </html>
  );
}
