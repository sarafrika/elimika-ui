import { ImageResponse } from 'next/og';
import { OG_COLORS, OgFrame, previewText, sizedOgResponse } from '@/lib/og-image';
import { formatPricingLabel, getCourseDisplayTitle } from '@/src/features/catalogue/format';
import { getPublicCourseDetail } from '@/src/features/catalogue/server';

export const alt = 'Explore this course on Elimika';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const detail = await getPublicCourseDetail(courseId);
  const title = previewText(
    detail ? getCourseDisplayTitle(detail.course) : 'Discover learning on Elimika',
    100
  );
  const creator = previewText(detail?.creatorName || detail?.creator?.full_name || 'Elimika', 60);
  const price = previewText(detail ? formatPricingLabel(detail) : 'Explore courses', 36);

  return sizedOgResponse(
    new ImageResponse(
      (
        <OgFrame>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>Elimika</div>
            <div style={{ fontSize: 22, color: OG_COLORS.accent }}>EXPLORE A COURSE</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
              style={{
                fontSize: title.length > 65 ? 54 : 64,
                lineHeight: 1.12,
                fontWeight: 700,
                overflowWrap: 'anywhere',
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 28 }}>{`Created by ${creator}`}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 22, color: OG_COLORS.accent }}>
              Invest in your next chapter.
            </div>
            <div
              style={{
                display: 'flex',
                padding: '16px 28px',
                borderRadius: 12,
                background: OG_COLORS.accent,
                color: OG_COLORS.background,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {price}
            </div>
          </div>
        </OgFrame>
      ),
      size
    )
  );
}
