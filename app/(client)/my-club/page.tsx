'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  clubQueryOptions,
  userClubsQueryOptions,
  clubMembershipsQueryOptions
} from '@/queries/club';
import { profileQueryOptions } from '@/queries/profile';
import {
  leaveClubMutationOptions,
  deleteClubMutationOptions,
  removeMemberMutationOptions
} from '@/mutations/club';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import {
  IconUsers,
  IconLock,
  IconWorld,
  IconCrown,
  IconLogout,
  IconTrash,
  IconUserMinus,
  IconPlus,
  IconAlertTriangle
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';
import ClubJoinRequests from '@/components/clubs/ClubJoinRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MyClubPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuth, logout, token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check if token exists - if not, force logout
  useEffect(() => {
    if (isHydrated && isAuth && !token) {
      logout();
      queryClient.clear();
    }
  }, [isHydrated, isAuth, token, logout, queryClient]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isHydrated && !isAuth) {
      toast.error('Silakan login untuk melihat club Anda');
      router.push('/clubs');
    }
  }, [isHydrated, isAuth, router]);

  // Fetch user profile
  const { data: user, isLoading: isUserLoading } = useQuery({
    ...profileQueryOptions,
    enabled: isAuth && isHydrated,
    staleTime: 0,
    gcTime: 0
  });

  // Fetch owned clubs
  const { data: ownedClubs, isLoading: isLoadingOwned } = useQuery({
    ...userClubsQueryOptions(),
    enabled: isAuth && isHydrated
  });

  // Fetch membership clubs
  const { data: memberClubs, isLoading: isLoadingMember } = useQuery({
    ...clubMembershipsQueryOptions(),
    enabled: isAuth && isHydrated
  });

  // Get the primary club (first owned club, or first membership club)
  const primaryClubId = useMemo(() => {
    if (ownedClubs && ownedClubs.length > 0) {
      return ownedClubs[0].id;
    }
    if (memberClubs && memberClubs.length > 0) {
      return memberClubs[0].id;
    }
    return null;
  }, [ownedClubs, memberClubs]);

  // Fetch full club details
  const { data: clubData, isLoading: isLoadingClub } = useQuery({
    ...clubQueryOptions(primaryClubId!),
    enabled: !!primaryClubId && isAuth && isHydrated
  });

  // Explicitly set club to null when there's no primaryClubId to prevent using stale cached data
  const club = primaryClubId ? clubData : null;

  // Clear club query cache when transitioning from having a club to not having one
  useEffect(() => {
    if (!primaryClubId && isHydrated && clubData) {
      // Only clear if we had club data but now don't have a primaryClubId
      // This prevents stale data from being used
      queryClient.setQueryData(['clubs', 'my'], []);
      queryClient.setQueryData(['clubs', 'membership'], []);
    }
  }, [primaryClubId, isHydrated, clubData, queryClient]);

  const isLeader = isAuth && isHydrated && user?.id === club?.leaderId;
  const isLoading = isLoadingOwned || isLoadingMember || isLoadingClub || isUserLoading;

  const { mutate: leaveClub, isPending: isLeaving } = useMutation(
    leaveClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
        queryClient.invalidateQueries({ queryKey: ['clubs', 'my'] });
        queryClient.invalidateQueries({ queryKey: ['clubs', 'membership'] });
      }
    })
  );

  const { mutate: deleteClub, isPending: isDeleting } = useMutation(
    deleteClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
        queryClient.invalidateQueries({ queryKey: ['clubs', 'my'] });
      }
    })
  );

  const { mutate: removeMember, isPending: isRemovingMember } = useMutation(
    removeMemberMutationOptions({
      onSuccess: () => {
        if (primaryClubId) {
          queryClient.invalidateQueries({ queryKey: ['clubs', primaryClubId] });
        }
      }
    })
  );

  const handleDeleteClub = () => {
    setShowDeleteDialog(false);
    if (primaryClubId) {
      deleteClub(primaryClubId);
    }
  };

  // Show nothing while checking auth
  if (!isHydrated) {
    return null;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuth) {
    return null;
  }

  if (isLoading) {
    return (
      <>
        <MainHeader title="Club Saya" withLogo={false} withBorder />
        <main className="mx-auto w-11/12 flex-col py-28 md:mt-14">
          <div className="text-muted-foreground py-20 text-center text-sm">Memuat club...</div>
        </main>

        <MainBottomNavigation />
      </>
    );
  }

  // No club found
  if (!club) {
    return (
      <>
        <MainHeader title="Club Saya" withLogo={false} withBorder />
        <main className="pt-24 pb-16">
          <div className="mx-auto lg:max-w-7xl w-11/12 flex-1">
            <div className="text-muted-foreground space-y-4 py-20 text-center">
              <p className="text-sm">Anda belum memiliki atau bergabung dengan club manapun.</p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => router.push('/clubs/create')} className="gap-2">
                  <IconPlus className="size-4" />
                  Buat Club Baru
                </Button>
                <Button onClick={() => router.push('/clubs')} variant="outline" className="gap-2">
                  Jelajahi Club
                </Button>
              </div>
            </div>
          </div>
        </main>

        <MainBottomNavigation />
      </>
    );
  }

  return (
    <>
      <MainHeader title="Club Saya" withLogo={false} withBorder />

      <main className="pt-26 pb-32 lg:relative lg:left-1/2 lg:w-screen lg:-translate-x-1/2 lg:pb-20">
        <div className="mx-auto w-11/12 flex-1 space-y-4 lg:mt-6 lg:grid lg:max-w-7xl lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(280px,340px)] lg:items-start lg:gap-6 lg:space-y-0">
          <aside className="space-y-4 lg:sticky lg:top-28">
            {/* Club Header */}
            <Card className="lg:overflow-hidden">
              <CardContent>
                <div className="flex items-start gap-4 lg:flex-col">
                  <Avatar className="size-20 lg:size-28">
                    <AvatarImage src={club.logo || undefined} alt={club.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold lg:text-3xl">
                      {club.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 lg:w-full">
                    <div className="mb-2 flex items-start justify-between">
                      <h1 className="text-xl font-bold lg:text-2xl">{club.name}</h1>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-4 text-sm lg:flex-wrap">
                      <Badge
                        variant={club.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {club.visibility === 'PUBLIC' ? (
                          <>
                            <IconWorld className="mr-1 size-3" /> Public
                          </>
                        ) : (
                          <>
                            <IconLock className="mr-1 size-3" /> Private
                          </>
                        )}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <IconUsers className="size-4" />
                        <span>
                          {club._count?.clubMember || club.clubMember?.length || 0} Anggota
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  {isLeader ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                    >
                      <IconTrash className="size-4" />
                      Hapus Club
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground w-full"
                      onClick={() => leaveClub(primaryClubId!)}
                      disabled={isLeaving}
                      loading={isLeaving}
                    >
                      <IconLogout className="mr-2 size-4" />
                      Keluar Club
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leader */}
            {club.leader && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconCrown className="size-5 text-yellow-500" />
                    Club Leader
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage src={club.leader.image || undefined} alt={club.leader.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {club.leader.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{club.leader.name}</p>
                      {club.leader.email && (
                        <p className="text-muted-foreground truncate text-sm">
                          {club.leader.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          <section className="space-y-4">
            {/* Warning Banner - Club Pending Approval */}
            {!club.isActive && (
              <Alert variant="warning">
                <IconAlertTriangle />
                <AlertTitle>Club Menunggu Persetujuan Admin</AlertTitle>
                <AlertDescription>
                  Club Anda sedang menunggu persetujuan dari admin. Anda tidak dapat menggunakan
                  fitur club hingga club Anda disetujui. Harap tunggu notifikasi atau hubungi admin
                  untuk informasi lebih lanjut.
                </AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tentang Club</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {club.description || 'Deskripsi club belum ditambahkan.'}
                </p>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Peraturan Club</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {club.rules || 'Peraturan club belum ditambahkan.'}
                </div>
              </CardContent>
            </Card>

            {/* Join Requests - Only visible to club leader for private clubs when club is active */}
            {isAuth && isHydrated && club.visibility === 'PRIVATE' && club.isActive && (
              <ClubJoinRequests clubId={primaryClubId!} isLeader={isLeader} />
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-28">
            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Members ({club.clubMember?.length || club._count?.clubMember || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {club.clubMember && club.clubMember.length > 0 ? (
                  <div className="space-y-3">
                    {club.clubMember.map((member: any, index: number) => (
                      <div key={member.user?.id || index} className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage
                            src={member.user?.image || undefined}
                            alt={member.user?.name || 'Member'}
                          />
                          <AvatarFallback className="bg-muted text-sm">
                            {(member.user?.name || 'M').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {member.user?.name || 'Unknown Member'}
                          </p>
                        </div>
                        {isLeader && member.user?.id !== club.leaderId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              removeMember({ clubId: primaryClubId!, userId: member.user.id })
                            }
                            disabled={isRemovingMember}
                          >
                            <IconUserMinus className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    <IconUsers className="mx-auto mb-2 size-12 opacity-50" />
                    <p>
                      Club ini punya {club._count?.clubMember || club.clubMember?.length || 0}{' '}
                      Anggota
                    </p>
                    <p className="mt-1 text-xs">Anggota tidak tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Delete Club Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Club</DialogTitle>
            <DialogDescription className="mt-4 text-black">
              <span className="block">
                Apakah Anda yakin ingin menghapus <span className="font-medium">{club.name}</span>?
              </span>
              <span className="text-destructive mx-4 mt-3 block">
                Tindakan ini tidak dapat dibatalkan. Semua anggota akan dihapus dan semua data klub
                akan dihapus secara permanen.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClub}
              disabled={isDeleting}
              loading={isDeleting}
            >
              <IconTrash className="size-4" />
              Hapus Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainBottomNavigation />
    </>
  );
};

export default MyClubPage;
