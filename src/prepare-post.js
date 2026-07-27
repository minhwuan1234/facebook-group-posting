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

function normaliseContent(value) {
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim();
}

async function readComposerContent(
  composerEditor
) {
  const tagName =
    await composerEditor.evaluate(
      (element) =>
        element.tagName.toLowerCase()
    );

  if (
    tagName === 'textarea' ||
    tagName === 'input'
  ) {
    return composerEditor.inputValue();
  }

  return composerEditor.innerText();
}

async function insertComposerContent(
  composerEditor,
  content
) {
  await composerEditor.click();

  await composerEditor.fill(content);
}

async function uploadComposerImage(
  page,
  composerDialog,
  imagePath
) {
  console.log('Uploading image...');
  console.log(`Image path: ${imagePath}`);

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
    const candidate of fileInputCandidates
  ) {
    const count = await candidate.count();

    if (count > 0) {
      fileInput = candidate.first();
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

  await fileInput.setInputFiles(imagePath);

  console.log(
    'Image file selected. Waiting for Facebook preview...'
  );

  const uploadDeadline =
    Date.now() + 120_000;

  while (Date.now() < uploadDeadline) {
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
      const candidate of previewCandidates
    ) {
      const count = await candidate.count();

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

    await page.waitForTimeout(1000);
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

function validateStt(stt) {
  const numericStt = Number(stt);

  if (
    !Number.isInteger(numericStt) ||
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
    Number(groupNumber);

  if (
    !Number.isInteger(numericGroupNumber) ||
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

  if (numericGroupNumber > totalGroups) {
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

async function resolveTargetGroup(
  stt,
  groupSelection,
  groups
) {
  if (
    String(groupSelection)
      .trim()
      .toLowerCase() !== 'next'
  ) {
    const groupNumber =
      resolveNumericGroupNumber(
        groupSelection,
        groups.length
      );

    return {
      groupNumber,
      targetGroup:
        groups[groupNumber - 1],
      selectionMode: 'manual'
    };
  }

  const progress =
    await getPostProgress(stt);

  const preparedGroupKeys =
    new Set(progress.preparedGroupKeys);

  const nextGroupIndex =
    groups.findIndex(
      (group) =>
        !preparedGroupKeys.has(
          group.groupKey
        )
    );

  if (nextGroupIndex === -1) {
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
      groups[nextGroupIndex],

    selectionMode: 'next'
  };
}

async function publishFacebookPost(
  page,
  composerDialog
) {
  console.log('');
  console.log(
    'Searching for the Facebook Post button...'
  );

  const postButtonCandidates = [
    composerDialog.getByRole('button', {
      name: /^(đăng|post)$/i
    }),

    composerDialog
      .locator('[role="button"]')
      .filter({
        hasText: /^(đăng|post)$/i
      }),

    composerDialog.locator(
      '[role="button"][aria-label="Đăng"]'
    ),

    composerDialog.locator(
      '[role="button"][aria-label="Post"]'
    ),

    page.getByRole('button', {
      name: /^(đăng|post)$/i
    })
  ];

  const deadline = Date.now() + 30_000;

  let postButton = null;

  while (
    Date.now() < deadline &&
    !postButton
  ) {
    for (
      const candidate of postButtonCandidates
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
                element.getBoundingClientRect();

              return {
                ariaDisabled,
                nativeDisabled,
                width: rect.width,
                height: rect.height,
                text:
                  element.textContent?.trim()
              };
            }
          );

        const hasUsableSize =
          state.width > 0 &&
          state.height > 0;

        const isEnabled =
          state.ariaDisabled !== 'true' &&
          state.nativeDisabled !== true;

        if (
          hasUsableSize &&
          isEnabled
        ) {
          postButton = button;
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

      await page.waitForTimeout(1000);
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

  await postButton.scrollIntoViewIfNeeded();

  console.log(
    'Publishing Facebook post...'
  );

  await postButton.click({
    timeout: 15_000
  });

  const publishDeadline =
    Date.now() + 90_000;

  while (
    Date.now() < publishDeadline
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
        status: 'submitted'
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
        status: 'pending_approval'
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

    await page.waitForTimeout(1000);
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

export async function prepareGroupPost(
  stt,
  groupSelection = 'next'
) {
  const numericStt =
    validateStt(stt);

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
    groupResult.groups.length === 0
  ) {
    throw new Error(
      `Post STT ${numericStt} has no enabled groups.`
    );
  }

  const {
    groupNumber,
    targetGroup,
    selectionMode
  } = await resolveTargetGroup(
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

  console.log(`URL: ${targetGroup.url}`);

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
  } = composerSession;

  console.log('');
  console.log(
    'Inserting JD content...'
  );

  await insertComposerContent(
    composerEditor,
    preparedPost.jd
  );

  await page.waitForTimeout(1500);

  const insertedContent =
    await readComposerContent(
      composerEditor
    );

  const expectedContent =
    normaliseContent(
      preparedPost.jd
    );

  const actualContent =
    normaliseContent(
      insertedContent
    );

  if (
    actualContent !== expectedContent
  ) {
    throw new Error(
      [
        'JD content was inserted, but verification failed.',
        '',
        `Expected length: ${expectedContent.length}`,
        `Actual length: ${actualContent.length}`,
        '',
        'Inspect the open composer manually.',
        'The Post button has not been clicked.'
      ].join('\n')
    );
  }

  console.log(
    'JD content verified successfully.'
  );

  console.log('');

  await uploadComposerImage(
    page,
    composerDialog,
    preparedPost.image.absolutePath
  );

const publishResult =
  await publishFacebookPost(
    page,
    composerDialog
  );

const updatedProgress =
  await markGroupPrepared({
    stt: numericStt,
    groupNumber,
    groupKey: targetGroup.groupKey
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
  
  console.log('');
  console.log(
    'Progress updated successfully.'
  );

  console.log(
    `Prepared groups: ${updatedProgress.preparedGroupKeys.length}/${groupResult.groups.length}`
  );

  console.log('');
  console.log(
    'Post preparation test passed.'
  );

  console.log(
    `STT: ${preparedPost.stt}`
  );

  console.log(
    `Position: ${preparedPost.position.name}`
  );

  console.log(
    `Group: ${targetGroup.groupKey}`
  );

  console.log(
    `Image: ${preparedPost.image.relativePath}`
  );

  console.log('');
  console.log(
    'JD content has been inserted.'
  );

  console.log(
    'Image has been uploaded successfully.'
  );

  console.log(
    `Prepared group ${groupNumber} of ${groupResult.groups.length}.`
  );

  console.log(
     `Publish status: ${publishResult.status}`
  );


  await composerSession.context.close();

console.log(
  'Facebook Chrome closed.'
);

  return {
    ...composerSession,
    preparedPost,
    targetGroup,
    groupNumber,
    totalGroups:
      groupResult.groups.length,
    progress: updatedProgress
  };
}

async function run() {
  const stt = process.argv[2];

  const groupSelection =
    process.argv[3] || 'next';

  if (!stt) {
    console.error(
      [
        'Usage:',
        'node src/prepare-post.js <stt> [group-number|next]',
        '',
        'Examples:',
        'node src/prepare-post.js 1 next',
        'node src/prepare-post.js 1 1',
        'node src/prepare-post.js 1 2',
        '',
        'The default selection is "next".'
      ].join('\n')
    );

    process.exitCode = 1;
    return;
  }

  let lockHandle = null;

  try {
    lockHandle =
      await acquireJobLock({
        stt: Number(stt),
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

    console.error(error.message);

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

        console.error(error.message);
      }
    }
  }
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(
      path.resolve(process.argv[1])
    ).href;

if (isDirectExecution) {
  await run();
}
