import { listPublicCatalogueCourses } from '@/src/lib/catalogue/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get('page') ?? '0');
  const size = Number(request.nextUrl.searchParams.get('size') ?? '50');

  try {
    const result = await listPublicCatalogueCourses({
      page: Number.isFinite(page) ? page : 0,
      size: Number.isFinite(size) ? size : 50,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load catalogue courses';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
