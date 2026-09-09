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


/* =========================================================
 * LOCATOR HELPERS
 * ========================================================= */

async function firstVisibleLocator(candidates) {
  for (const locator of candidates) {
    const count = await locator.count();

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const item =
        locator.nth(index);

      const visible =
        await item
          .isVisible()
          .catch(() => false);

      if (visible) {
        return item;
      }
    }
  }

  return null;
}


/* =========================================================
 * GROUP VALIDATION
 * ========================================================= */

function validateFacebookGroup(group) {
  if (
    !group ||
    typeof group !== 'object'
  ) {
    throw new Error(
      'A valid Facebook Group object is required.'
    );
  }

  const groupKey =
    group.groupKey ||
    group.group_key ||
    group.id;

  if (
    typeof groupKey !== 'string' ||
    groupKey.trim() === ''
  ) {
    throw new Error(
      'Facebook Group is missing a valid group key.'
    );
  }

  if (
    typeof group.name !== 'string' ||
    group.name.trim() === ''
  ) {
    throw new Error(
      `Facebook Group "${groupKey}" is missing a valid name.`
    );
  }

  if (
    typeof group.url !== 'string' ||
    group.url.trim() === ''
  ) {
    throw new Error(
      `Facebook Group "${groupKey}" is missing a valid URL.`
    );
  }

  let parsedUrl;

  try {
    parsedUrl =
      new URL(
        group.url
      );
  } catch {
    throw new Error(
      `Facebook Group "${groupKey}" has an invalid URL.`
    );
  }

  const isFacebookHost =
    parsedUrl.hostname ===
      'facebook.com' ||
    parsedUrl.hostname ===
      'www.facebook.com';

  if (
    !isFacebookHost ||
    !parsedUrl.pathname
      .startsWith('/groups/')
  ) {
    throw new Error(
      `Facebook Group "${groupKey}" does not have a valid Facebook Group URL.`
    );
  }

  if (
    group.enabled === false
  ) {
    throw new Error(
      `Facebook Group "${groupKey}" is disabled.`
    );
  }

  return {
    id:
      groupKey.trim(),

    groupKey:
      groupKey.trim(),

    name:
      group.name.trim(),

    url:
      group.url.trim(),

    enabled:
      true
  };
}


async function resolveGroup(
  groupInput
) {
  if (
    typeof groupInput === 'string' &&
    groupInput.trim() !== ''
  ) {
    const localGroup =
      await getGroupById(
        groupInput.trim()
      );

    return validateFacebookGroup({
      groupKey:
        localGroup.id,

      name:
        localGroup.name,

      url:
        localGroup.url,

      enabled:
        localGroup.enabled
    });
  }

  return validateFacebookGroup(
    groupInput
  );
}


/* =========================================================
 * FACEBOOK STATE
 * ========================================================= */

function detectBlockedFacebookState(
  page
) {
  const currentUrl =
    page
      .url()
      .toLowerCase();

  if (
    currentUrl.includes('/login') ||
    currentUrl.includes(
      'login.php'
    )
  ) {
    return (
      'Facebook login is required before the composer can be opened.'
    );
  }

  if (
    currentUrl.includes(
      '/checkpoint'
    ) ||
    currentUrl.includes(
      '/two_step_verification'
    ) ||
    currentUrl.includes(
      '/recover'
    )
  ) {
    return (
      'Facebook requires manual account verification.'
    );
  }

  return null;
}


/* =========================================================
 * COMPOSER TRIGGER
 * ========================================================= */

async function findComposerTrigger(
  page
) {
  const textPattern =
    /bạn viết gì đi|viết gì đó|tạo bài viết|bạn đang nghĩ gì|write something|create post|what's on your mind/i;

  const candidates = [
    page
      .locator(
        '[role="button"]'
      )
      .filter({
        hasText:
          /bạn viết gì đi/i
      }),

    page
      .locator(
        '[role="button"]'
      )
      .filter({
        hasText:
          /viết gì đó|tạo bài viết|bạn đang nghĩ gì/i
      }),

    page.getByRole(
      'button',
      {
        name:
          textPattern
      }
    ),

    page.locator(
      '[role="button"][aria-label*="Bạn viết gì đi" i]'
    ),

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
      textPattern,
      {
        exact: false
      }
    )
  ];

  return firstVisibleLocator(
    candidates
  );
}


/* =========================================================
 * COMPOSER DIALOG
 * ========================================================= */

async function findComposerDialog(
  page
) {
  const candidates = [
    page.locator(
      '[role="dialog"]:has([contenteditable="true"])'
    ),

    page.locator(
      '[role="dialog"]:has(textarea)'
    ),

    page.getByRole(
      'dialog'
    )
  ];

  return firstVisibleLocator(
    candidates
  );
}


/* =========================================================
 * COMPOSER EDITOR
 * ========================================================= */

async function findComposerEditor(
  page,
  composerDialog
) {
  if (!composerDialog) {
    return null;
  }

  const candidates = [
    composerDialog.locator(
      '[contenteditable="true"][role="textbox"]'
    ),

    composerDialog.locator(
      '[role="textbox"][contenteditable="true"]'
    ),

    composerDialog.locator(
      'div[contenteditable="true"]'
    ),

    composerDialog.locator(
      '[contenteditable="true"]'
    ),

    composerDialog.locator(
      'textarea'
    )
  ];

  for (
    const candidate
    of candidates
  ) {
    const count =
      await candidate.count();

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const item =
        candidate.nth(index);

      const visible =
        await item
          .isVisible()
          .catch(() => false);

      if (!visible) {
        continue;
      }

      const info =
        await item.evaluate(
          (element) => {
            const rect =
              element
                .getBoundingClientRect();

            return {
              tag:
                element.tagName,

              role:
                element.getAttribute(
                  'role'
                ),

              contenteditable:
                element.getAttribute(
                  'contenteditable'
                ),

              ariaLabel:
                element.getAttribute(
                  'aria-label'
                ),

              ariaPlaceholder:
                element.getAttribute(
                  'aria-placeholder'
                ),

              text:
                element.innerText ||
                element.textContent ||
                '',

              width:
                rect.width,

              height:
                rect.height
            };
          }
        );

      console.log(
        'Composer editor candidate:',
        info
      );

      if (
        info.width <= 0 ||
        info.height <= 0
      ) {
        continue;
      }

      return item;
    }
  }

  /*
   * Fallback cuối:
   * tìm contenteditable visible trong dialog.
   */
  const fallbackCandidates =
    page.locator(
      '[role="dialog"] [contenteditable="true"]'
    );

  const fallbackCount =
    await fallbackCandidates.count();

  for (
    let index = 0;
    index < fallbackCount;
    index += 1
  ) {
    const item =
      fallbackCandidates.nth(
        index
      );

    const visible =
      await item
        .isVisible()
        .catch(() => false);

    if (!visible) {
      continue;
    }

    const insideDialog =
      await item.evaluate(
        (element) => {
          return Boolean(
            element.closest(
              '[role="dialog"]'
            )
          );
        }
      );

    if (!insideDialog) {
      continue;
    }

    console.log(
      'Using fallback composer editor.'
    );

    return item;
  }

  return null;
}


/* =========================================================
 * DEBUG SELECTED EDITOR
 * ========================================================= */

async function logSelectedComposerEditor(
  composerEditor
) {
  if (!composerEditor) {
    return;
  }

  const editorDebug =
    await composerEditor.evaluate(
      (element) => {
        const rect =
          element
            .getBoundingClientRect();

        return {
          tag:
            element.tagName,

          role:
            element.getAttribute(
              'role'
            ),

          contenteditable:
            element.getAttribute(
              'contenteditable'
            ),

          ariaLabel:
            element.getAttribute(
              'aria-label'
            ),

          ariaPlaceholder:
            element.getAttribute(
              'aria-placeholder'
            ),

          text:
            element.innerText ||
            element.textContent ||
            '',

          width:
            rect.width,

          height:
            rect.height,

          htmlPreview:
            element.innerHTML
              ?.slice(
                0,
                300
              )
        };
      }
    );

  console.log(
    'Selected composer editor:',
    editorDebug
  );
}


/* =========================================================
 * OPEN FACEBOOK COMPOSER
 * ========================================================= */

export async function openFacebookComposer(
  groupInput,
  options = {}
) {
  const timeout =
    Number(
      options.timeout
    ) ||
    Number(
      process.env
        .DEFAULT_TIMEOUT_MS
    ) ||
    DEFAULT_TIMEOUT_MS;

  const group =
    await resolveGroup(
      groupInput
    );

  console.log(
    'Launching Facebook browser...'
  );

  console.log(
    `Group: ${group.name}`
  );

  console.log(
    `URL: ${group.url}`
  );

  const browserSession =
    options.browserSession ||
    await launchFacebookBrowser({
      timeout
    });

  const context =
    browserSession.context;

  const page =
    options.page ||
    await getAutomationPage(
      context
    );

  console.log(
    'Opening Facebook Group...'
  );

  await page.goto(
    group.url,
    {
      waitUntil:
        'domcontentloaded',

      timeout
    }
  );

  await page.waitForTimeout(
    3000
  );

  const blockedState =
    detectBlockedFacebookState(
      page
    );

  if (blockedState) {
    throw new Error(
      blockedState
    );
  }

  console.log(
    'Searching for post composer trigger...'
  );

  const composerTrigger =
    await findComposerTrigger(
      page
    );

  if (!composerTrigger) {
    throw new Error(
      [
        'Could not find the Facebook post composer trigger.',
        '',
        `Group: ${group.name}`,
        `URL: ${group.url}`,
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

  await composerTrigger
    .scrollIntoViewIfNeeded();

  await composerTrigger.click({
    timeout:
      COMPOSER_TIMEOUT_MS
  });

  console.log(
    'Waiting for composer dialog...'
  );

  await page.waitForTimeout(
    1500
  );

  const composerDialog =
    await findComposerDialog(
      page
    );

  if (!composerDialog) {
    throw new Error(
      [
        'The composer trigger was clicked, but the composer dialog could not be found.',
        '',
        `Group: ${group.name}`,
        `URL: ${group.url}`,
        '',
        'The browser will remain open for inspection.'
      ].join('\n')
    );
  }

  /*
   * Quan trọng:
   * Chỉ tìm editor SAU KHI đã tìm được đúng dialog.
   */
  const composerEditor =
    await findComposerEditor(
      page,
      composerDialog
    );

  if (!composerEditor) {
    throw new Error(
      [
        'The composer dialog opened, but the content editor could not be found.',
        '',
        `Group: ${group.name}`,
        `URL: ${group.url}`,
        '',
        'The browser will remain open for inspection.'
      ].join('\n')
    );
  }

  await logSelectedComposerEditor(
    composerEditor
  );

  console.log('');
  console.log(
    'Facebook composer opened successfully.'
  );

  console.log(
    `Group key: ${group.groupKey}`
  );

  console.log(
    `Group name: ${group.name}`
  );

  console.log(
    `Current URL: ${page.url()}`
  );

  console.log('');

  console.log(
    'No content has been inserted.'
  );

  console.log(
    'The Post button has not been clicked.'
  );

  return {
    context,
    page,
    group,
    composerDialog,
    composerEditor,
    browserSession
  };
}


/* =========================================================
 * CLI TEST
 * ========================================================= */

async function run() {
  const groupId =
    process.argv[2];

  if (!groupId) {
    console.error(
      'Usage: node src/open-composer.js <group-id>'
    );

    process.exitCode = 1;

    return;
  }

  try {
    await openFacebookComposer(
      groupId
    );
  } catch (error) {
    console.error('');

    console.error(
      'Open composer test failed.'
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  }
}


/* =========================================================
 * DIRECT EXECUTION
 * ========================================================= */

const currentFilePath =
  fileURLToPath(
    import.meta.url
  );

const executedFilePath =
  process.argv[1]
    ? path.resolve(
        process.argv[1]
      )
    : null;

if (
  executedFilePath ===
  currentFilePath
) {
  await run();
}
