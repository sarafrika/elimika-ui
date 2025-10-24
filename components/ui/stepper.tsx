'use client';

import { Check, Loader } from 'lucide-react';
import {
  Children,
  ComponentType,
  createContext,
  isValidElement,
  ReactNode,
  useContext,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

interface StepperProviderProps {
  activeStep: number;
  isLastStep: boolean;
  isFirstStep: boolean;
  isLoading: boolean;

  setActiveStep(step: number): void;

  prevStep(): void;

  nextStep(event?: () => Promise<void>): Promise<void>;
}

export const StepperContext = createContext<StepperProviderProps | null>(null);

export const useStepper = () => {
  const context = useContext(StepperContext);

  if (!context) {
    throw new Error('useStepper must be used within a StepperProvider');
  }

  return context;
};

export function StepperRoot({ children }: { children: ReactNode }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const steps = Children.toArray(children).filter(
    child => isValidElement(child) && child.type === StepperContent
  ).length;

  const isLastStep = activeStep === steps - 1;
  const isFirstStep = activeStep === 0;

  const nextStep = async (event?: () => Promise<void>) => {
    if (isLastStep) return;

    if (event) {
      try {
        setIsLoading(true);
        await event();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An error occurred');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    setActiveStep(step => step + 1);
  };

  const prevStep = () => {
    if (isFirstStep) return;
    setActiveStep(step => step - 1);
  };

  return (
    <StepperContext.Provider
      value={{
        activeStep,
        setActiveStep,
        isLastStep,
        isFirstStep,
        nextStep,
        prevStep,
        isLoading,
      }}
    >
      <Tabs
        defaultValue='0'
        value={activeStep.toString()}
        onValueChange={value => setActiveStep(parseInt(value))}
        className='w-full'
      >
        {children}
      </Tabs>
    </StepperContext.Provider>
  );
}

export function StepperList({ children }: { children: ReactNode }) {
  return <TabsList className='flex flex-row'>{children}</TabsList>;
}

export interface TriggerProps {
  step: number;
  title: string;
  icon?: ComponentType<{ className?: string }>;
}

export function StepperTrigger(props: TriggerProps) {
  const { activeStep } = useStepper();
  const isCompleted = props.step < activeStep;
  const isCurrent = props.step === activeStep;

  return (
    <TabsTrigger
      value={props.step.toString()}
      disabled={props.step > activeStep}
      className='flex items-center justify-center gap-2 disabled:opacity-100'
      data-state={isCurrent ? 'active' : 'inactive'}
    >
      {isCompleted ? (
        <Check className='h-4 w-4' />
      ) : (
        props.icon && <props.icon className={`h-4 w-4 ${props.icon.propTypes?.className}`} />
      )}
      {props.title}
    </TabsTrigger>
  );
}

interface ContentProps {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  showNavigation?: boolean;
  onNext?: () => Promise<void>;
  disableNext?: boolean;
  disablePrevious?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
  hideNextButton?: boolean;
  hidePreviousButton?: boolean;
  customButton?: React.ReactNode;
}

export function StepperContent({
  step,
  title,
  description,
  children,
  showNavigation,
  onNext,
  disableNext,
  disablePrevious,
  nextButtonText = 'Next',
  previousButtonText = 'Previous',
  hideNextButton,
  hidePreviousButton,
  customButton,
}: ContentProps) {
  const { nextStep, prevStep, isLastStep, isFirstStep, isLoading } = useStepper();

  return (
    <TabsContent value={step.toString()}>
      <Card className='flex min-h-[300px] flex-col rounded-lg'>
        <CardHeader>
          <CardTitle className='text-xl font-medium'>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className='flex grow flex-col gap-10'>
          <div className='grow'>{children}</div>
          {showNavigation && (
            <div className='flex flex-col gap-2 self-center sm:flex-row sm:self-end'>
              {!hidePreviousButton && (
                <Button
                  type='button'
                  variant='secondary'
                  onClick={prevStep}
                  disabled={isFirstStep || isLoading || disablePrevious}
                >
                  {previousButtonText}
                </Button>
              )}

              {!hideNextButton && (
                <Button
                  type={onNext ? 'submit' : 'button'}
                  onClick={() => nextStep(onNext)}
                  disabled={isLastStep || isLoading || disableNext}
                >
                  {isLoading ? <Loader className='h-4 w-4 animate-spin' /> : nextButtonText}
                </Button>
              )}

              {customButton}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
