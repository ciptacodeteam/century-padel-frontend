'use client';

import logo from '@/assets/img/logo.webp';
import { SUPPORT_PHONE_NUMBER } from '@/lib/constants';
import { cn, getWhatsappMessageUrl } from '@/lib/utils';
import courtImage from '@/public/assets/img/court.webp';
import { IconBrandWhatsapp, IconMail, IconMapPin } from '@tabler/icons-react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { useId } from 'react';

const MAPS_URL = 'https://www.google.com/maps?q=Century+Padel,+Medan+Polonia';
const WHATSAPP_MESSAGE =
  'Halo Century Padel, saya ingin info kapan booking lapangan bisa dibuka.';

const features = [
  { title: '6 Padel Courts', subtitle: 'Premium indoor courts' },
  { title: 'Cafe & Resto', subtitle: 'Stay after the match' },
  { title: 'Online Booking', subtitle: 'Reserve in seconds' }
];

const ease = [0.22, 1, 0.36, 1] as const;

const ComingSoonView = () => {
  const shouldReduceMotion = useReducedMotion();
  const whatsappUrl = getWhatsappMessageUrl(
    SUPPORT_PHONE_NUMBER.replace('+', ''),
    WHATSAPP_MESSAGE
  );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-white">
      <div className="coming-soon-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-40 size-[32rem] rounded-full bg-primary/10 blur-3xl" />

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block">
        <Image
          src={courtImage}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-white/10 via-white/80 to-white" />
      </div>

      <PadelBall
        className="absolute top-[12%] right-[6%] size-10 lg:top-[18%] lg:right-[12%] lg:size-14"
        delay={0.2}
        reduced={shouldReduceMotion}
      />
      <PadelBall
        className="absolute right-[22%] bottom-[22%] hidden size-9 opacity-80 lg:block"
        delay={0.9}
        reduced={shouldReduceMotion}
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-11/12 max-w-7xl flex-col py-8 lg:py-10">
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex items-center justify-between"
        >
          <div className="relative h-14 w-32 lg:h-16 lg:w-40">
            <Image src={logo} alt="Century Padel" fill className="object-contain object-left" />
          </div>
          <span className="text-muted-foreground hidden text-sm tracking-wide uppercase lg:inline">
            Medan Polonia
          </span>
        </motion.header>

        <main className="flex flex-1 flex-col justify-center gap-12 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:py-0">
          <section>
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
              className="flex items-center gap-4"
            >
              <span className="bg-primary h-12 w-1 lg:h-16" />
              <p className="text-primary text-sm font-semibold tracking-[0.22em] uppercase">
                Coming Soon
              </p>
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease }}
              className="text-primary mt-6 max-w-xl text-5xl leading-[0.95] font-semibold tracking-tight lg:text-7xl"
            >
              Segera Hadir
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease }}
              className="text-muted-foreground mt-5 max-w-lg text-base leading-7 lg:text-lg"
            >
              Century Padel Medan sedang merapikan lapangan, komunitas, dan sistem booking online.
              Siapkan raketmu — game pertama sebentar lagi dimulai.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.38, ease }}
              className="mt-8 grid gap-3 sm:grid-cols-3"
            >
              {features.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 + index * 0.08, ease }}
                  className="border border-black/10 bg-white/80 px-4 py-4 backdrop-blur-sm"
                >
                  <h2 className="text-sm font-semibold text-neutral-800">{feature.title}</h2>
                  <p className="mt-1 text-xs text-neutral-400">{feature.subtitle}</p>
                </motion.article>
              ))}
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-primary inline-flex h-12 items-center justify-center gap-2 px-6 text-sm font-medium text-white transition-colors hover:bg-[#cc452c]"
              >
                <IconBrandWhatsapp className="size-5" />
                Hubungi WhatsApp
              </a>
              <a
                href="mailto:centurypadel@gmail.com"
                className="inline-flex h-12 items-center justify-center gap-2 border border-black/10 bg-white px-6 text-sm font-medium text-neutral-800 transition-colors hover:border-primary/40 hover:text-primary"
              >
                <IconMail className="size-5" />
                centurypadel@gmail.com
              </a>
            </motion.div>

            <motion.a
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="text-muted-foreground hover:text-primary mt-6 inline-flex items-start gap-2 text-sm transition-colors"
            >
              <IconMapPin className="text-primary mt-0.5 size-4 shrink-0" />
              <span>Jalan Mongonsidi No.51, Medan Polonia — 20152, Indonesia</span>
            </motion.a>
          </section>

          <motion.aside
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease }}
            className="relative mx-auto w-full max-w-sm lg:max-w-none"
          >
            <div className="relative overflow-hidden border border-black/10 bg-white p-6 shadow-[0_24px_80px_-32px_rgba(227,83,54,0.45)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold tracking-wide text-neutral-800 uppercase">
                  Court Preview
                </p>
                <span className="relative flex size-2.5">
                  <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                  <span className="bg-primary relative inline-flex size-2.5 rounded-full" />
                </span>
              </div>
              <PadelCourtArt reduced={shouldReduceMotion} />
              <div className="mt-5 flex items-center justify-between text-xs text-neutral-400">
                <span>20m × 10m</span>
                <span>Glass court · Night play ready</span>
              </div>
            </div>
          </motion.aside>
        </main>

        <motion.footer
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-muted-foreground flex items-center justify-between border-t pt-5 text-xs lg:text-sm"
        >
          <span>©{new Date().getFullYear()} Century Padel. All rights reserved.</span>
          <span className="hidden sm:inline">Padel club · Medan</span>
        </motion.footer>
      </div>
    </div>
  );
};

function PadelBall({
  className,
  delay = 0,
  reduced
}: {
  className?: string;
  delay?: number;
  reduced: boolean | null;
}) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <motion.div
      className={cn('pointer-events-none', className)}
      animate={reduced ? undefined : { y: [0, -22, 0], rotate: [0, 160, 360] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <svg viewBox="0 0 64 64" className="size-full drop-shadow-md">
        <defs>
          <radialGradient id={gradientId} cx="32%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#f7ffb0" />
            <stop offset="55%" stopColor="#d4e157" />
            <stop offset="100%" stopColor="#9aaa2a" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill={`url(#${gradientId})`} />
        <path
          d="M14 18c10 8 12 22 4 32M50 14c-8 10-8 24 2 34"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <motion.span
        aria-hidden
        className="absolute -bottom-2 left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-black/20 blur-[2px]"
        animate={reduced ? undefined : { scaleX: [1, 0.55, 1], opacity: [0.35, 0.12, 0.35] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay }}
      />
    </motion.div>
  );
}

function PadelCourtArt({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="relative aspect-[10/16] overflow-hidden bg-[#f7f4f2]">
      <svg viewBox="0 0 200 320" className="h-full w-full">
        <rect width="200" height="320" fill="#f4ece8" />
        <motion.rect
          x="22"
          y="18"
          width="156"
          height="284"
          fill="#e35336"
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <rect x="28" y="24" width="144" height="272" fill="#c94830" />

        <motion.path
          d="M28 160 H172"
          stroke="white"
          strokeWidth="2.5"
          initial={reduced ? undefined : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease }}
        />
        <motion.path
          d="M28 118 H172 M28 202 H172 M100 118 V202"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
          initial={reduced ? undefined : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.55, ease }}
        />
        <motion.rect
          x="28"
          y="24"
          width="144"
          height="272"
          fill="none"
          stroke="white"
          strokeWidth="3"
          initial={reduced ? undefined : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.2, ease }}
        />

        <motion.circle
          cx="100"
          cy="78"
          r="7"
          fill="#d4e157"
          initial={reduced ? false : { opacity: 0, y: -18 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: [0, 8, 0] }}
          transition={
            reduced
              ? { duration: 0.4 }
              : { duration: 1.8, delay: 1.2, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </svg>
      <div className="coming-soon-glass pointer-events-none absolute inset-x-3 top-3 h-16" />
    </div>
  );
}

export default ComingSoonView;
