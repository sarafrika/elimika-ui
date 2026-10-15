import { ArrowRight, Coins } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* Helpers ---------------------------------------------------------------------------- */

const money = (value: number) =>
    new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0,
    })
        .format(value)
        .replace('KES', 'Ksh');

/* Shared pieces ---------------------------------------------------------------------- */

function CardTitleRow({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
            <div className='flex items-start gap-3'>
                <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
                    {icon}
                </div>
                <div className='space-y-0.5'>
                    <CardTitle className='text-base'>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
            {action}
        </CardHeader>
    );
}

function StatTile({
    label,
    value,
    hint,
}: {
    label: string;
    value: ReactNode;
    hint?: string;
}) {
    return (
        <div className='bg-muted/40 rounded-xl border p-4'>
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</p>
            <p className='mt-1.5 text-2xl font-semibold tracking-tight tabular-nums'>{value}</p>
            {hint ? <p className='text-muted-foreground mt-1 text-xs'>{hint}</p> : null}
        </div>
    );
}

/**
 * One horizontal track from 0 to 100%, with the configured min–max range highlighted.
 * Reads as "this share varies between X and Y across your courses".
 */
function RangeTrack({
    label,
    min,
    max,
    barClassName,
}: {
    label: string;
    min: number;
    max: number;
    barClassName: string;
}) {
    return (
        <div className='space-y-1.5'>
            <div className='flex items-baseline justify-between text-sm'>
                <span className='font-medium'>{label}</span>
                <span className='text-muted-foreground tabular-nums'>
                    {min}% – {max}%
                </span>
            </div>
            <div
                role='img'
                aria-label={`${label} share ranges from ${min}% to ${max}%`}
                className='bg-muted relative h-2.5 w-full overflow-hidden rounded-full'
            >
                <div
                    className={cn('absolute inset-y-0 rounded-full', barClassName)}
                    style={{ left: `${min}%`, width: `${max - min}%` }}
                />
            </div>
            <div className='text-muted-foreground flex justify-between text-[11px] tabular-nums'>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
            </div>
        </div>
    );
}

/* Monetization ----------------------------------------------------------------------- */

export interface MonetizationSnapshotProps {
    coursesWithFeeFloor: number;
    averageMinimumFee: number;
    maxFee: number;
    creatorSplit: { min: number; max: number };
    instructorSplit: { min: number; max: number };
    pricingHref: string;
}

export function MonetizationSnapshot({
    coursesWithFeeFloor,
    averageMinimumFee,
    maxFee,
    creatorSplit,
    instructorSplit,
    pricingHref,
}: MonetizationSnapshotProps) {
    return (
        <Card>
            <CardTitleRow
                icon={<Coins className='size-5' />}
                title='Monetization snapshot'
                description='Revenue expectations and minimum training fees across your courses.'
                action={
                    <Button asChild variant='outline' size='sm' className='shrink-0'>
                        <Link href={pricingHref}>
                            Update pricing
                            <ArrowRight className='size-4' />
                        </Link>
                    </Button>
                }
            />
            <CardContent className='space-y-6'>
                {/* Key numbers */}
                <div className='grid gap-3 sm:grid-cols-3'>
                    <StatTile label='Courses with fee floor' value={coursesWithFeeFloor} />
                    <StatTile label='Average minimum fee' value={money(averageMinimumFee)} />
                    <StatTile label='Highest fee' value={money(maxFee)} hint='Top of your fee range' />
                </div>

                {/* Revenue split */}
                <div className='space-y-4 rounded-xl border p-4'>
                    <div>
                        <h3 className='text-sm font-semibold'>Revenue split</h3>
                        <p className='text-muted-foreground text-xs'>
                            Splits vary per course; align them before publishing a new class.
                        </p>
                    </div>
                    <div className='grid gap-6 md:grid-cols-2'>
                        <RangeTrack
                            label='Creator'
                            min={creatorSplit.min}
                            max={creatorSplit.max}
                            barClassName='bg-primary'
                        />
                        <RangeTrack
                            label='Instructor'
                            min={instructorSplit.min}
                            max={instructorSplit.max}
                            barClassName='bg-primary/50'
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* Training requirements -------------------------------------------------------------- */

export interface TrainingRequirementsProps {
    total: number;
    mandatory: number;
    optional: number;
    manageHref: string;
}
