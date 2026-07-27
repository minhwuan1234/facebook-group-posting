import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  launchFacebookBrowser,
  getAutomationPage
} from './browser.js';

import {
  getGroupById
} from './groups.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const COMPOSER_TIMEOUT_MS = 15_000;

async function firstVisibleLocator(candidates) {
  for (const locator of candidates) {
    const count = await locator.count();

    for (let index = 0; index < count; index += 1) {
      const item = locator.nth(index);

      if (await item.isVisible().catch(() => false)) {
        return item;
      }
    }
  }

  return null;
}

async function findComposerTrigger(page) {
  const candidates = [
    page.getByRole('button', {
      name: /write something|create post|what's on your mind|viết gì đó|tạo bài viết|bạn đang nghĩ gì/i
    }),

    page.locator(
      '[role="button"][aria-label*="Write something" i]'
    ),

    page.locator(
      '[role="button"][aria-label*="Create post" i]'
    ),

    page.locator(
      '[role="button"][aria-label*="Viết gì đó" i]'
    ),

    page.locator(
      '[role="button"][aria-label*="Tạo bài viết" i]'
    ),

    page.getByText(
      /write something|create post|what's on your mind|viết gì đó|tạo bài viết|bạn đang nghĩ gì/i,
      {
        exact: false
      }
    )
  ];

  return firstVisibleLocator(candidates);
}

async function findComposerDialog(page) {
  const dialogCandidates = [
    page.getByRole('dialog'),

    page.locator(
      '[role="dialog"]:has([contenteditable="true"])'
    ),

    page.locator(
      '[role="dialog"]:has(textarea)'
    )
  ];

  return firstVisibleLocator(dialogCandidates);
}

async function findComposerEditor(page) {
  const editorCandidates = [
    page.locator(
      '[role="dialog"] [contenteditable="true"][role="textbox"]'
    ),

    page.locator(
      '[role="dialog"] [contenteditable="true"]'
    ),

    page.locator(
      '[role="dialog"] textarea'
    ),

    page.locator(
      '[contenteditable="true"][role="textbox"]'
    )
  ];

  return firstVisibleLocator(editorCandidates);
}

export async function openFacebookComposer(groupId, options = {}) {
  const timeout =
    Number(options.timeout) ||
    Number(process.env.DEFAULT_TIMEOUT_MS) ||
    DEFAULT_TIMEOUT_MS;

  const group = await getGroupById(groupId);

  console.log('Launching Facebook browser...');
  console.log(`Group: ${group.name}`);
  console.log(`URL: ${group.url}`);

  const browserSession = await launchFacebookBrowser({
    timeout
  });

  const context = browserSession.context;
  const page = await getAutomationPage(context);

  console.log('Opening Facebook Group...');

  await page.goto(group.url, {
    waitUntil: 'domcontentloaded',
    timeout
  });

  await page.waitForTimeout(3000);

  const currentUrl = page.url().toLowerCase();

  if (
    currentUrl.includes('/login') ||
    currentUrl.includes('login.php')
  ) {
    throw new Error(
      'Facebook login is required before the composer can be opened.'
    );
  }

  if (
    currentUrl.includes('/checkpoint') ||
    currentUrl.includes('/two_step_verification')
  ) {
    throw new Error(
      'Facebook requires manual account verification.'
    );
  }

  console.log('Searching for post composer trigger...');

  const composerTrigger = await findComposerTrigger(page);

  if (!composerTrigger) {
    throw new Error(
      [
        'Could not find the Facebook post composer trigger.',
        '',
        'Possible causes:',
        '1. The account cannot post in this group.',
        '2. The Facebook interface has changed.',
        '3. The group requires another action before posting.',
        '4. The page has not fully loaded.',
        '',
        'Inspect the open browser window manually.'
      ].join('\n')
    );
  }

  await composerTrigger.scrollIntoViewIfNeeded();

  await composerTrigger.click({
    timeout: COMPOSER_TIMEOUT_MS
  });

  console.log('Waiting for composer dialog...');

  await page.waitForTimeout(1500);

  const composerDialog = await findComposerDialog(page);
  const composerEditor = await findComposerEditor(page);

  if (!composerDialog || !composerEditor) {
    throw new Error(
      [
        'The composer trigger was clicked, but the composer could not be verified.',
        '',
        'The browser will remain open for inspection.'
      ].join('\n')
    );
  }

  console.log('');
  console.log('Facebook composer opened successfully.');
  console.log(`Group ID: ${group.id}`);
  console.log(`Group name: ${group.name}`);
  console.log(`Current URL: ${page.url()}`);
  console.log('');
  console.log('No content has been inserted.');
  console.log('The Post button has not been clicked.');
  console.log('Chrome will remain open for manual inspection.');

  return {
    context,
    page,
    group,
    composerDialog,
    composerEditor
  };
}

async function run() {
  const groupId = process.argv[2];

  if (!groupId) {
    console.error(
      'Usage: node src/open-composer.js <group-id>'
    );

    process.exitCode = 1;
    return;
  }

  try {
    await openFacebookComposer(groupId);
  } catch (error) {
    console.error('');
    console.error('Open composer test failed.');
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
  await run();
}
