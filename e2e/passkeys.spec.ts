import { expect, test } from '@playwright/test';

const API = `http://localhost:${process.env.API_PORT ?? 3201}`;
const ORIGIN = `http://localhost:${process.env.WEB_PORT ?? 3207}`;
const PASSWORD = 'E2e-Passw0rd';

test('enrolls, signs in, rejects replay and revokes a real WebAuthn credential', async ({ page, context, request }) => {
  const email = `passkeys-${Date.now()}-e2e@example.com`;
  const registered = await request.post(`${API}/auth/register`, { data: { email, password: PASSWORD, name: 'Passkey tester' } });
  expect(registered.ok()).toBe(true);
  const session = (await registered.json()).data;
  const headers = { Authorization: `Bearer ${session.token}`, Origin: ORIGIN };
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: {
    protocol: 'ctap2', transport: 'internal', hasResidentKey: true,
    hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true,
  } });
  await page.goto('/login');
  // Standard, visible credential fields that password managers can identify.
  await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'username webauthn');
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('autocomplete', 'current-password');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
  await page.goto('/app/settings?tab=security');
  await page.getByLabel('Passkey name').fill('Test authenticator');
  const enrollment = page.waitForResponse((r) => r.url().endsWith('/passkeys/register/verify'));
  await page.getByRole('button', { name: 'Add passkey', exact: true }).click();
  const enrollmentResponse = await enrollment;
  expect(enrollmentResponse.ok()).toBe(true);
  await expect(page.getByText('Test authenticator', { exact: true })).toBeVisible();

  const listed = await request.get(`${API}/auth/passkeys`, { headers });
  const keys = (await listed.json()).data;
  expect(keys).toHaveLength(1);
  expect(keys[0].publicKey).toBeUndefined();
  const replayEnrollment = await request.post(`${API}/auth/passkeys/register/verify`, {
    headers, data: enrollmentResponse.request().postDataJSON(),
  });
  expect(replayEnrollment.status()).toBe(401);

  await page.evaluate(() => localStorage.clear());
  await page.goto('/login?redirect=%2Fapp%2Fsettings%3Ftab%3Dsecurity');
  const verification = page.waitForResponse((r) => r.url().endsWith('/passkeys/login/verify'));
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  const verified = await verification;
  expect(verified.ok()).toBe(true);
  await expect(page).toHaveURL(/\/app\/settings\?tab=security/);
  const replayLogin = await request.post(`${API}/auth/passkeys/login/verify`, {
    headers: { Origin: ORIGIN }, data: verified.request().postDataJSON(),
  });
  expect(replayLogin.status()).toBe(401);

  // Only session JWTs can manage credentials; API keys/connector tokens cannot.
  expect((await request.get(`${API}/auth/passkeys`)).status()).toBe(401);
  expect((await request.post(`${API}/auth/passkeys/login/options`, { headers: { Origin: 'https://evil.example' }, data: {} })).status()).toBe(401);

  await page.getByRole('button', { name: 'Remove Test authenticator' }).click();
  await expect(page.getByText('No passkeys added yet.', { exact: false })).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  const revoked = page.waitForResponse((r) => r.url().endsWith('/passkeys/login/verify'));
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  expect((await revoked).status()).toBe(401);
  await expect(page).toHaveURL(/\/login/);
});
