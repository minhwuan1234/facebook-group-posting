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
  /*
   * Thử editor đã chọn trước.
   */
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

  /*
   * Nếu Facebook đã thay DOM sau khi gõ,
   * scan lại tất cả textbox/contenteditable
   * trong đúng composer dialog.
   */
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

  const text =
    String(content ?? '');

  if (!text.trim()) {
    throw new Error(
      'JD content is empty.'
    );
  }

  console.log(
    `Expected JD length: ${normaliseContent(text).length}`
  );

  await composerEditor.waitFor({
    state: 'visible',
    timeout: 15_000
  });

  const editorBefore =
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
            rect.height
        };
      }
    );

  console.log(
    'Editor before input:',
    editorBefore
  );

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

  /*
   * Clear composer hiện tại.
   */
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
   * Gõ text giống thao tác người dùng hơn.
   *
   * Không dùng fill().
   * Không dùng insertText() ở bước chính.
   */
  console.log(
    'Typing JD content with keyboard...'
  );

  await page.keyboard.type(
    text,
    {
      delay: 1
    }
  );

  console.log(
    'Keyboard typing completed.'
  );

  await page.waitForTimeout(
    1500
  );

  /*
   * Verify.
   */
  console.log(
    'Reading composer content back...'
  );

  const expectedContent =
    normaliseContent(
      text
    );

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

  /*
   * Debug editor state cuối.
   */
  const editorAfter =
    await composerEditor.evaluate(
      (element) => ({
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

        text:
          element.innerText ||
          element.textContent ||
          '',

        htmlPreview:
          element.innerHTML
            ?.slice(
              0,
              500
            )
      })
    ).catch(() => null);

  console.log(
    'Editor after failed input:',
    editorAfter
  );

  throw new Error(
    [
      'JD content insertion verification failed.',
      '',
      `Expected length: ${expectedContent.length}`,
      `Actual length: ${actualContent.length}`,
      '',
      'The Facebook composer did not contain the expected JD text.',
      'The Post button has not been clicked.'
    ].join('\n')
  );
}


/* =========================================================
 * IMAGE UPLOAD
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

    console.log(
      `File input candidate count: ${count}`
    );

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const item =
        candidate.nth(index);

      const info =
        await item.evaluate(
          (element) => ({
            type:
              element.getAttribute(
                'type'
              ),

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

            outerHTML:
              element.outerHTML
                .slice(
                  0,
                  400
                )
          })
        ).catch(() => null);

      console.log(
        'File input candidate:',
        info
      );

      if (
        info &&
        !info.disabled
      ) {
        fileInput =
          item;

        break;
      }
    }

    if (fileInput) {
      break;
    }
  }

  if (!fileInput) {
    throw new Error(
      [
        'Could not find a usable Facebook image file input.',
        '',
        'The Post button has not been clicked.'
      ].join('\n')
    );
  }

  const selectedInputInfo =
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

        outerHTML:
          element.outerHTML
            .slice(
              0,
              400
            )
      })
    );

  console.log(
    'Selected file input:',
    selectedInputInfo
  );

  console.log(
    'Setting image file...'
  );

  await fileInput.setInputFiles(
    imagePath
  );

  await page.waitForTimeout(
    500
  );

  const filesInfo =
    await fileInput.evaluate(
      (element) => {
        const files =
          element.files;

        if (!files) {
          return {
            count: 0,
            files: []
          };
        }

        return {
          count:
            files.length,

          files:
            Array.from(files)
              .map(
                (file) => ({
                  name:
                    file.name,

                  type:
                    file.type,

                  size:
                    file.size
                })
              )
        };
      }
    );

  console.log(
    'Files attached to input:',
    filesInfo
  );

  if (
    filesInfo.count < 1
  ) {
    throw new Error(
      [
        'setInputFiles() completed, but the file input contains no files.',
        '',
        'The Post button has not been clicked.'
      ].join('\n')
    );
  }

  console.log(
    'Image file attached to input successfully.'
  );

  console.log(
    'Waiting for Facebook image preview...'
  );

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
      ),

      composerDialog.locator(
        'img'
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

        const visible =
          await preview
            .isVisible()
            .catch(() => false);

        if (!visible) {
          continue;
        }

        const info =
          await preview.evaluate(
            (element) => {
              const rect =
                element
                  .getBoundingClientRect();

              return {
                tag:
                  element.tagName,

                src:
                  element.getAttribute(
                    'src'
                  ),

                role:
                  element.getAttribute(
                    'role'
                  ),

                width:
                  rect.width,

                height:
                  rect.height
              };
            }
          ).catch(() => null);

        if (
          !info ||
          info.width <= 0 ||
          info.height <= 0
        ) {
          continue;
        }

        /*
         * Tránh nhận nhầm avatar/icon rất nhỏ.
         */
        if (
          info.width < 80 &&
          info.height < 80
        ) {
          continue;
        }

        console.log(
          'Image preview candidate:',
          info
        );

        console.log(
          'Image preview detected successfully.'
        );

        return;
      }
    }

    await page.waitForTimeout(
      1000
    );
  }

  throw new Error(
    [
      'The image was attached to the file input, but Facebook preview could not be verified.',
      '',
      'The Post button has not been clicked.',
      'Inspect the open composer manually.'
    ].join('\n')
  );
}


/* =========================================================
 * INPUT VALIDATION
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
        'node src/prepare-post.js 1 1',
        'node src/prepare-post.js 1 next'
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

        const visible =
          await button
            .isVisible()
            .catch(() => false);

        if (!visible) {
          continue;
        }

        const state =
          await button.evaluate(
            (element) => {
              const rect =
                element
                  .getBoundingClientRect();

              return {
                ariaDisabled:
                  element.getAttribute(
                    'aria-disabled'
                  ),

                nativeDisabled:
                  'disabled'
                  in element
                    ? Boolean(
                        element.disabled
                      )
                    : false,

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

        const enabled =
          state
            .ariaDisabled !==
            'true' &&
          !state
            .nativeDisabled &&
          state.width > 0 &&
          state.height > 0;

        if (enabled) {
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
        'The post was not published.'
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

    const pendingVisible =
      await pendingApproval
        .first()
        .isVisible()
        .catch(() => false);

    if (pendingVisible) {
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

    const errorVisible =
      await errorMessage
        .first()
        .isVisible()
        .catch(() => false);

    if (errorVisible) {
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

if (isDirectExecution) {
  await run();
}
