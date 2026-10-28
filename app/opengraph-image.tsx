import { ImageResponse } from 'next/og';
import { OG_COLORS, OgFrame, sizedOgResponse } from '@/lib/og-image';

export const runtime = 'edge';
export const alt = 'Elimika — Empowering growth through structural online learning.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return sizedOgResponse(
    new ImageResponse(
      (
        <OgFrame>
          <div style={{ fontSize: 26, color: OG_COLORS.accent }}>LEARN. GROW. THRIVE.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -4 }}>Elimika</div>
            <div style={{ fontSize: 38, lineHeight: 1.35, maxWidth: 900 }}>
              Empowering growth through structural online learning.
            </div>
          </div>
          <div style={{ fontSize: 24, color: OG_COLORS.accent }}>
            Your next chapter starts here.
          </div>
        </OgFrame>
      ),
      size
    )
  );
}
