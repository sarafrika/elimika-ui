import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export default function HorizontalStepper({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: Step[];
}) {
  return (
    <div className='mb-8 w-full'>
      <div className='flex items-center justify-between'>
        {steps.map((step: Step, index: number) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className='flex flex-1 items-center'>
              <div className='flex flex-col items-center'>
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted
                      ? 'border-[#1976D2] bg-[#1976D2] text-white'
                      : isActive
                        ? 'border-[#1976D2] bg-[#1976D2]/10 text-[#1976D2]'
                        : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  <Icon className='h-5 w-5' />
                </div>
                <div className='mt-2 text-center'>
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isActive || isCompleted ? 'text-[#1976D2]' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </div>
                  <div className='text-muted-foreground hidden text-xs sm:block'>
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-4 h-0.5 flex-1 transition-all duration-300',
                    isCompleted ? 'bg-[#1976D2]' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}