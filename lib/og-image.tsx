import { ImageResponse } from 'next/og';
import type { ReactNode } from 'react';

export const OG_SIZE = { width: 1200, height: 630 };

// Raster renderers cannot resolve CSS variables. These mirror the brand tokens
// --el-brand-950, --el-brand-400 and --el-neutral-0 from app/globals.css.
export const OG_COLORS = {
  background: 'rgb(7, 22, 59)',
  accent: 'rgb(90, 146, 255)',
  foreground: 'rgb(255, 255, 255)',
};

export function previewText(value: string, limit: number) {
  const text = value.replace(/\s+/g, ' ').trim();
  const characters = Array.from(text);
  return characters.length > limit ? `${characters.slice(0, limit - 1).join('')}…` : text;
}

export function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 72px',
        background: OG_COLORS.background,
        color: OG_COLORS.foreground,
        fontFamily: 'sans-serif',
        borderTop: `12px solid ${OG_COLORS.accent}`,
      }}
    >
      {children}
    </div>
  );
}

/** Enforce the WhatsApp budget in bytes, including for unusual course text. */
export async function sizedOgResponse(image: ImageResponse): Promise<Response> {
  let bytes = await image.arrayBuffer();
  if (bytes.byteLength >= 300_000) {
    bytes = await new ImageResponse(
      (
        <OgFrame>
          <div style={{ fontSize: 96, fontWeight: 700 }}>Elimika</div>
          <div style={{ fontSize: 32 }}>Learning starts here.</div>
        </OgFrame>
      ),
      OG_SIZE
    ).arrayBuffer();
  }
  if (bytes.byteLength >= 300_000) throw new Error('OG image exceeds the 300 KB budget');
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
