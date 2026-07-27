import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  launchFacebookBrowser,
  getAutomationPage
} from './browser.js';

const FACEBOOK_HOME_URL = 'https://www.facebook.com/';
const DEFAULT_TIMEOUT_MS = 30_000;

function detectSessionStateFromUrl(url) {
  const currentUrl = url.toLowerCase();

  if (
    currentUrl.includes('/login') ||
    currentUrl.includes('login.php')
  ) {
    return {
      status: 'login_required',
      message: 'Facebook login is required.'
    };
  }

  if (
    currentUrl.includes('/checkpoint') ||
    currentUrl.includes('/two_step_verification') ||
    currentUrl.includes('/recover')
  ) {
    return {
      status: 'manual_verification_required',
      message:
        'Facebook requires manual verification or account recovery.'
    };
  }

  return null;
}

async function detectSessionStateFromPage(page) {
  const passwordInput = page.locator(
    'input[type="password"], input[name="pass"]'
  );

  if (await passwordInput.first().isVisible().catch(() => false)) {
    return {
      status: 'login_required',
      message: 'Facebook login form is visible.'
    };
  }

  const checkpointText = page.getByText(
    /checkpoint|security check|confirm your identity|xác nhận danh tính|kiểm tra bảo mật/i
  );

  if (await checkpointText.first().isVisible().catch(() => false)) {
    return {
      status: 'manual_verification_required',
      message:
        'Facebook security verification is visible.'
    };
  }

  const loggedInIndicators = [
    page.locator('[aria-label="Facebook"]'),
    page.locator('[role="navigation"]'),
    page.locator('a[href*="/me/"]'),
    page.locator('a[href*="/groups/"]')
  ];

  for (const indicator of loggedInIndicators) {
    if (await indicator.first().isVisible().catch(() => false)) {
      return {
        status: 'logged_in',
        message: 'Facebook login session appears active.'
      };
    }
  }

  return {
    status: 'unknown',
    message:
      'Could not reliably determine the Facebook session state.'
  };
}

export async function validateFacebookSession(options = {}) {
  const timeout =
    Number(options.timeout) ||
    Number(process.env.DEFAULT_TIMEOUT_MS) ||
    DEFAULT_TIMEOUT_MS;

  const browserSession = await launchFacebookBrowser({
    timeout
  });

  const page = await getAutomationPage(
    browserSession.context
  );

  await page.goto(FACEBOOK_HOME_URL, {
    waitUntil: 'domcontentloaded',
    timeout
  });

  await page.waitForTimeout(3000);

  const urlState = detectSessionStateFromUrl(
    page.url()
  );

  const result =
    urlState ||
    (await detectSessionStateFromPage(page));

  return {
    ...result,
    currentUrl: page.url(),
    context: browserSession.context,
    page
  };
}

async function runSessionTest() {
  try {
    console.log('Checking Facebook session...');

    const result =
      await validateFacebookSession();

    console.log('');
    console.log(`Status: ${result.status}`);
    console.log(`Message: ${result.message}`);
    console.log(`URL: ${result.currentUrl}`);

    if (result.status === 'logged_in') {
      console.log('');
      console.log('Facebook session test passed.');
      return;
    }

    if (
      result.status === 'login_required' ||
      result.status ===
        'manual_verification_required'
    ) {
      console.log('');
      console.log(
        'Complete the required Facebook action manually in Chrome.'
      );

      process.exitCode = 2;
      return;
    }

    console.log('');
    console.log(
      'Session state is unknown. Inspect the browser manually.'
    );

    process.exitCode = 3;
  } catch (error) {
    console.error('');
    console.error(
      'Facebook session test failed.'
    );
    console.error(error.message);

    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(
  import.meta.url
);

const executedFilePath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;

if (executedFilePath === currentFilePath) {
  await runSessionTest();
}
