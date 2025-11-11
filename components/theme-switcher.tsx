'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, Laptop2, MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';

const themeOptions = [
  { value: 'light', label: 'Light', Icon: SunMedium },
  { value: 'dark', label: 'Dark', Icon: MoonStar },
  { value: 'system', label: 'System', Icon: Laptop2 },
] as const;

type ThemeOption = (typeof themeOptions)[number]['value'];

export function ThemeSwitcher({ size = 'default' }: { size?: 'default' | 'icon' }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const resolvedTheme = useMemo<ThemeOption>(() => {
    if (!mounted) {
      return 'system';
    }
    if (theme === 'system') {
      return (systemTheme as ThemeOption) ?? 'system';
    }
    return theme as ThemeOption;
  }, [mounted, theme, systemTheme]);

  const selectedTheme = (theme as ThemeOption) ?? 'system';
  const displayTheme = selectedTheme === 'system' ? 'system' : resolvedTheme;
  const ActiveIcon =
    themeOptions.find(option => option.value === (displayTheme ?? 'system'))?.Icon || SunMedium;
  const activeLabel =
    themeOptions.find(option => option.value === selectedTheme)?.label ??
    themeOptions.find(option => option.value === displayTheme)?.label ??
    'Theme';

  if (!mounted) {
    return (
      <Button
        variant='outline'
        size={size === 'icon' ? 'icon' : 'sm'}
        className={cn('h-9 w-9 rounded-full border border-border/70 bg-card/60 shadow-sm')}
        aria-label='Toggle theme'
        disabled
      >
        <ActiveIcon className='h-4 w-4 text-muted-foreground' />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size={size === 'icon' ? 'icon' : 'default'}
          className={cn(
            'rounded-full border border-border/70 bg-card/70 shadow-sm transition hover:border-primary/50',
            size === 'icon' ? 'h-10 w-10' : 'h-10 px-4'
          )}
          aria-label='Toggle theme'
        >
          <ActiveIcon className='h-4 w-4 text-primary' />
          {size !== 'icon' && (
            <span className='ml-2 text-sm text-muted-foreground'>{activeLabel}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            className={cn(
              'flex items-center justify-between gap-2 text-sm',
              selectedTheme === value && 'text-primary'
            )}
            onClick={() => setTheme(value)}
          >
            <span className='flex flex-col leading-tight'>
              <span className='flex items-center gap-2'>
                <Icon className='h-4 w-4' />
                <span>{label}</span>
              </span>
              {value === 'system' && (
                <span className='text-xs text-muted-foreground'>
                  Device: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                </span>
              )}
            </span>
            <Check
              className={cn(
                'h-4 w-4 text-primary transition-opacity',
                selectedTheme === value ? 'opacity-100' : 'opacity-0'
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
