const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('Environment variable NEXT_PUBLIC_API_URL is not defined.');
}

export const API_BASE_URL = apiBaseUrl.replace(/\/$/, '');
