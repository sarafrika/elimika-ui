'use client';

import { type ReactNode, useCallback, useMemo, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import {
  type ProfileFormConfirmationOptions,
  ProfileFormModeContext,
  useProfileFormMode,
} from '@/context/profile-form-mode-context';
import { cn } from '@/lib/utils';
import { Pencil, X } from 'lucide-react';

type ProfileFormShellProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  badges?: ReactNode[];
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  editable?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
};

export function ProfileFormShell({
  title,
  description,
  eyebrow,
  actions,
  badges,
  children,
  className,
  contentClassName,
  editable = true,
  defaultEditing = false,
  onEditingChange,
}: ProfileFormShellProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [confirmation, setConfirmation] = useState<ProfileFormConfirmationOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const enableEditing = useCallback(() => {
    setIsEditing(current => {
      if (!current) {
        onEditingChange?.(true);
      }
      return true;
    });
  }, [onEditingChange]);

  const disableEditing = useCallback(() => {
    setIsEditing(current => {
      if (current) {
        onEditingChange?.(false);
      }
      return false;
    });
  }, [onEditingChange]);

  const toggleEditing = useCallback(() => {
    setIsEditing(current => {
      const next = !current;
      onEditingChange?.(next);
      return next;
    });
  }, [onEditingChange]);

  const requestConfirmation = useCallback((options: ProfileFormConfirmationOptions) => {
    setConfirmation({
      title: options.title ?? 'Confirm changes?',
      description:
        options.description ?? 'Your updates will be submitted. Do you want to continue?',
      confirmLabel: options.confirmLabel ?? 'Yes, continue',
      cancelLabel: options.cancelLabel ?? 'No, go back',
      onConfirm: options.onConfirm,
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      isEditing,
      toggleEditing,
      enableEditing,
      disableEditing,
      requestConfirmation,
      isConfirming,
    }),
    [disableEditing, enableEditing, isConfirming, isEditing, requestConfirmation, toggleEditing]
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isConfirming) {
        setConfirmation(null);
      }
    },
    [isConfirming]
  );

  const handleConfirm = useCallback(async () => {
    if (!confirmation?.onConfirm) {
      setConfirmation(null);
      return;
    }

    try {
      setIsConfirming(true);
      await confirmation.onConfirm();
      setConfirmation(null);
    } finally {
      setIsConfirming(false);
    }
  }, [confirmation]);

  const hasActions = editable || Boolean(actions);

  return (
    <ProfileFormModeContext.Provider value={contextValue}>
      <div className={cn('mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8', className)}>
        <header className='flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between'>
          <div className='max-w-2xl space-y-2'>
            {eyebrow ? (
              <p className='text-primary/80 text-xs font-medium tracking-[0.2em] uppercase'>
                {eyebrow}
              </p>
            ) : null}
            <h1 className='text-foreground text-3xl font-semibold tracking-tight sm:text-4xl'>
              {title}
            </h1>
            {description ? (
              <p className='text-muted-foreground text-sm sm:text-base'>{description}</p>
            ) : null}
            {badges && badges.length > 0 ? (
              <div className='flex flex-wrap gap-2 pt-1'>
                {badges.map((badge, index) =>
                  typeof badge === 'string' ? (
                    <Badge
                      key={badge}
                      variant='outline'
                      className='bg-primary/5 text-xs font-medium capitalize'
                    >
                      {badge}
                    </Badge>
                  ) : (
                    <Badge
                      key={index}
                      variant='outline'
                      className='bg-primary/5 text-xs font-medium capitalize'
                    >
                      {badge}
                    </Badge>
                  )
                )}
              </div>
            ) : null}
          </div>
          {hasActions ? (
            <div className='flex flex-wrap items-center gap-3'>
              {editable ? (
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={isEditing ? disableEditing : enableEditing}
                  aria-pressed={isEditing}
                  aria-label={isEditing ? 'Stop editing' : 'Enable editing'}
                  className={cn('transition-colors', isEditing && 'border-primary text-primary')}
                >
                  {isEditing ? <X className='h-4 w-4' /> : <Pencil className='h-4 w-4' />}
                </Button>
              ) : null}
              {actions}
            </div>
          ) : null}
        </header>
        <div className={cn('space-y-6', contentClassName)}>{children}</div>
      </div>
      <AlertDialog open={Boolean(confirmation)} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
            {confirmation?.description ? (
              <AlertDialogDescription>{confirmation.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>
              {confirmation?.cancelLabel ?? 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? (
                <span className='flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  Processing…
                </span>
              ) : (
                (confirmation?.confirmLabel ?? 'Confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProfileFormModeContext.Provider>
  );
}

type ProfileFormSectionProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  viewContent?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ProfileFormSection({
  title,
  description,
  icon,
  children,
  viewContent,
  footer,
  className,
  contentClassName,
}: ProfileFormSectionProps) {
  const { isEditing } = useProfileFormMode();

  return (
    <Card
      className={cn(
        'border-border/60 supports-[backdrop-filter]:bg-background/60 shadow-sm backdrop-blur',
        className
      )}
    >
      <CardHeader className='border-border/60 bg-muted/40 border-b'>
        <div className='flex items-center gap-3'>
          {icon}
          <div>
            <CardTitle className='text-foreground text-base font-semibold sm:text-lg'>
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className='text-sm'>{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('p-6 sm:p-8', contentClassName)}>
        {isEditing ? (
          <fieldset className='space-y-6'>{children}</fieldset>
        ) : viewContent ? (
          <div className='space-y-6'>{viewContent}</div>
        ) : (
          <fieldset
            disabled
            className='pointer-events-none space-y-6 opacity-70'
          >
            {children}
          </fieldset>
        )}
      </CardContent>
      {footer && isEditing ? (
        <CardFooter className='border-border/60 bg-muted/10 flex flex-col items-stretch gap-3 border-t p-6 sm:flex-row sm:justify-end'>
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
