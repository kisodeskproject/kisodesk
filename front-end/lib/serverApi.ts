/**
 * Base URL used only by server-rendered routes and metadata handlers.
 * It must not depend on NEXT_PUBLIC_API_URL, which is compiled into client
 * bundles and can differ from the API reachable by the server container.
 */
export function getServerApiBaseUrl(): string {
  const configuredUrl = (process.env.SERVER_API_URL || process.env.API_BASE_URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  );

  return configuredUrl.endsWith('/v1') ? configuredUrl : `${configuredUrl}/v1`;
}
