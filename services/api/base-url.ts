const API_PROXY_BASE_PATH = '/api/proxy';

const normalizeBaseUrl = (value?: string) => value?.trim().replace(/\/$/, '');

const getValidAbsoluteUrl = (value?: string) => {
  const normalizedValue = normalizeBaseUrl(value);
  if (!normalizedValue || /^__.+__$/.test(normalizedValue)) {
    return undefined;
  }

  try {
    return new URL(normalizedValue).toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
};

const getRuntimeServerApiBaseUrl = () =>
  getValidAbsoluteUrl(process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL);

const getLocalProxyFallbackBaseUrl = () => {
  const origin =
    getValidAbsoluteUrl(process.env.AUTH_URL) ??
    getValidAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    `http://127.0.0.1:${process.env.PORT ?? '3000'}`;
  return `${origin}${API_PROXY_BASE_PATH}`;
};

export const API_BASE_URL =
  typeof window === 'undefined'
    ? (getRuntimeServerApiBaseUrl() ?? getLocalProxyFallbackBaseUrl())
    : API_PROXY_BASE_PATH;

export const getServerApiBaseUrl = () => {
  const baseUrl = getRuntimeServerApiBaseUrl();
  if (!baseUrl) {
    throw new Error('Environment variable API_BASE_URL is not defined.');
  }
  return baseUrl;
};
