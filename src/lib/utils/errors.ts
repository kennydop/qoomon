const authErrorMap: Record<string, string> = {
  'User already registered': 'This phone number is already registered',
  'Invalid login credentials': 'Incorrect phone number or password',
  'Invalid OTP': 'The code you entered is incorrect',
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleAuthError(error: unknown): string {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  if (error instanceof AuthError) {
    return error.message;
  }

  if (error instanceof Error) {
    const mapped = Object.entries(authErrorMap).find(([key]) =>
      error.message.includes(key)
    );
    return mapped?.[1] ?? error.message;
  }

  if (typeof error === 'string') {
    const mapped = Object.entries(authErrorMap).find(([key]) =>
      error.includes(key)
    );
    return mapped?.[1] ?? error;
  }

  return 'Something went wrong. Please try again.';
}
