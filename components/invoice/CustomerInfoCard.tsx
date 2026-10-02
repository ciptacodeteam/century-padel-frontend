import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type User = {
  name?: string | null;
  phone?: string | null;
};

export default function CustomerInfoCard({ user }: { user: User }) {
  if (!user) return null;
  return (
    <Card className="h-full gap-0 overflow-hidden rounded-xl py-0 shadow-sm">
      <CardHeader className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <CardTitle className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Pelanggan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-5 sm:px-6 sm:pb-6">
        <p className="text-lg font-semibold tracking-tight text-gray-950">{user.name || '-'}</p>
        <p className="text-sm leading-6 text-gray-500">{user.phone || '-'}</p>
      </CardContent>
    </Card>
  );
}
