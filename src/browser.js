import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_TIMEOUT_MS = 30_000;

const DEFAULT_PROFILE_DIR = path.join(
  os.homedir(),
  '.hermes',
  'browser-profiles',
  'facebook'
);

/**
 * Launch a dedicated persistent Google Chrome profile.
 *
 * This browser is isolated from:
 * - the user's normal Chrome profile;
 * - other local automation flows;
 * - other Playwright jobs.
 *
 * The persistent profile keeps Facebook cookies and login state.
 */
export async function launchFacebookBrowser(options = {}) {
  const profileDir =
    options.profileDir ||
    process.env.FACEBOOK_CHROME_PROFILE ||
    DEFAULT_PROFILE_DIR;

  const timeout =
    Number(options.timeout) ||
    Number(process.env.DEFAULT_TIMEOUT_MS) ||
    DEFAULT_TIMEOUT_MS;

  let context;

  try {
    context = await chromium.launchPersistentContext(profileDir, {
      channel: 'chrome',
      headless: false,
      timeout,
      viewport: null,
      acceptDownloads: true,
      args: [
        '--start-maximized',
        '--disable-session-crashed-bubble'
      ]
    });
  } catch (error) {
    throw new Error(
      [
        'Could not launch the dedicated Facebook Chrome profile.',
        `Profile directory: ${profileDir}`,
        '',
        'Possible causes:',
        '1. The Facebook Chrome profile is already open.',
        '2. Google Chrome is not installed.',
        '3. Another process is using the same profile directory.',
        '',
        `Original error: ${error.message}`
      ].join('\n')
    );
  }

  context.setDefaultTimeout(timeout);
  context.setDefaultNavigationTimeout(timeout);

  return {
    context,
    profileDir
  };
}

/**
 * Return a clean automation page.
 *
 * Persistent Chrome sometimes creates an initial blank tab.
 * That tab may be reused only when it is still blank.
 */
export async function getAutomationPage(context) {
  if (!context) {
    throw new Error('A valid browser context is required.');
  }

  const existingPages = context.pages();

  const blankPage = existingPages.find((page) => {
    const url = page.url();

    return url === 'about:blank' || url === 'chrome://newtab/';
  });

  if (blankPage) {
    return blankPage;
  }

  return context.newPage();
}

/**
 * Close only one automation page.
 *
 * This function does not close the entire browser context.
 */
export async function closeAutomationPage(page) {
  if (!page || page.isClosed()) {
    return;
  }

  await page.close();
}

/**
 * Temporary browser launch test.
 *
 * Run:
 * node src/browser.js
 */
async function runBrowserTest() {
  let context;

  try {
    console.log('Launching dedicated Facebook Chrome profile...');

    const browserSession = await launchFacebookBrowser();
    context = browserSession.context;

    console.log(`Profile: ${browserSession.profileDir}`);

    const page = await getAutomationPage(context);

    console.log('Opening test page...');

    await page.goto('https://example.com', {
      waitUntil: 'domcontentloaded'
    });

    console.log(`Page opened: ${await page.title()}`);
    console.log(`URL: ${page.url()}`);
    console.log('');
    console.log('Browser launch test passed.');
    console.log('Chrome will remain open for manual inspection.');
    console.log('');
    console.log(
      'Close the Chrome window manually when you finish testing.'
    );

    // Do not close the persistent context here.
    // Phase 1 requires the browser to remain visible for manual review.
  } catch (error) {
    console.error('');
    console.error('Browser launch test failed.');
    console.error(error.message);

    if (context) {
      await context.close().catch(() => {});
    }

    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;

if (executedFilePath === currentFilePath) {
  await runBrowserTest();
}
