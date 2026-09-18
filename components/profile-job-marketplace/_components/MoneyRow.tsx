import { formatRate, type RateBasis } from '@/lib/rate-card';
import { cn } from '@/lib/utils';

export function MoneyRow({
  label,
  value,
  accent,
  emphasis,
  rateBasis,
}: {
  label: string;
  value: number | null;
  /** Left border colour class, e.g. `border-l-primary`. */
  accent: string;
  emphasis?: boolean;
  rateBasis?: RateBasis;
}) {
  return (
    <div className={cn('bg-muted/20 rounded-md border-l-4 px-3 py-2', accent)}>
      <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
      <div
        className={cn(
          'text-foreground mt-0.5 tabular-nums',
          emphasis ? 'text-lg font-semibold' : 'text-base font-medium'
        )}
      >
        {value === null ? 'Not specified' : formatRate(value, rateBasis)}
      </div>
    </div>
  );
}

/** Sale price, instructor pay and the margin between them, as declared on the job. */
export function JobMoneyRows({
  salePrice,
  instructorPay,
  rateBasis,
}: {
  salePrice?: number | null;
  instructorPay?: number | null;
  rateBasis?: RateBasis;
}) {
  const sale = typeof salePrice === 'number' ? salePrice : null;
  const pay = typeof instructorPay === 'number' ? instructorPay : null;
  const margin = sale !== null && pay !== null ? sale - pay : null;
  return (
    <div className='space-y-3'>
      <MoneyRow
        label='Sold to learners at'
        value={sale}
        accent='border-l-primary'
        rateBasis={rateBasis}
      />
      <MoneyRow
        label='Instructor is paid'
        value={pay}
        accent='border-l-warning'
        rateBasis={rateBasis}
      />
      <MoneyRow
        label='Your margin'
        value={margin}
        accent='border-l-success'
        emphasis
        rateBasis={rateBasis}
      />
    </div>
  );
}
