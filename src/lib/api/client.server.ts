import 'server-only';

type GeneratedResult<T> = {
  data?: T;
  error?: unknown;
};

export class ServerApiError extends Error {
  constructor(
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ServerApiError';
  }
}

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallbackMessage;
};

export const resolveGeneratedData = async <T>(
  request: Promise<GeneratedResult<T>>,
  fallbackMessage = 'Request failed'
) => {
  const result = await request;

  if (result.error) {
    throw new ServerApiError(getErrorMessage(result.error, fallbackMessage), result.error);
  }

  if (typeof result.data === 'undefined') {
    throw new ServerApiError(fallbackMessage);
  }

  return result.data;
};
