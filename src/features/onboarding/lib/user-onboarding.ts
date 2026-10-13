// HTTP success alone is insufficient: the API also returns failure envelopes.
export function requireApiSuccess<
  T extends { success?: boolean; error?: unknown; message?: string },
>(response: T): T {
  if (response.error || response.success === false) {
    throw new Error(response.message || 'The request could not be completed. Please try again.');
  }
  return response;
}

export function requireApiData<T>(response: {
  success?: boolean;
  error?: unknown;
  message?: string;
  data?: T;
}): T {
  requireApiSuccess(response);
  if (!response.data)
    throw new Error(response.message || 'No onboarding information was returned.');
  return response.data;
}
