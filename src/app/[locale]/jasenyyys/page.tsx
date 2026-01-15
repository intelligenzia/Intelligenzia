import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, CreditCard, CheckCircle, ExternalLink } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';
import { ManageSubscriptionButton } from '@/components/manage-subscription-button';
import { EditNameForm } from '@/components/edit-name-form';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function MembershipDashboardPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { success } = await searchParams;
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

  const t = {
    fi: {
      title: 'Jäsenyyteni',
      subtitle: 'Hallinnoi jäsenyyttäsi ja tietojasi',
      myInfo: 'Omat tiedot',
      email: 'Sähköposti',
      name: 'Nimi',
      membership: 'Jäsenyys',
      status: 'Tila',
      type: 'Tyyppi',
      validUntil: 'Voimassa',
      renewMembership: 'Uusi jäsenyys',
      notMemberYet: 'Et ole vielä jäsen',
      becomeMember: 'Liity jäseneksi',
      successTitle: 'Kiitos liittymisestä!',
      successMessage:
        'Jäsenyytesi on nyt aktiivinen. Tervetuloa Intelligenziaan!',
    },
    en: {
      title: 'My Membership',
      subtitle: 'Manage your membership and information',
      myInfo: 'My Info',
      email: 'Email',
      name: 'Name',
      membership: 'Membership',
      status: 'Status',
      type: 'Type',
      validUntil: 'Valid until',
      renewMembership: 'Renew membership',
      notMemberYet: "You're not a member yet",
      becomeMember: 'Become a member',
      successTitle: 'Thank you for joining!',
      successMessage:
        'Your membership is now active. Welcome to Intelligenzia!',
    },
  };

  const text = t[locale as 'fi' | 'en'];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{text.title}</h1>
          <p className="text-muted-foreground">{text.subtitle}</p>
        </header>

        {/* Success Message */}
        {success && (
          <Card className="mb-8 border-green-500 bg-green-500/10">
            <CardContent className="flex items-center gap-4 pt-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  {text.successTitle}
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  {text.successMessage}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {text.myInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{text.email}</p>
                <p className="font-medium">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{text.name}</p>
                <EditNameForm currentName={session.user.name || null} locale={locale} />
              </div>
            </CardContent>
          </Card>

          {/* Membership Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {text.membership}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {membership ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {text.status}
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
                      {text.type}
                    </span>
                    <span className="font-medium">
                      {typeLabels[membership.type][locale as 'fi' | 'en']}
                    </span>
                  </div>
                  {membership.currentPeriodEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {text.validUntil}
                      </span>
                      <span className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4" />
                        {new Date(membership.currentPeriodEnd).toLocaleDateString(
                          locale === 'fi' ? 'fi-FI' : 'en-US'
                        )}
                      </span>
                    </div>
                  )}

                  {/* Manage Subscription Button - for FULL members */}
                  {membership.status === 'ACTIVE' && (
                    <div className="pt-2">
                      <ManageSubscriptionButton
                        locale={locale}
                        membershipType={membership.type}
                      />
                    </div>
                  )}

                  {/* Renew Button - for expired members */}
                  {(membership.status === 'EXPIRED' ||
                    membership.status === 'CANCELLED') && (
                    <Button asChild className="w-full">
                      <Link href={locale === 'fi' ? '/jaseneksi' : '/join'}>
                        {text.renewMembership}
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="mb-4 text-muted-foreground">
                    {text.notMemberYet}
                  </p>
                  <Button asChild>
                    <Link href={locale === 'fi' ? '/jaseneksi' : '/join'}>
                      {text.becomeMember}
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
