'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { adminSendCustomerResetPasswordMutationOptions } from '@/mutations/admin/customer';
import { IconInfoCircle } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  customerId: string;
};

const ResetCustomerPassword = ({ customerId }: Props) => {
  const [recoveryUrl, setRecoveryUrl] = useState('');
  const { mutate, isPending } = useMutation(
    adminSendCustomerResetPasswordMutationOptions({
      onSuccess: (response) => setRecoveryUrl(response.data?.recoveryUrl || '')
    })
  );

  const sendResetPasswordLinkMutate = (id: string) => {
    setRecoveryUrl('');
    mutate(id);
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle title="Reset Password Kustomer" />
        <SectionDescription description="Bantu kustomer memulihkan akses akunnya." />
      </SectionHeader>
      <SectionContent>
        <Alert variant="info" className="mb-4">
          <IconInfoCircle />
          <AlertDescription>
            Email terverifikasi akan menerima link reset. Untuk pemulihan melalui nomor telepon,
            salin dan bagikan link kepada kustomer. Kustomer harus memasukkan OTP dari WhatsApp
            untuk mengganti kata sandi.
          </AlertDescription>
        </Alert>

        <Button
          variant="secondaryInfo"
          className="mt-6 md:mt-0"
          onClick={() => sendResetPasswordLinkMutate(customerId)}
          loading={isPending}
        >
          Siapkan Pemulihan Password
        </Button>
        {recoveryUrl && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">
              Bagikan link ini kepada kustomer. Link belum dikirim otomatis; OTP diminta oleh
              kustomer setelah membuka link.
            </p>
            <Input
              aria-label="Link pemulihan password"
              value={recoveryUrl}
              readOnly
              onFocus={(event) => event.target.select()}
            />
            <Button
              type="button"
              variant="secondaryInfo"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(recoveryUrl);
                  toast.success('Link pemulihan berhasil disalin.');
                } catch {
                  toast.error('Silakan pilih dan salin link secara manual.');
                }
              }}
            >
              Salin Link Pemulihan
            </Button>
          </div>
        )}
      </SectionContent>
    </Section>
  );
};
export default ResetCustomerPassword;
