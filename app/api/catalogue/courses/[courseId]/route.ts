import { NextResponse } from 'next/server';
import { getPublicCourseDetail } from '@/src/features/catalogue/server';

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { courseId } = await context.params;

  try {
    const detail = await getPublicCourseDetail(courseId);

    if (!detail) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load course detail';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
