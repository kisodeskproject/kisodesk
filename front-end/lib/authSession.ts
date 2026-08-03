type CookieValue = { value: string } | undefined;

export type SessionCookieRequest = {
  cookies: { get(name: string): CookieValue };
};

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

export async function hasAuthenticatedSession(request: SessionCookieRequest): Promise<boolean> {
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) return false;

  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/auth/me`, {
      headers: {
        Accept: 'application/json',
        Cookie: `access_token=${accessToken}`,
      },
    });

    if (!response.ok) return false;

    const session = (await response.json()) as { authenticated?: boolean };
    return session.authenticated === true;
  } catch {
    return false;
  }
}
