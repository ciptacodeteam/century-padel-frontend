import MainHeader from '@/components/headers/MainHeader';
import { getWhatsappMessageUrl } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Century Padel',
  description: 'Terms and conditions for using Century Padel services'
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <MainHeader backHref="/" title="Terms & Conditions" withLogo={false} withBorder />
      <div className="mx-auto mt-28 mb-16 max-w-3xl px-4 lg:mt-32 lg:px-0">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold lg:text-3xl">Century Padel</h1>
            <p className="text-muted-foreground text-xs lg:text-sm">Last updated: June 3, 2026</p>
          </div>

          <div className="prose prose-slate mt-2 max-w-none space-y-6 text-sm lg:text-base">
            <p>
              Welcome to Century Padel. By accessing our website and booking a court, you agree to
              comply with the following Terms & Conditions. Please read them carefully before using
              our services.
            </p>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">1. Definitions</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>&ldquo;We&rdquo; / &ldquo;Century Padel&rdquo;:</strong> The operator of
                  padel court rental services.
                </li>
                <li>
                  <strong>&ldquo;Customer&rdquo; / &ldquo;You&rdquo;:</strong> An individual or
                  party who books a court through the website.
                </li>
                <li>
                  <strong>&ldquo;Service&rdquo;:</strong> The padel court booking facility provided
                  through the website.
                </li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">2. Website Use</h2>
              <p>By using this website, you confirm that:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>The information you provide is true and accurate</li>
                <li>You will not use the website for illegal actions or to harm other parties</li>
                <li>You will not attempt to hack, damage, or disrupt our system</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">3. User Accounts</h2>
              <p>To make a booking, you may need to create an account. You are responsible for:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Maintaining the confidentiality of your account and password</li>
                <li>Monitoring all activities that occur under your account</li>
                <li>Providing valid information</li>
              </ul>
              <p>We reserve the right to deactivate accounts that violate these terms.</p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">4. Court Bookings</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>A booking is considered successful once payment is confirmed by the system.</li>
                <li>
                  You must ensure that the selected schedule is correct before making payment.
                </li>
                <li>We do not guarantee court availability before the transaction is completed.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">5. Prices and Payments</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Court rental prices may change at any time without prior notice.</li>
                <li>
                  All payments must be made through the payment methods available on the website.
                </li>
                <li>If a double payment occurs, the customer is entitled to request a refund.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">6. Cancellation Policy</h2>
              <p>Cancellations are subject to the following rules:</p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">a. Cancellation by Customer</h3>
                  <p>
                    Customers cannot cancel bookings. However, if there are special circumstances,
                    please contact us for further discussion.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">b. Cancellation by Century Padel</h3>
                  <p>We reserve the right to cancel a booking if any of the following occurs:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Facility damage</li>
                    <li>Operational issues</li>
                  </ul>
                  <p className="mt-2">Customers are entitled to reschedule their booking.</p>
                </div>
              </div>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">7. Reschedule Policy</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>No refunds are available; bookings may only be rescheduled</li>
                <li>Reschedule requests must be made no later than D-3, or 3 days before play</li>
                <li>Rescheduling is only allowed once per booking</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">8. Court Usage Rules</h2>
              <p>Customers are required to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Use the facilities responsibly</li>
                <li>Not damage any property or equipment</li>
                <li>Not perform actions that endanger themselves or others</li>
                <li>Follow instructions from Century Padel staff</li>
              </ul>
              <p>
                If damage occurs due to customer negligence, replacement or repair costs will be
                charged to the customer.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">9. Late Arrival</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Rental time cannot be extended if the customer arrives late.</li>
                <li>No refunds will be given for lost playing time.</li>
                <li>
                  If the customer does not arrive before the session ends, the booking is forfeited.
                </li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">10. Liability</h2>
              <p>Century Padel is not responsible for:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Personal injury caused by customer negligence</li>
                <li>Loss of personal belongings within the court area</li>
                <li>
                  Service disruptions caused by circumstances beyond the operator&apos;s control
                </li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">11. Changes to Terms</h2>
              <p>We reserve the right to change these Terms & Conditions at any time.</p>
              <p>Changes take effect once published on this page.</p>
            </section>

            <hr className="border-border my-8" />

            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">12. Contact</h2>
              <p>For questions or assistance, please contact:</p>
              <div className="space-y-2 pl-6">
                <p>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:quantumsportsandsocialclub@gmail.com"
                    className="text-primary hover:underline"
                  >
                    quantumsportsandsocialclub@gmail.com
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{' '}
                  <a
                    href={getWhatsappMessageUrl(
                      '+6282311160880',
                      'Hello, I would like to ask about Century Padel.'
                    )}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +62 812-3456-7890
                  </a>
                </p>
                <p>
                  <strong>Venue Address:</strong> JI. Cemara No.51, Pulo Brayan Bengkel Baru, Kec.
                  Medan Tim., Kota Medan, Sumatera Utara 20237
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
