import { chromium } from 'playwright-core';

const DEFAULT_CDP_URL = 'http://127.0.0.1:9223';
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Connect to the dedicated Facebook Chrome instance.
 *
 * This function does not launch Chrome.
 * Chrome must already be running with remote debugging enabled.
 */
export async function connectToFacebookBrowser(options = {}) {
  const cdpUrl =
    options.cdpUrl ||
    process.env.FACEBOOK_CDP_URL ||
    DEFAULT_CDP_URL;

  const timeout =
    Number(options.timeout) ||
    Number(process.env.DEFAULT_TIMEOUT_MS) ||
    DEFAULT_TIMEOUT_MS;

  let browser;

  try {
    browser = await chromium.connectOverCDP(cdpUrl, {
      timeout
    });
  } catch (error) {
    throw new Error(
      [
        `Could not connect to Facebook Chrome at ${cdpUrl}.`,
        'Confirm that the dedicated Chrome instance is running on port 9223.',
        `Original error: ${error.message}`
      ].join('\n')
    );
  }

  const contexts = browser.contexts();

  if (contexts.length === 0) {
    await browser.close();

    throw new Error(
      'Chrome connected successfully, but no browser context was found.'
    );
  }

  const context = contexts[0];

  return {
    browser,
    context,
    cdpUrl
  };
}

/**
 * Create a new page owned by this automation job.
 *
 * Existing tabs are not reused.
 */
export async function createAutomationPage(context, options = {}) {
  if (!context) {
    throw new Error('A valid browser context is required.');
  }

  const timeout =
    Number(options.timeout) ||
    Number(process.env.DEFAULT_TIMEOUT_MS) ||
    DEFAULT_TIMEOUT_MS;

  const page = await context.newPage();
  page.setDefaultTimeout(timeout);
  page.setDefaultNavigationTimeout(timeout);

  return page;
}

/**
 * Disconnect Playwright without closing the external Chrome process.
 */
export async function disconnectFromBrowser(browser) {
  if (!browser) {
    return;
  }

  await browser.close();
}

/**
 * Temporary connection test.
 *
 * Run:
 * node src/browser.js
 */
async function runConnectionTest() {
  let browser;
  let page;

  try {
    console.log('Connecting to Facebook Chrome Worker...');

    const connection = await connectToFacebookBrowser();
    browser = connection.browser;

    console.log(`Connected successfully: ${connection.cdpUrl}`);

    page = await createAutomationPage(connection.context);

    console.log('Opening test page...');

    await page.goto('https://example.com', {
      waitUntil: 'domcontentloaded'
    });

    console.log(`Page opened: ${await page.title()}`);
    console.log(`URL: ${page.url()}`);
    console.log('');
    console.log('Browser connection test passed.');
    console.log('The test tab will remain open.');

    page = null;
  } catch (error) {
    console.error('');
    console.error('Browser connection test failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await disconnectFromBrowser(browser);
    }
  }
}

const isDirectExecution =
  process.argv[1] &&
  new URL(import.meta.url).pathname === process.argv[1];

if (isDirectExecution) {
  await runConnectionTest();
}
