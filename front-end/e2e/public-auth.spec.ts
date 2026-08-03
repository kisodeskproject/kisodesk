import { expect, test } from '@playwright/test';

async function mockAnonymousSession(page: import('@playwright/test').Page) {
  await page.route('**/v1/auth/me', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: false, user: null }),
    }),
  );
}

test('carga las rutas públicas en español e inglés con controles accesibles', async ({ page }) => {
  await mockAnonymousSession(page);
  await page.goto('/es-latam');

  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
  await page.getByRole('button', { name: 'Español' }).focus();
  await expect(page.getByRole('button', { name: 'Español' })).toBeFocused();
  await page.goto('/en-US');

  await expect(page).toHaveURL(/\/en-US$/);
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('la landing española mantiene metadatos, recursos críticos y foco visible', async ({
  page,
  request,
}) => {
  await mockAnonymousSession(page);
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const iconRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/icon.png') iconRequests.push(request.url());
  });

  await page.goto('/es-latam');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://kisodesk.online/es-latam',
  );

  const registerLink = page.getByRole('link', { name: 'Registrarse' });
  await registerLink.focus();
  await expect(registerLink).toBeFocused();
  await expect(registerLink).toHaveCSS('outline-style', 'solid');

  await expect(
    page.getByAltText('Ilustración de una habitación nocturna con persona y un gato'),
  ).toHaveAttribute('width', '1448');
  expect(iconRequests).toHaveLength(1);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);

  const llms = await request.get('/llms.txt');
  await expect(llms).toBeOK();
  const llmsText = await llms.text();
  expect(llmsText).toMatch(/^# Kiso Desk/m);
  expect(llmsText).toMatch(/\[.+\]\(https:\/\/kisodesk\.online\/.+\)/);
});

test('el HTML inicial localizado incluye una sola metadata SEO antes de ejecutar JavaScript', async ({
  request,
}) => {
  const expected = {
    'es-latam': 'Mejora tu velocidad y precisión .',
    'en-US': 'Improve your speed and accuracy with interactive typing lessons.',
  };

  for (const [locale, description] of Object.entries(expected)) {
    const response = await request.get(`/${locale}`);
    await expect(response).toBeOK();
    const html = await response.text();

    expect(html.match(/<meta name="description"[^>]*>/g)).toHaveLength(1);
    expect(html).toContain(`<meta name="description" content="${description}"/>`);
    expect(html).toContain(`<link rel="canonical" href="https://kisodesk.online/${locale}"/>`);
    expect(html).toContain(`hrefLang="${locale === 'es-latam' ? 'es' : locale}"`);
    expect(html).toContain('hrefLang="en" href="https://kisodesk.online/en-US"');
  }
});

test('los iconos públicos tienen variantes cuadradas y ligeras', async ({ request }) => {
  for (const iconPath of ['/icon.png', '/apple-icon.png']) {
    const response = await request.get(iconPath);
    await expect(response).toBeOK();
    expect((await response.body()).byteLength).toBeLessThan(50_000);
  }
});

test('la landing responde en un viewport móvil', async ({ page }) => {
  await mockAnonymousSession(page);
  await page.goto('/es-latam');

  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Registrarse' })).toBeVisible();
});

test('navega a registro e inicio de sesión sin datos de cuenta', async ({ page }) => {
  await mockAnonymousSession(page);
  await page.goto('/es-latam');

  await expect(page.getByRole('link', { name: 'Registrarse' })).toHaveAttribute(
    'href',
    '/es-latam/register',
  );
  await page.goto('/es-latam/register');
  await expect(page).toHaveURL(/\/es-latam\/register$/);
  await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();

  await page.goto('/es-latam/login');
  await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();
  await expect(page.getByLabel(/contraseña/i)).toBeVisible();
});

test('muestra un error accesible para credenciales incorrectas', async ({ page }) => {
  await mockAnonymousSession(page);
  await page.route('**/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Invalid credentials' }),
    }),
  );
  await page.goto('/es-latam/login');

  await page.getByRole('textbox', { name: /correo/i }).fill('e2e@example.test');
  await page.getByLabel(/contraseña/i).fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  const credentialError = page.getByRole('alert').filter({
    has: page.getByText('Correo o contraseña inválidos.'),
  });
  await expect(credentialError).toBeFocused();
  await expect(credentialError).toHaveText('Correo o contraseña inválidos.');
});

test('protege la ruta privada sin una sesión', async ({ page }) => {
  await page.goto('/es-latam/dashboard');
  await expect(page).toHaveURL(/\/es-latam\/login$/);
});
