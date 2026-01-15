'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type YearlyData = {
  year: number;
  members: number;
  revenue: number;
};

type YearlyStatsChartProps = {
  data: YearlyData[];
};

export function YearlyStatsChart({ data }: YearlyStatsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vuosittaiset tilastot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ei dataa</p>
        </CardContent>
      </Card>
    );
  }

  const maxMembers = Math.max(...data.map(d => d.members), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Members per year */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jäsenet vuosittain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.year} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.year}</span>
                  <span className="text-muted-foreground">{item.members} jäsentä</span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary">
                  <div
                    className="h-3 rounded-full bg-primary transition-all"
                    style={{ width: `${(item.members / maxMembers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue per year */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tulot vuosittain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.year} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.year}</span>
                  <span className="text-muted-foreground">{formatCurrency(item.revenue)}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
