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

async function openFacebookGroup(groupId) {
  if (
    typeof groupId !== 'string' ||
    groupId.trim() === ''
  ) {
    throw new Error('A valid group id is required.');
  }

  const group = await getGroupById(groupId);

  console.log('Launching Facebook browser...');
  console.log(`Group: ${group.name}`);
  console.log(`URL: ${group.url}`);

  const browserSession = await launchFacebookBrowser({
    timeout:
      Number(process.env.DEFAULT_TIMEOUT_MS) ||
      DEFAULT_TIMEOUT_MS
  });

  const page = await getAutomationPage(
    browserSession.context
  );

  console.log('Opening Facebook Group...');

  await page.goto(group.url, {
    waitUntil: 'domcontentloaded'
  });

  console.log('');
  console.log('Group page opened successfully.');
  console.log(`Current URL: ${page.url()}`);
  console.log('');
  console.log(
    'Chrome will remain open for manual inspection.'
  );

  return {
    context: browserSession.context,
    page,
    group
  };
}

async function run() {
  const groupId = process.argv[2];

  if (!groupId) {
    console.error(
      'Usage: node src/open-group.js <group-id>'
    );

    process.exitCode = 1;
    return;
  }

  try {
    await openFacebookGroup(groupId);
  } catch (error) {
    console.error('');
    console.error('Open group test failed.');
    console.error(error.message);

    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);

const executedFilePath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;

if (executedFilePath === currentFilePath) {
  await run();
}

export {
  openFacebookGroup
};
