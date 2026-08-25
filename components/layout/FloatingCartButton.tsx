'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { getCartOptions } from '../../services/client/@tanstack/react-query.gen';
import { useCartStore } from '../../store/cart-store';

const STORAGE_KEY = 'floating-cart-button-position';
const BUTTON_SIZE = 56;
const DEFAULT_POSITION = { x: 24, y: 180 };
const DRAG_THRESHOLD = 4;

type Position = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  hasDragged: boolean;
  suppressClick: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getInitialPosition() {
  if (typeof window === 'undefined') {
    return DEFAULT_POSITION;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Position>;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed storage and fall back to the default location.
  }

  return {
    x: Math.max(window.innerWidth - BUTTON_SIZE - 24, 16),
    y: Math.round(window.innerHeight * 0.55),
  };
}

export function FloatingCartButton() {
  const router = useRouter();
  const { cartId } = useCartStore()

  const cartQuery = useQuery({
    ...getCartOptions({ path: { cartId: cartId ?? 'unset' } }),
    enabled: !!cartId,
    retry: 1,
  });

  const cart = cartQuery?.data?.data ?? null;
  const cartItems = useMemo(() => cart?.items ?? [], [cart?.items]);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragState = useRef<DragState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: DEFAULT_POSITION.x,
    originY: DEFAULT_POSITION.y,
    hasDragged: false,
    suppressClick: false,
  });
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);

  useEffect(() => {
    setMounted(true);
    setPosition(getInitialPosition());
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
      // Best effort only.
    }
  }, [mounted, position]);

  useEffect(() => {
    if (!mounted) return;

    function handleResize() {
      const maxX = Math.max(window.innerWidth - BUTTON_SIZE - 8, 8);
      const maxY = Math.max(window.innerHeight - BUTTON_SIZE - 8, 8);

      setPosition(current => ({
        x: clamp(current.x, 8, maxX),
        y: clamp(current.y, 8, maxY),
      }));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;

    const target = buttonRef.current;
    if (!target) return;

    target.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      hasDragged: false,
      suppressClick: false,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragState.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;

    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      dragState.current.hasDragged = true;
      dragState.current.suppressClick = true;
    }

    const nextX = dragState.current.originX + deltaX;
    const nextY = dragState.current.originY + deltaY;
    const maxX = Math.max(window.innerWidth - BUTTON_SIZE - 8, 8);
    const maxY = Math.max(window.innerHeight - BUTTON_SIZE - 8, 8);

    setPosition({
      x: clamp(nextX, 8, maxX),
      y: clamp(nextY, 8, maxY),
    });
  }

  function finishDrag(pointerId: number) {
    if (dragState.current.pointerId !== pointerId) return;

    dragState.current.pointerId = null;

    window.setTimeout(() => {
      dragState.current.suppressClick = false;
      dragState.current.hasDragged = false;
    }, 0);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragState.current.pointerId !== event.pointerId) return;

    if (!dragState.current.hasDragged) {
      dragState.current.suppressClick = false;
    }

    finishDrag(event.pointerId);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    finishDrag(event.pointerId);
  }

  function handleClick() {
    if (dragState.current.suppressClick) return;

    router.push('/dashboard/cart');
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-[80] pointer-events-none'>
      <Button
        ref={buttonRef}
        type='button'
        size='icon'
        className={cn(
          'pointer-events-auto fixed h-12 w-12 rounded-full border border-border/60 bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95',
          'touch-none select-none relative'
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        aria-label='Open cart'
        title='Open cart'
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
      >
        {cartItems?.length > 0 && (
          <span
            className='absolute -top-1 left-5/6 -translate-x-1/2 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-destructive text-xs font-bold text-white shadow-md'
          >
            {cartItems?.length}
          </span>
        )}

        <ShoppingCart className='h-5 w-5' />
      </Button>

    </div>
  );
}
