const TOKEN_KEY = 'rr_token';

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (data && typeof data.message === 'string' && data.message) return data.message;
  } catch {
    // response body wasn't JSON — fall through to the default message
  }
  return fallback;
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Could not create your account. Please try again.'));
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Invalid email or password.'));
  }

  return response.json();
}

const NAME_KEY = 'rr_name';
const EMAIL_KEY = 'rr_email';

export function saveToken(token: string, name: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(NAME_KEY, name);
  localStorage.setItem(EMAIL_KEY, email);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(EMAIL_KEY);
}
