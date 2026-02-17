'use server';

import type { ApiResponse, ApiResponseWithPagination } from '@/lib/types';
import type { Instructor } from '@/lib/types/instructor';
import { getServerApiBaseUrl } from '@/services/api/base-url';

const DEFAULT_PAGE_SIZE = '10';

export async function fetchInstructorProfile(page: number = 0, searchParams?: string) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const paginationParams = new URLSearchParams({
      page: page.toString(),
      size: DEFAULT_PAGE_SIZE,
    });

    const endpoint = searchParams ? `/search?${searchParams}&` : `?`;
    const url = `${baseUrl}/instructors${endpoint}${paginationParams}`;

    const response = await fetch(url, { headers });

    return (await response.json()) as ApiResponseWithPagination<Instructor>;
  } catch (_error) {
    //console.log('Error fetching instructor profile:', error);
    throw new Error(
      'Something went wrong while fetching instructor profile. Please contact support.'
    );
  }
}

export async function updateInstructorProfile(instructor: Instructor) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${baseUrl}/instructors/${instructor.uuid}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(instructor),
    });

    return (await response.json()) as ApiResponse<Instructor>;
  } catch (_error) {
    //console.log('Error creating instructor profile:', error);
    throw new Error(
      'Something went wrong while creating instructor profile. Please contact support.'
    );
  }
}
