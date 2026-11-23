import PhonePasswordRecoveryForm from '@/components/forms/auth/PhonePasswordRecoveryForm';

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ phone?: string | string[] }>;
}) {
  const params = await searchParams;
  const phone = typeof params.phone === 'string' ? params.phone : '';

  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="bg-background w-full max-w-xl rounded-xl border p-6 shadow-lg">
        <PhonePasswordRecoveryForm initialPhone={phone} />
      </div>
    </main>
  );
}
