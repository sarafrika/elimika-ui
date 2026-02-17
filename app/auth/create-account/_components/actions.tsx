'use server';

import type { TrainingCenter } from '@/app/auth/create-account/_components/training-center-form';
import type { User } from '@/app/auth/create-account/_components/user-account-form';
import type { ApiResponse, ApiResponseWithPagination, UserDomain } from '@/lib/types';
import { getServerApiBaseUrl } from '@/services/api/base-url';

const DEFAULT_PAGE_SIZE = 10;
const EVERY_THIRTY_MINUTES = 60 * 30; // 1,800 seconds

export async function createUser(user: User, userDomain: UserDomain, profileImage?: File) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const formData = new FormData();

    formData.append('user', new Blob([JSON.stringify(user)], { type: 'application/json' }));

    if (profileImage) {
      formData.append('profile_image', profileImage);
    }

    formData.append('user_domain', userDomain);

    const url = `${baseUrl}/users`;

    const response = await fetch(url, { method: 'POST', body: formData });

    return (await response.json()) as ApiResponse<User>;
  } catch (_error) {
    throw new Error('Something went wrong while creating user');
  }
}

export async function updateUser(user: User) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const url = `${baseUrl}/users/${user.uuid}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(user),
    });

    return (await response.json()) as ApiResponse<User>;
  } catch (_error) {
    throw new Error('Something went wrong while updating user');
  }
}

export async function fetchUsers(page: number = 0, searchParams?: string) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const headers = new Headers();

    headers.set('Content-Type', 'application/json');

    const paginationParams = new URLSearchParams({
      page: page.toString(),
      size: DEFAULT_PAGE_SIZE.toString(),
    });

    const endpoint = searchParams ? `/search?${searchParams}&` : `?`;
    const url = `${baseUrl}/users${endpoint}${paginationParams}`;

    const response = await fetch(url, { headers });

    return (await response.json()) as ApiResponseWithPagination<User>;
  } catch (_error) {
    throw new Error('Something went wrong while fetching users. Please contact support.');
  }
}

export async function fetchTrainingCenters(page: number, params?: string) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const headers = new Headers();

    const paginationParams = new URLSearchParams({
      page: page.toString(),
      size: DEFAULT_PAGE_SIZE.toString(),
    });

    const endpoint = params ? `/search?${params}&` : `?`;
    const url = `${baseUrl}/organisations${endpoint}${paginationParams}`;

    const response = await fetch(url, { headers });

    return (await response.json()) as ApiResponseWithPagination<TrainingCenter>;
  } catch (_error) {
    throw new Error(
      'Something went wrong while fetching training centers. Please contact support.'
    );
  }
}

export async function fetchTrainingCenter(trainingCenterId: string) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const headers = new Headers();

    const response = await fetch(`${baseUrl}/organisations/${trainingCenterId}`, {
      headers,
      next: { revalidate: EVERY_THIRTY_MINUTES },
    });

    return (await response.json()) as ApiResponse<TrainingCenter>;
  } catch (_error) {
    //console.log('Error fetching training centers:', error);
    throw new Error(
      'Something went wrong while fetching training centers. Please contact support.'
    );
  }
}

export async function createOrUpdateTrainingCenter(trainingCenter: TrainingCenter) {
  try {
    const baseUrl = getServerApiBaseUrl();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(
      `${baseUrl}/organisations${trainingCenter.uuid ? `/${trainingCenter.uuid}` : ''}`,
      {
        method: trainingCenter.uuid ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(trainingCenter),
      }
    );

    return (await response.json()) as ApiResponse<TrainingCenter>;
  } catch (_error) {
    //console.log('Error creating or updating training center:', error);
    throw new Error(
      'Something went wrong while persisting training center. Please contact support.'
    );
  }
}
