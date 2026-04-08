export class BrowserApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'BrowserApiError';
  }
}

const readErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    if (
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
    ) {
      return { message: payload.message, payload };
    }

    return { message: response.statusText, payload };
  } catch {
    return { message: response.statusText, payload: undefined };
  }
};

export const getJson = async <T>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const { message, payload } = await readErrorMessage(response);
    throw new BrowserApiError(message || 'Request failed', response.status, payload);
  }

  return (await response.json()) as T;
};
