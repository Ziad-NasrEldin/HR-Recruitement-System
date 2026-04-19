const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const pages = [
    { name: 'login', url: '/login', auth: false },
    { name: 'dashboard', url: '/dashboard' },
    { name: 'leads', url: '/leads' },
    { name: 'leads-new', url: '/leads/new' },
    { name: 'offers', url: '/offers' },
    { name: 'offers-new', url: '/offers/new' },
    { name: 'commissions', url: '/commissions' },
    { name: 'analytics', url: '/analytics' },
    { name: 'post-generator', url: '/post-generator' },
    { name: 'campaigns', url: '/campaigns' },
    { name: 'settings-users', url: '/settings' },
    { name: 'settings-users-new', url: '/settings/users/new' },
    { name: 'settings-facebook-groups', url: '/settings/facebook-groups' },
  ];

  // Screenshot login page (no auth)
  for (const p of pages) {
    try {
      if (!p.auth) {
        // Clear cookies for unauthenticated page
        await page.goto(`http://localhost:3000${p.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      } else {
        // Login first if not already
        if (!page.url().includes('dashboard')) {
          await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
          await page.fill('input[name="email"]', 'ziad@hrrecruit.com');
          await page.fill('input[name="password"]', 'pass1234');
          await page.click('button[type="submit"]');
          await page.waitForURL('**/dashboard**', { timeout: 15000 });
        }
        await page.goto(`http://localhost:3000${p.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      }
      // Screenshot desktop
      await page.screenshot({ path: path.join(screenshotsDir, `${p.name}-desktop.png`), fullPage: true });
      // Screenshot mobile
      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({ path: path.join(screenshotsDir, `${p.name}-mobile.png`), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 900 });
      console.log(`Screenshot: ${p.name}`);
    } catch (e) {
      console.error(`Failed: ${p.name} - ${e.message}`);
    }
  }

  await browser.close();
  console.log('All screenshots taken!');
})();