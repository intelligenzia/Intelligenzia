import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, CreditCard, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { SignOutButton } from '@/components/sign-out-button';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MembershipDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user) {
    redirect(locale === 'fi' ? '/fi/kirjaudu' : '/en/login');
  }

  // Get membership info
  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });

  const statusLabels: Record<string, { fi: string; en: string }> = {
    PENDING: { fi: 'Odottaa hyväksyntää', en: 'Pending approval' },
    ACTIVE: { fi: 'Aktiivinen', en: 'Active' },
    EXPIRED: { fi: 'Vanhentunut', en: 'Expired' },
    CANCELLED: { fi: 'Peruutettu', en: 'Cancelled' },
  };

  const typeLabels: Record<string, { fi: string; en: string }> = {
    FULL: { fi: 'Varsinainen jäsen', en: 'Full member' },
    SUPPORTING: { fi: 'Kannatusjäsen', en: 'Supporting member' },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fi' ? 'Jäsenyyteni' : 'My Membership'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fi'
              ? 'Hallinnoi jäsenyyttäsi ja tietojasi'
              : 'Manage your membership and information'}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {locale === 'fi' ? 'Omat tiedot' : 'My Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'fi' ? 'Sähköposti' : 'Email'}
                </p>
                <p className="font-medium">{session.user.email}</p>
              </div>
              {session.user.name && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'fi' ? 'Nimi' : 'Name'}
                  </p>
                  <p className="font-medium">{session.user.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {locale === 'fi' ? 'Jäsenyys' : 'Membership'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {membership ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {locale === 'fi' ? 'Tila' : 'Status'}
                    </span>
                    <Badge
                      variant={
                        membership.status === 'ACTIVE'
                          ? 'default'
                          : membership.status === 'PENDING'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {statusLabels[membership.status][locale as 'fi' | 'en']}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {locale === 'fi' ? 'Tyyppi' : 'Type'}
                    </span>
                    <span className="font-medium">
                      {typeLabels[membership.type][locale as 'fi' | 'en']}
                    </span>
                  </div>
                  {membership.currentPeriodEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {locale === 'fi' ? 'Voimassa' : 'Valid until'}
                      </span>
                      <span className="font-medium">
                        {new Date(membership.currentPeriodEnd).toLocaleDateString(
                          locale === 'fi' ? 'fi-FI' : 'en-US'
                        )}
                      </span>
                    </div>
                  )}
                  {membership.status === 'EXPIRED' && (
                    <Button className="w-full">
                      {locale === 'fi' ? 'Uusi jäsenyys' : 'Renew membership'}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="mb-4 text-muted-foreground">
                    {locale === 'fi'
                      ? 'Et ole vielä jäsen'
                      : "You're not a member yet"}
                  </p>
                  <Button asChild>
                    <Link href={locale === 'fi' ? '/jaseneksi' : '/membership'}>
                      {locale === 'fi' ? 'Liity jäseneksi' : 'Become a member'}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end">
          <SignOutButton locale={locale} />
        </div>
      </div>
    </div>
  );
}
