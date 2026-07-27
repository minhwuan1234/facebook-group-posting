import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  getPostGroupsByStt
} from './post-groups.js';

import {
  prepareGroupPost
} from './prepare-post.js';

import {
  getPostProgress
} from './post-progress.js';

import {
  acquireJobLock,
  releaseJobLock
} from './job-lock.js';

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

export async function prepareAllAssignedGroups(stt) {
  const numericStt = validateStt(stt);

  console.log(
    `Loading all assigned groups for STT ${numericStt}...`
  );

  const groupResult =
    await getPostGroupsByStt(numericStt);

  const groups = groupResult.groups;

  if (groups.length === 0) {
    throw new Error(
      `Post STT ${numericStt} has no enabled groups.`
    );
  }

  const initialProgress =
    await getPostProgress(numericStt);

  const preparedGroupKeys = new Set(
    initialProgress.preparedGroupKeys
  );

  const remainingGroups = groups
    .map((group, index) => ({
      group,
      groupNumber: index + 1
    }))
    .filter(
      ({ group }) =>
        !preparedGroupKeys.has(group.groupKey)
    );

  console.log('');
  console.log(`Total groups: ${groups.length}`);
  console.log(
    `Already completed: ${preparedGroupKeys.size}`
  );
  console.log(
    `Remaining groups: ${remainingGroups.length}`
  );

  if (remainingGroups.length === 0) {
    console.log('');
    console.log(
      'All assigned groups have already been completed.'
    );

    console.log(
      `Reset progress to start again: node src/post-progress.js reset ${numericStt}`
    );

    return {
      stt: numericStt,
      totalGroups: groups.length,
      completedGroups: groups.length,
      remainingGroups: 0
    };
  }

  for (
    let index = 0;
    index < remainingGroups.length;
    index += 1
  ) {
    const {
      group,
      groupNumber
    } = remainingGroups[index];

    console.log('');
    console.log(
      '========================================'
    );

    console.log(
      `Batch item ${index + 1}/${remainingGroups.length}`
    );

    console.log(
      `Overall group ${groupNumber}/${groups.length}`
    );

    console.log(
      `${group.groupKey} — ${group.name}`
    );

    console.log(
      '========================================'
    );

    try {
      await prepareGroupPost(
        numericStt,
        groupNumber
      );
    } catch (error) {
      throw new Error(
        [
          `Batch stopped at ${group.groupKey}.`,
          `Overall group number: ${groupNumber}/${groups.length}`,
          '',
          `Original error: ${error.message}`,
          '',
          'Fix the issue and run the same command again.',
          'Completed groups will be skipped automatically.'
        ].join('\n')
      );
    }

    console.log('');
    console.log(
      `Completed ${group.groupKey}.`
    );

    console.log(
      `Batch progress: ${index + 1}/${remainingGroups.length}`
    );
  }

  const finalProgress =
    await getPostProgress(numericStt);

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'All assigned Facebook Groups completed.'
  );

  console.log(
    `Completed groups: ${finalProgress.preparedGroupKeys.length}/${groups.length}`
  );

  console.log(
    '========================================'
  );

  return {
    stt: numericStt,
    totalGroups: groups.length,
    completedGroups:
      finalProgress.preparedGroupKeys.length,
    remainingGroups:
      groups.length -
      finalProgress.preparedGroupKeys.length
  };
}

async function run() {
  const stt = process.argv[2];

  if (!stt) {
    console.error(
      [
        'Usage:',
        'node src/prepare-all.js <stt>',
        '',
        'Example:',
        'node src/prepare-all.js 1'
      ].join('\n')
    );

    process.exitCode = 1;
    return;
  }

  let lockHandle = null;

  try {
    lockHandle = await acquireJobLock({
      stt: Number(stt),
      groupNumber: 'all'
    });

    console.log(
      'Facebook batch job lock acquired.'
    );

    await prepareAllAssignedGroups(stt);
  } catch (error) {
    console.error('');
    console.error(
      'Facebook batch preparation failed.'
    );

    console.error(error.message);

    process.exitCode = 1;
  } finally {
    if (lockHandle) {
      try {
        await releaseJobLock(lockHandle);

        console.log(
          'Facebook batch job lock released.'
        );
      } catch (error) {
        console.error(
          'Could not release Facebook batch job lock.'
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
