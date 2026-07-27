import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export async function prepareFirstGroupPost(
  stt
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

  const targetGroup = groupResult.groups[0];

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
  console.log('Only the first group was processed.');
  console.log('The Post button was not clicked.');
  console.log(
    'Chrome will remain open for manual inspection.'
  );

  return {
    ...composerSession,
    preparedPost,
    targetGroup,
    totalGroups:
      groupResult.groups.length
  };
}

async function run() {
  const stt = process.argv[2];

  if (!stt) {
    console.error(
      [
        'Usage:',
        'node src/prepare-post.js <stt>',
        '',
        'Example:',
        'node src/prepare-post.js 1'
      ].join('\n')
    );

    process.exitCode = 1;
    return;
  }

  try {
    await prepareFirstGroupPost(stt);
  } catch (error) {
    console.error('');
    console.error(
      'Post preparation test failed.'
    );
    console.error(error.message);

    process.exitCode = 1;
  }
}

const currentFilePath =
  fileURLToPath(import.meta.url);

const executedFilePath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;

if (executedFilePath === currentFilePath) {
  await run();
}
