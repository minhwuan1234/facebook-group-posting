import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
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

async function waitForManualPublishConfirmation() {
  const terminal = readline.createInterface({
    input: stdin,
    output: stdout
  });

  try {
    console.log('');
    console.log(
      'Review the Facebook post and publish it manually.'
    );
    console.log(
      'After the post is published, return here and press Enter.'
    );

    await terminal.question('');
  } finally {
    terminal.close();
  }
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

await waitForManualPublishConfirmation();

const updatedProgress =
  await markGroupPrepared({
    stt: numericStt,
    groupNumber,
    groupKey: targetGroup.groupKey
  });

console.log('');
console.log(
  'Manual publish confirmed.'
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
    'The Post button was not clicked.'
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
