'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type YearFilterProps = {
  years: number[];
  currentYear: number | null;
};

export function YearFilter({ years, currentYear }: YearFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('year');
    } else {
      params.set('year', value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select
      value={currentYear?.toString() || 'all'}
      onValueChange={handleYearChange}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Valitse vuosi" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Kaikki vuodet</SelectItem>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
