'use client';

import { Check } from 'lucide-react';
import { cn } from '../../../../../lib/utils';

interface StepperProps {
    step: number;
    onStep: (step: number) => void;
}

const STEPS = [
    'Course Setup',
    'Lessons + Content',
    'Practice Activities',
    'Assessment Tasks',
    'Assessment + Grading',
    'Branding + Pricing',
];

export function Stepper({ step, onStep }: StepperProps) {
    return (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ol className="flex min-w-max items-center gap-3">
                {STEPS.map((title, index) => {
                    const isCurrent = index === step;
                    const isCompleted = index < step;

                    return (
                        <li
                            key={title}
                            className="flex shrink-0 items-center gap-3"
                        >
                            <button
                                type="button"
                                onClick={() => onStep(index)}
                                className={cn(
                                    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                                    'hover:bg-muted/50',
                                    isCurrent &&
                                    'border-primary bg-primary text-primary-foreground hover:bg-primary',
                                    isCompleted &&
                                    'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10',
                                    !isCurrent &&
                                    !isCompleted &&
                                    'border-border bg-background text-muted-foreground'
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                        isCurrent &&
                                        'bg-primary-foreground/20 text-primary-foreground',
                                        isCompleted &&
                                        'bg-primary/10 text-primary',
                                        !isCurrent &&
                                        !isCompleted &&
                                        'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        index + 1
                                    )}
                                </span>

                                {title}
                            </button>

                            {index < STEPS.length - 1 && (
                                <span className="h-px w-6 shrink-0 bg-border" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export const useOptionalStepper = () => null;
