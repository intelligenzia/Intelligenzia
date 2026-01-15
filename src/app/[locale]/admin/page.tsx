import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, ExternalLink, UserCheck, UserX } from 'lucide-react';
import { YearlyStatsChart } from '@/components/admin/yearly-stats-chart';
import { YearFilter } from '@/components/admin/year-filter';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ year?: string }>;
};

export default async function AdminPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { year: yearParam } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();

  // Check if user is admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect(locale === 'fi' ? '/fi' : '/en');
  }

  // Parse selected year
  const selectedYear = yearParam ? parseInt(yearParam, 10) : null;

  // Fetch all memberships with user data
  const allMemberships = await prisma.membership.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch all users (including those without memberships)
  const allUsers = await prisma.user.findMany({
    include: {
      membership: {
        select: {
          id: true,
          status: true,
          type: true,
          stripeCustomerId: true,
          createdAt: true,
          currentPeriodEnd: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get available years for filter (from 2020 to current year)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);

  // Filter memberships by year if selected
  // A membership is included if it was active during the selected year
  // (period started before year end AND period ended after year start)
  const memberships = selectedYear
    ? allMemberships.filter(m => {
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
        const periodStart = new Date(m.createdAt);
        const periodEnd = m.currentPeriodEnd ? new Date(m.currentPeriodEnd) : yearEnd;
        // Membership overlaps with the year if it started before year ends and ends after year starts
        return periodStart <= yearEnd && periodEnd >= yearStart;
      })
    : allMemberships;

  // Filter users by year if selected
  const filteredUsers = selectedYear
    ? allUsers.filter(u => {
        const userYear = new Date(u.createdAt).getFullYear();
        if (userYear === selectedYear) return true;
        // Also include if membership was active during that year
        if (u.membership) {
          const yearStart = new Date(selectedYear, 0, 1);
          const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
          const periodStart = new Date(u.membership.createdAt);
          const periodEnd = u.membership.currentPeriodEnd ? new Date(u.membership.currentPeriodEnd) : yearEnd;
          return periodStart <= yearEnd && periodEnd >= yearStart;
        }
        return false;
      })
    : allUsers;

  // Calculate stats (for filtered data)
  const totalMembers = memberships.length;
  const activeMembers = memberships.filter((m) => m.status === 'ACTIVE').length;
  const totalRevenue = memberships.reduce((sum, m) => sum + (m.amountPaid || 1000), 0);

  const fullMembers = memberships.filter((m) => m.type === 'FULL' && m.status === 'ACTIVE').length;
  const supportingMembers = memberships.filter((m) => m.type === 'SUPPORTING' && m.status === 'ACTIVE').length;

  // Users without membership (for filtered data)
  const usersWithoutMembership = filteredUsers.filter((u) => !u.membership);
  const totalUsers = filteredUsers.length;

  // Calculate yearly stats - count members who were active during each year
  // Revenue is distributed across the years the membership was active
  const yearlyStats: Record<number, { year: number; members: number; revenue: number }> = {};

  // Initialize all years from 2020 to current
  for (let y = 2020; y <= currentYear; y++) {
    yearlyStats[y] = { year: y, members: 0, revenue: 0 };
  }

  // For each membership, add to each year it was active
  allMemberships.forEach(m => {
    const periodStart = new Date(m.createdAt);
    const periodEnd = m.currentPeriodEnd ? new Date(m.currentPeriodEnd) : new Date();
    const startYear = periodStart.getFullYear();
    const endYear = periodEnd.getFullYear();

    // Count revenue in the year the payment was made (approximated by periodEnd - 1 year)
    const paymentYear = endYear > 0 ? endYear - 1 : startYear;

    // Count member in each year their membership was active
    for (let y = Math.max(startYear, 2020); y <= Math.min(endYear, currentYear); y++) {
      if (yearlyStats[y]) {
        yearlyStats[y].members += 1;
      }
    }

    // Add revenue to the payment year
    if (yearlyStats[paymentYear]) {
      yearlyStats[paymentYear].revenue += m.amountPaid || 1000;
    } else if (yearlyStats[startYear]) {
      yearlyStats[startYear].revenue += m.amountPaid || 1000;
    }
  });

  const yearlyData = Object.values(yearlyStats).sort((a, b) => a.year - b.year);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Aktiivinen</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Odottaa</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Vanhentunut</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Peruutettu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'FULL':
        return <Badge variant="default">Varsinainen</Badge>;
      case 'SUPPORTING':
        return <Badge variant="secondary">Kannatusjäsen</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('fi-FI', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Jäsenhallinta ja tilastot</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <YearFilter years={availableYears} currentYear={selectedYear} />
        </div>
      </header>

      {selectedYear && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Näytetään data vuodelta {selectedYear}
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Käyttäjiä</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {usersWithoutMembership.length} ilman jäsenyyttä
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jäsenyyksiä</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} aktiivista
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Varsinaiset</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fullMembers}</div>
            <p className="text-xs text-muted-foreground">10 € / vuosi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kannatusjäsenet</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportingMembers}</div>
            <p className="text-xs text-muted-foreground">Vaihteleva summa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{selectedYear ? 'Tulot' : 'Tulot yhteensä'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedYear ? `Vuonna ${selectedYear}` : 'Kaikista jäsenyyksistä'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Charts */}
      <div className="mb-8">
        <YearlyStatsChart data={yearlyData} />
      </div>

      {/* Tabs for Memberships and Users */}
      <Tabs defaultValue="memberships" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memberships">Jäsenyydet ({totalMembers})</TabsTrigger>
          <TabsTrigger value="users">Kaikki käyttäjät ({totalUsers})</TabsTrigger>
          <TabsTrigger value="no-membership">Ilman jäsenyyttä ({usersWithoutMembership.length})</TabsTrigger>
        </TabsList>

        {/* Memberships Tab */}
        <TabsContent value="memberships">
          <Card>
            <CardHeader>
              <CardTitle>Jäsenyydet {selectedYear && `(${selectedYear})`}</CardTitle>
              <CardDescription>
                {selectedYear ? `Vuonna ${selectedYear} luodut jäsenyydet` : 'Kaikki rekisteröidyt jäsenyydet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {selectedYear ? `Ei jäsenyyksiä vuonna ${selectedYear}.` : 'Ei jäsenyyksiä vielä.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-2 text-left text-sm font-medium">Jäsen</th>
                        <th className="py-3 px-2 text-left text-sm font-medium">Tyyppi</th>
                        <th className="py-3 px-2 text-left text-sm font-medium">Tila</th>
                        <th className="py-3 px-2 text-left text-sm font-medium">Summa</th>
                        <th className="py-3 px-2 text-left text-sm font-medium">Voimassa</th>
                        <th className="py-3 px-2 text-left text-sm font-medium">Liittynyt</th>
                        <th className="py-3 px-2 text-left text-sm font-medium">Stripe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberships.map((membership) => (
                        <tr key={membership.id} className="border-b">
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium">{membership.user.name || 'Ei nimeä'}</div>
                              <div className="text-sm text-muted-foreground">{membership.user.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-2">{getTypeBadge(membership.type)}</td>
                          <td className="py-3 px-2">{getStatusBadge(membership.status)}</td>
                          <td className="py-3 px-2">
                            {membership.amountPaid ? formatCurrency(membership.amountPaid) : '10 €'}
                          </td>
                          <td className="py-3 px-2">{formatDate(membership.currentPeriodEnd)}</td>
                          <td className="py-3 px-2">{formatDate(membership.createdAt)}</td>
                          <td className="py-3 px-2">
                            {membership.stripeCustomerId ? (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={`https://dashboard.stripe.com/customers/${membership.stripeCustomerId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Kaikki käyttäjät {selectedYear && `(${selectedYear})`}</CardTitle>
              <CardDescription>
                {selectedYear ? `Vuonna ${selectedYear} rekisteröityneet` : 'Kaikki rekisteröityneet käyttäjät'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-2 text-left text-sm font-medium">Käyttäjä</th>
                      <th className="py-3 px-2 text-left text-sm font-medium">Jäsenyys</th>
                      <th className="py-3 px-2 text-left text-sm font-medium">Tila</th>
                      <th className="py-3 px-2 text-left text-sm font-medium">Rekisteröitynyt</th>
                      <th className="py-3 px-2 text-left text-sm font-medium">Stripe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium">{user.name || 'Ei nimeä'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {user.membership ? (
                            getTypeBadge(user.membership.type)
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <UserX className="mr-1 h-3 w-3" />
                              Ei jäsenyyttä
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {user.membership ? getStatusBadge(user.membership.status) : '-'}
                        </td>
                        <td className="py-3 px-2">{formatDate(user.createdAt)}</td>
                        <td className="py-3 px-2">
                          {user.membership?.stripeCustomerId ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={`https://dashboard.stripe.com/customers/${user.membership.stripeCustomerId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users without membership Tab */}
        <TabsContent value="no-membership">
          <Card>
            <CardHeader>
              <CardTitle>Käyttäjät ilman jäsenyyttä {selectedYear && `(${selectedYear})`}</CardTitle>
              <CardDescription>Rekisteröityneet käyttäjät, joilla ei ole jäsenyyttä</CardDescription>
            </CardHeader>
            <CardContent>
              {usersWithoutMembership.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Kaikilla käyttäjillä on jäsenyys.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-2 text-left text-sm font-medium">Käyttäjä</th>
                        <th className="py-3 px-2 text-left text-sm font-medium">Rekisteröitynyt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersWithoutMembership.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium">{user.name || 'Ei nimeä'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-2">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
