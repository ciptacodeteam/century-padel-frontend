import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type User = {
  name?: string | null;
  phone?: string | null;
};

export default function CustomerInfoCard({ user }: { user: User }) {
  if (!user) return null;
  return (
    <Card className="h-full gap-1.5 py-2.5 sm:gap-2 sm:py-3">
      <CardHeader className="px-4">
        <CardTitle>Pelanggan</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4">
        <p className="font-semibold">{user.name || '-'}</p>
        <p className="text-sm text-gray-600">{user.phone || '-'}</p>
      </CardContent>
    </Card>
  );
}
