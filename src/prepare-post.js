import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  getPreparedPostData
} from './post-data.js';

import {
  getPostGroupsByStt
} from './post-groups.js';

import {
  openFacebookComposer
} from './open-composer.js';

import {
  acquireJobLock,
  releaseJobLock
} from './job-lock.js';

import {
  getPostProgress,
  markGroupPrepared
} from './post-progress.js';


/* =========================================================
 * CONTENT HELPERS
 * ========================================================= */

function normaliseContent(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '')
    .trim();
}


async function readElementContent(
  element
) {
  return element.evaluate(
    (node) => {
      if (
        node.tagName === 'TEXTAREA' ||
        node.tagName === 'INPUT'
      ) {
        return node.value || '';
      }

      return (
        node.innerText ||
        node.textContent ||
        ''
      );
    }
  );
}


async function readComposerContent(
  composerDialog,
  composerEditor
) {
  const selectedEditorText =
    await readElementContent(
      composerEditor
    ).catch(() => '');

  if (
    normaliseContent(
      selectedEditorText
    )
  ) {
    return selectedEditorText;
  }

  const candidates = [
    composerDialog.locator(
      '[contenteditable="true"][role="textbox"]'
    ),

    composerDialog.locator(
      '[role="textbox"][contenteditable="true"]'
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

      const text =
        await readElementContent(
          item
        ).catch(() => '');

      if (
        normaliseContent(text)
      ) {
        return text;
      }
    }
  }

  return '';
}


/* =========================================================
 * INSERT JD CONTENT
 * ========================================================= */

async function insertComposerContent(
  page,
  composerDialog,
  composerEditor,
  content
) {
  console.log('');
  console.log(
    '=============================='
  );

  console.log(
    'STEP 1: INSERT JD CONTENT'
  );

  console.log(
    '=============================='
  );

  /*
   * Lấy nguyên JD từ Supabase.
   * Không map.
   * Không thêm dấu "-".
   * Không tự format lại.
   */
  const text =
    String(content ?? '');

  if (!text.trim()) {
    throw new Error(
      'JD content is empty.'
    );
  }

  const expectedContent =
    normaliseContent(
      text
    );

  console.log(
    `Expected JD length: ${expectedContent.length}`
  );

  await composerEditor.waitFor({
    state: 'visible',
    timeout: 15_000
  });

  await composerEditor
    .scrollIntoViewIfNeeded();

  console.log(
    'Clicking composer editor...'
  );

  await composerEditor.click({
    timeout: 15_000
  });

  console.log(
    'Focusing composer editor...'
  );

  await composerEditor.evaluate(
    (element) => {
      element.focus();
    }
  );

  await page.waitForTimeout(
    300
  );

  const activeElementInfo =
    await page.evaluate(
      () => {
        const element =
          document.activeElement;

        if (!element) {
          return null;
        }

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
            )
        };
      }
    );

  console.log(
    'Active element:',
    activeElementInfo
  );

  console.log(
    'Clearing existing composer content...'
  );

  await page.keyboard.press(
    process.platform === 'darwin'
      ? 'Meta+A'
      : 'Control+A'
  );

  await page.keyboard.press(
    'Backspace'
  );

  await page.waitForTimeout(
    300
  );

  /*
   * Paste nguyên content từ Supabase
   * trong một lần.
   */
  console.log(
    'Pasting raw JD from Supabase...'
  );

  await page.keyboard.insertText(
    text
  );

  console.log(
    'JD pasted successfully.'
  );

  await page.waitForTimeout(
    1500
  );

  /*
   * Verify content.
   */
  const deadline =
    Date.now() + 10_000;

  let actualContent = '';

  while (
    Date.now() < deadline
  ) {
    const insertedContent =
      await readComposerContent(
        composerDialog,
        composerEditor
      );

    actualContent =
      normaliseContent(
        insertedContent
      );

    console.log(
      `Current composer length: ${actualContent.length}`
    );

    if (
      actualContent ===
      expectedContent
    ) {
      console.log(
        'JD content verified successfully.'
      );

      return;
    }

    await page.waitForTimeout(
      500
    );
  }

  throw new Error(
    [
      'JD content insertion verification failed.',
      '',
      `Expected length: ${expectedContent.length}`,
      `Actual length: ${actualContent.length}`,
      '',
      'The Post button has not been clicked.'
    ].join('\n')
  );
}


/* =========================================================
 * IMAGE UPLOAD
 *
 * OLD WORKING FLOW
 *
 * Không click "Ảnh/video".
 * Tìm thẳng input[type="file"].
 * ========================================================= */

async function uploadComposerImage(
  page,
  composerDialog,
  imagePath
) {
  console.log('');
  console.log(
    '=============================='
  );

  console.log(
    'STEP 2: UPLOAD IMAGE'
  );

  console.log(
    '=============================='
  );

  console.log(
    'Uploading image...'
  );

  console.log(
    `Image path: ${imagePath}`
  );

  const fileInputCandidates = [
    composerDialog.locator(
      'input[type="file"][accept*="image"]'
    ),

    composerDialog.locator(
      'input[type="file"]'
    ),

    page.locator(
      '[role="dialog"] input[type="file"][accept*="image"]'
    ),

    page.locator(
      '[role="dialog"] input[type="file"]'
    ),

    page.locator(
      'input[type="file"][accept*="image"]'
    )
  ];

  let fileInput = null;

  for (
    const candidate
    of fileInputCandidates
  ) {
    const count =
      await candidate.count();

    if (count > 0) {
      fileInput =
        candidate.first();

      break;
    }
  }

  if (!fileInput) {
    throw new Error(
      [
        'Could not find the Facebook image upload input.',
        '',
        'Inspect the open composer manually.',
        'The Post button has not been clicked.'
      ].join('\n')
    );
  }

  const fileInputDebug =
    await fileInput.evaluate(
      (element) => ({
        accept:
          element.getAttribute(
            'accept'
          ),

        multiple:
          Boolean(
            element.multiple
          ),

        disabled:
          Boolean(
            element.disabled
          ),

        html:
          element.outerHTML
            .slice(
              0,
              400
            )
      })
    ).catch(() => null);

  console.log(
    'Selected image input:',
    fileInputDebug
  );

  await fileInput.setInputFiles(
    imagePath
  );

  console.log(
    'Image file selected. Waiting for Facebook preview...'
  );

  const attachedFiles =
    await fileInput.evaluate(
      (element) => {
        if (!element.files) {
          return [];
        }

        return Array
          .from(
            element.files
          )
          .map(
            (file) => ({
              name:
                file.name,

              type:
                file.type,

              size:
                file.size
            })
          );
      }
    ).catch(
      () => []
    );

  console.log(
    'Attached files:',
    attachedFiles
  );

  if (
    attachedFiles.length === 0
  ) {
    throw new Error(
      [
        'setInputFiles() completed, but no file is attached.',
        '',
        'The image has not been inserted.',
        'The Post button has not been clicked.'
      ].join('\n')
    );
  }

  const uploadDeadline =
    Date.now() + 120_000;

  while (
    Date.now() <
    uploadDeadline
  ) {
    const previewCandidates = [
      composerDialog.locator(
        'img[src^="blob:"]'
      ),

      composerDialog.locator(
        'img[src*="fbcdn.net"]'
      ),

      composerDialog.locator(
        '[role="img"][style*="background-image"]'
      )
    ];

    for (
      const candidate
      of previewCandidates
    ) {
      const count =
        await candidate.count();

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        const preview =
          candidate.nth(index);

        if (
          await preview
            .isVisible()
            .catch(() => false)
        ) {
          console.log(
            'Image preview detected successfully.'
          );

          return;
        }
      }
    }

    await page.waitForTimeout(
      1000
    );
  }

  throw new Error(
    [
      'The image was selected, but Facebook preview could not be verified.',
      '',
      'Inspect the open composer manually.',
      'The Post button has not been clicked.'
    ].join('\n')
  );
}


/* =========================================================
 * VALIDATION
 * ========================================================= */

function validateStt(stt) {
  const numericStt =
    Number(stt);

  if (
    !Number.isInteger(
      numericStt
    ) ||
    numericStt <= 0
  ) {
    throw new Error(
      'STT must be a positive integer.'
    );
  }

  return numericStt;
}


function resolveNumericGroupNumber(
  groupNumber,
  totalGroups
) {
  const numericGroupNumber =
    Number(
      groupNumber
    );

  if (
    !Number.isInteger(
      numericGroupNumber
    ) ||
    numericGroupNumber <= 0
  ) {
    throw new Error(
      [
        'Group number must be a positive integer or "next".',
        '',
        'Examples:',
        'node src/prepare-post.js 2 1',
        'node src/prepare-post.js 2 next'
      ].join('\n')
    );
  }

  if (
    numericGroupNumber >
    totalGroups
  ) {
    throw new Error(
      [
        `Invalid group number: ${numericGroupNumber}.`,
        `This post has only ${totalGroups} enabled groups.`,
        '',
        `Valid range: 1-${totalGroups}`
      ].join('\n')
    );
  }

  return numericGroupNumber;
}


/* =========================================================
 * TARGET GROUP
 * ========================================================= */

async function resolveTargetGroup(
  stt,
  groupSelection,
  groups
) {
  if (
    String(
      groupSelection
    )
      .trim()
      .toLowerCase() !==
    'next'
  ) {
    const groupNumber =
      resolveNumericGroupNumber(
        groupSelection,
        groups.length
      );

    return {
      groupNumber,

      targetGroup:
        groups[
          groupNumber - 1
        ],

      selectionMode:
        'manual'
    };
  }

  const progress =
    await getPostProgress(
      stt
    );

  const preparedGroupKeys =
    new Set(
      progress
        .preparedGroupKeys
    );

  const nextGroupIndex =
    groups.findIndex(
      (group) =>
        !preparedGroupKeys.has(
          group.groupKey
        )
    );

  if (
    nextGroupIndex === -1
  ) {
    throw new Error(
      [
        `All ${groups.length} assigned groups have already been prepared for STT ${stt}.`,
        '',
        'Reset progress before starting again:',
        `node src/post-progress.js reset ${stt}`
      ].join('\n')
    );
  }

  return {
    groupNumber:
      nextGroupIndex + 1,

    targetGroup:
      groups[
        nextGroupIndex
      ],

    selectionMode:
      'next'
  };
}


/* =========================================================
 * PUBLISH
 * ========================================================= */

async function publishFacebookPost(
  page,
  composerDialog
) {
  console.log('');
  console.log(
    '=============================='
  );

  console.log(
    'STEP 3: PUBLISH'
  );

  console.log(
    '=============================='
  );

  console.log(
    'Searching for the Facebook Post button...'
  );

  const postButtonCandidates = [
    composerDialog.getByRole(
      'button',
      {
        name:
          /^(đăng|post)$/i
      }
    ),

    composerDialog
      .locator(
        '[role="button"]'
      )
      .filter({
        hasText:
          /^(đăng|post)$/i
      }),

    composerDialog.locator(
      '[role="button"][aria-label="Đăng"]'
    ),

    composerDialog.locator(
      '[role="button"][aria-label="Post"]'
    ),

    page.getByRole(
      'button',
      {
        name:
          /^(đăng|post)$/i
      }
    )
  ];

  const deadline =
    Date.now() + 30_000;

  let postButton = null;

  while (
    Date.now() < deadline &&
    !postButton
  ) {
    for (
      const candidate
      of postButtonCandidates
    ) {
      const count =
        await candidate.count();

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        const button =
          candidate.nth(index);

        const isVisible =
          await button
            .isVisible()
            .catch(() => false);

        if (!isVisible) {
          continue;
        }

        const state =
          await button.evaluate(
            (element) => {
              const ariaDisabled =
                element.getAttribute(
                  'aria-disabled'
                );

              const nativeDisabled =
                'disabled' in element
                  ? element.disabled
                  : false;

              const rect =
                element
                  .getBoundingClientRect();

              return {
                ariaDisabled,
                nativeDisabled,

                width:
                  rect.width,

                height:
                  rect.height,

                text:
                  element.textContent
                    ?.trim()
              };
            }
          );

        const hasUsableSize =
          state.width > 0 &&
          state.height > 0;

        const isEnabled =
          state
            .ariaDisabled !==
            'true' &&
          state
            .nativeDisabled !==
            true;

        if (
          hasUsableSize &&
          isEnabled
        ) {
          postButton =
            button;

          break;
        }
      }

      if (postButton) {
        break;
      }
    }

    if (!postButton) {
      console.log(
        'Post button is not ready yet. Waiting...'
      );

      await page.waitForTimeout(
        1000
      );
    }
  }

  if (!postButton) {
    throw new Error(
      [
        'Could not find an enabled Facebook Post button.',
        '',
        'The composer is still open.',
        'The post was not published.',
        '',
        'Inspect the Facebook window manually.'
      ].join('\n')
    );
  }

  console.log(
    'Enabled Post button found.'
  );

  await postButton
    .scrollIntoViewIfNeeded();

  console.log(
    'Publishing Facebook post...'
  );

  await postButton.click({
    timeout: 15_000
  });

  const publishDeadline =
    Date.now() + 90_000;

  while (
    Date.now() <
    publishDeadline
  ) {
    const dialogVisible =
      await composerDialog
        .isVisible()
        .catch(() => false);

    if (!dialogVisible) {
      console.log(
        'Composer closed after publishing.'
      );

      return {
        status:
          'submitted'
      };
    }

    const pendingApproval =
      page.getByText(
        /pending approval|awaiting approval|chờ phê duyệt|đang chờ duyệt|quản trị viên phê duyệt/i
      );

    if (
      await pendingApproval
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      console.log(
        'Post submitted and is waiting for group approval.'
      );

      return {
        status:
          'pending_approval'
      };
    }

    const errorMessage =
      page.getByText(
        /couldn't post|unable to post|something went wrong|không thể đăng|đã xảy ra lỗi|thử lại/i
      );

    if (
      await errorMessage
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      throw new Error(
        [
          'Facebook displayed an error after clicking Post.',
          '',
          'Progress has not been updated.'
        ].join('\n')
      );
    }

    await page.waitForTimeout(
      1000
    );
  }

  throw new Error(
    [
      'The Post button was clicked, but submission could not be verified.',
      '',
      'Progress has not been updated.',
      'Inspect Facebook manually before retrying.'
    ].join('\n')
  );
}


/* =========================================================
 * PREPARE ONE GROUP
 * ========================================================= */

export async function prepareGroupPost(
  stt,
  groupSelection = 'next'
) {
  const numericStt =
    validateStt(
      stt
    );

  console.log(
    `Loading post data for STT ${numericStt}...`
  );

  const preparedPost =
    await getPreparedPostData(
      numericStt
    );

  console.log(
    'Loading assigned Facebook Groups...'
  );

  const groupResult =
    await getPostGroupsByStt(
      numericStt
    );

  if (
    groupResult
      .groups
      .length === 0
  ) {
    throw new Error(
      `Post STT ${numericStt} has no enabled groups.`
    );
  }

  const {
    groupNumber,
    targetGroup,
    selectionMode
  } =
    await resolveTargetGroup(
      numericStt,
      groupSelection,
      groupResult.groups
    );

  console.log('');

  console.log(
    `Preparing group ${groupNumber} of ${groupResult.groups.length}:`
  );

  console.log(
    `${targetGroup.groupKey} — ${targetGroup.name}`
  );

  console.log(
    `URL: ${targetGroup.url}`
  );

  console.log(
    `Selection mode: ${selectionMode}`
  );

  const composerSession =
    await openFacebookComposer(
      targetGroup
    );

  const {
    page,
    composerDialog,
    composerEditor
  } =
    composerSession;


  /* =======================================================
   * TEXT
   * ======================================================= */

  await insertComposerContent(
    page,
    composerDialog,
    composerEditor,
    preparedPost.jd
  );


  /* =======================================================
   * IMAGE
   * ======================================================= */

  await uploadComposerImage(
    page,
    composerDialog,
    preparedPost
      .image
      .absolutePath
  );


  /* =======================================================
   * PUBLISH
   * ======================================================= */

  const publishResult =
    await publishFacebookPost(
      page,
      composerDialog
    );


  /* =======================================================
   * PROGRESS
   * ======================================================= */

  const updatedProgress =
    await markGroupPrepared({
      stt:
        numericStt,

      groupNumber,

      groupKey:
        targetGroup
          .groupKey
    });

  console.log('');

  console.log(
    'Facebook post submitted successfully.'
  );

  console.log(
    `Publish status: ${publishResult.status}`
  );

  console.log(
    `Prepared groups: ${updatedProgress.preparedGroupKeys.length}/${groupResult.groups.length}`
  );

  await composerSession
    .context
    .close();

  console.log(
    'Facebook Chrome closed.'
  );

  return {
    preparedPost,
    targetGroup,
    groupNumber,

    totalGroups:
      groupResult
        .groups
        .length,

    publishStatus:
      publishResult.status,

    progress:
      updatedProgress
  };
}


/* =========================================================
 * CLI
 * ========================================================= */

async function run() {
  const stt =
    process.argv[2];

  const groupSelection =
    process.argv[3] ||
    'next';

  if (!stt) {
    console.error(
      [
        'Usage:',
        'node src/prepare-post.js <stt> [group-number|next]',
        '',
        'Examples:',
        'node src/prepare-post.js 2 1',
        'node src/prepare-post.js 2 next'
      ].join('\n')
    );

    process.exitCode = 1;

    return;
  }

  let lockHandle = null;

  try {
    lockHandle =
      await acquireJobLock({
        stt:
          Number(stt),

        groupNumber:
          groupSelection
      });

    console.log(
      'Facebook job lock acquired.'
    );

    await prepareGroupPost(
      stt,
      groupSelection
    );
  } catch (error) {
    console.error('');

    console.error(
      'Post preparation test failed.'
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  } finally {
    if (lockHandle) {
      try {
        await releaseJobLock(
          lockHandle
        );

        console.log(
          'Facebook job lock released.'
        );
      } catch (error) {
        console.error(
          'Could not release Facebook job lock.'
        );

        console.error(
          error.message
        );
      }
    }
  }
}


/* =========================================================
 * DIRECT EXECUTION
 * ========================================================= */

const isDirectExecution =
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(
      path.resolve(
        process.argv[1]
      )
    ).href;

if (
  isDirectExecution
) {
  await run();
}
