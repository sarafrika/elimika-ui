import { formatReportNumber } from './session-report-scores';

/** Stacked mathematical fraction with an explicit reading for assistive technology. */
export function ScoreFraction({ score, maximum }: { score?: number; maximum?: number }) {
  const numerator = score != null ? formatReportNumber(score) : '—';
  const denominator = maximum != null ? formatReportNumber(maximum) : '—';
  return (
    <span className='inline-block align-middle tabular-nums'>
      <span className='sr-only'>{`${numerator} / ${denominator}`}</span>
      <span
        aria-hidden='true'
        className='inline-flex flex-col items-stretch text-center leading-tight'
      >
        <span className='border-b border-current px-1.5 pb-0.5'>{numerator}</span>
        <span className='px-1.5 pt-0.5'>{denominator}</span>
      </span>
    </span>
  );
}
