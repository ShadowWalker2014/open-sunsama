import { expect, test } from "@playwright/test";

test("keeps one set of SEO tags after loading a pre-rendered blog post", async ({
  page,
  request,
}) => {
  const path = "/blog/80-20-rule-productivity";
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const html = (await response.text())
    .replace(/<title>[^<]*<\/title>/, "<title>Pre-rendered blog post</title>")
    .replace(
      /<link rel="canonical"[^>]*>/,
      `<link data-rh="true" rel="canonical" href="https://opensunsama.com${path}" />`
    )
    .replace(
      /<meta name="description"[^>]*>/,
      '<meta data-rh="true" name="description" content="Pre-rendered blog description" />'
    )
    .replace(
      /<meta property="og:title"[^>]*>/,
      '<meta data-rh="true" property="og:title" content="Pre-rendered blog post" />'
    )
    .replace(
      /<meta name="twitter:title"[^>]*>/,
      '<meta data-rh="true" name="twitter:title" content="Pre-rendered blog post" />'
    );
  expect(html).toContain(
    '<link data-rh="true" rel="canonical" href="https://opensunsama.com/blog/80-20-rule-productivity"'
  );
  expect(html).toContain('data-rh="true" property="og:title"');

  // CI runs Vite's dev server, which doesn't serve built prerendered files.
  // Give it crawler-style tags to catch duplicate metadata after the SPA mounts.
  await page.route(`**${path}`, (route) =>
    route.fulfill({ body: html, contentType: "text/html" })
  );
  await page.goto(path);
  await expect(
    page.getByRole("heading", { level: 1, name: /80\/20 Rule for Productivity/ })
  ).toBeVisible();
  for (const selector of [
    "title",
    'link[rel="canonical"]',
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ]) {
    await expect(page.locator(`head ${selector}`)).toHaveCount(1);
  }
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://opensunsama.com${path}`
  );

  await page
    .getByRole("banner")
    .first()
    .getByRole("link", { name: "Open Sunsama" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://opensunsama.com/"
  );
  await expect(page.locator('head meta[property^="article:"]')).toHaveCount(0);
});
