import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  acquireJobLock,
  releaseJobLock
} from './job-lock.js';

import {
  getPreparedPostData
} from './post-data.js';

import {
  getPostGroupsByStt
} from './post-groups.js';

import {
  openFacebookComposer
} from './open-composer.js';

function normaliseContent(value) {
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim();
}

async function readComposerContent(composerEditor) {
  const tagName = await composerEditor.evaluate(
    (element) => element.tagName.toLowerCase()
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

  const tagName = await composerEditor.evaluate(
    (element) => element.tagName.toLowerCase()
  );

  if (
    tagName === 'textarea' ||
    tagName === 'input'
  ) {
    await composerEditor.fill(content);
    return;
  }

  await composerEditor.fill(content);
}

async function uploadComposerImage(
  page,
  composerDialog,
  imagePath
) {
  console.log('Uploading image...');

  const fileInputs = [
    composerDialog.locator('input[type="file"]'),
    page.locator(
      '[role="dialog"] input[type="file"]'
    ),
    page.locator(
      'input[type="file"][accept*="image"]'
    )
  ];

  let fileInput = null;

  for (const candidate of fileInputs) {
    const count = await candidate.count();

    if (count > 0) {
      fileInput = candidate.first();
      break;
    }
  }

  if (!fileInput) {
    throw new Error(
      [
        'Could not find the image upload input.',
        'Inspect the open composer manually.',
        'The Post button has not been clicked.'
      ].join('\n')
    );
  }

  await fileInput.setInputFiles(imagePath);

  console.log(
    'Image file selected. Waiting for Facebook preview...'
  );

  const previewCandidates = [
    composerDialog.locator('img[src^="blob:"]'),
    composerDialog.locator(
      'img[src*="fbcdn.net"]'
    ),
    composerDialog.locator(
      '[role="img"]'
    )
  ];

  const uploadDeadline = Date.now() + 120_000;

  while (Date.now() < uploadDeadline) {
    for (const preview of previewCandidates) {
      const count = await preview.count();

      for (let index = 0; index < count; index += 1) {
        const item = preview.nth(index);

        if (
          await item.isVisible().catch(() => false)
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

export async function prepareGroupPost(
  stt,
  groupNumber = 1
) {
  const numericStt = Number(stt);

  if (
    !Number.isInteger(numericStt) ||
    numericStt <= 0
  ) {
    throw new Error(
      'STT must be a positive integer.'
    );
  }

  const numericGroupNumber = Number(groupNumber);

if (
  !Number.isInteger(numericGroupNumber) ||
  numericGroupNumber <= 0
) {
  throw new Error(
    'Group number must be a positive integer.'
  );
}

  console.log(
    `Loading post data for STT ${numericStt}...`
  );

  const preparedPost =
    await getPreparedPostData(numericStt);

  console.log(
    'Loading assigned Facebook Groups...'
  );

  const groupResult =
    await getPostGroupsByStt(numericStt);

  if (groupResult.groups.length === 0) {
    throw new Error(
      `Post STT ${numericStt} has no enabled groups.`
    );
  }

  if (
  numericGroupNumber >
  groupResult.groups.length
) {
  throw new Error(
    [
      `Invalid group number: ${numericGroupNumber}.`,
      `Post STT ${numericStt} has only ${groupResult.groups.length} enabled groups.`,
      '',
      `Valid range: 1-${groupResult.groups.length}`
    ].join('\n')
  );
}

const targetGroup =
  groupResult.groups[numericGroupNumber - 1];

console.log('');
console.log(
  `Preparing group ${numericGroupNumber} of ${groupResult.groups.length}:`
);

  console.log('');
  console.log(
    `Testing first group of ${groupResult.groups.length}:`
  );
  console.log(
    `${targetGroup.groupKey} — ${targetGroup.name}`
  );
  console.log(`URL: ${targetGroup.url}`);

  const composerSession =
    await openFacebookComposer(targetGroup);

  const {
  page,
  composerDialog,
  composerEditor
} = composerSession;

  console.log('');
  console.log('Inserting JD content...');

  await insertComposerContent(
    composerEditor,
    preparedPost.jd
  );

  await page.waitForTimeout(1500);

  const insertedContent =
    await readComposerContent(composerEditor);

  const expectedContent =
    normaliseContent(preparedPost.jd);

  const actualContent =
    normaliseContent(insertedContent);

  if (actualContent !== expectedContent) {
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
  console.log('');
console.log('JD content verified successfully.');

await uploadComposerImage(
  page,
  composerDialog,
  preparedPost.image.absolutePath
);

  console.log('');
  console.log('Post preparation test passed.');
  console.log(`STT: ${preparedPost.stt}`);
  console.log(
    `Position: ${preparedPost.position.name}`
  );
  console.log(
    `Group: ${targetGroup.groupKey}`
  );
  console.log(
    `Image ready: ${preparedPost.image.relativePath}`
  );

  console.log('');
  console.log('JD content has been inserted.');
  console.log('Image has been uploaded successfully.');
  console.log(
  `Prepared group ${numericGroupNumber} of ${groupResult.groups.length}.`
);
  console.log('The Post button was not clicked.');
  console.log(
    'Chrome will remain open for manual inspection.'
  );

  return {
    ...composerSession,
    preparedPost,
    targetGroup,
    groupNumber: numericGroupNumber,
totalGroups: groupResult.groups.length
  };
}

async function run() {
  const stt = process.argv[2];
  const groupNumber =
    process.argv[3] || '1';

  if (!stt) {
    console.error(
      [
        'Usage:',
        'node src/prepare-post.js <stt> <group-number>',
        '',
        'Examples:',
        'node src/prepare-post.js 1 1',
        'node src/prepare-post.js 1 2',
        '',
        'group-number defaults to 1 when omitted.'
      ].join('\n')
    );

    process.exitCode = 1;
    return;
  }

  let lockHandle;

  try {
    lockHandle = await acquireJobLock({
      stt: Number(stt),
      groupNumber:
        Number(groupNumber)
    });

    console.log(
      'Facebook job lock acquired.'
    );

    await prepareGroupPost(
      stt,
      groupNumber
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
      await releaseJobLock(
        lockHandle
      ).catch((error) => {
        console.error(
          'Could not release Facebook job lock.'
        );
        console.error(error.message);
      });
    }
  }
}
