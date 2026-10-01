import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import {
  getPostGroupsByStt
} from './post-groups.js';

import {
  getPostProgress
} from './post-progress.js';


/* =========================================================
 * CONFIG
 * ========================================================= */

const DELAY_BETWEEN_GROUPS_MS = 5000;


/* =========================================================
 * PATHS
 * ========================================================= */

const currentFilePath =
  fileURLToPath(
    import.meta.url
  );

const currentDirectory =
  path.dirname(
    currentFilePath
  );

const preparePostPath =
  path.join(
    currentDirectory,
    'prepare-post.js'
  );


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


/* =========================================================
 * WAIT
 * ========================================================= */

function wait(milliseconds) {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}


async function waitBeforeNextGroup() {
  console.log('');
  console.log(
    'Waiting 5 seconds before the next group...'
  );

  await wait(
    DELAY_BETWEEN_GROUPS_MS
  );
}


/* =========================================================
 * RUN ONE GROUP
 * ========================================================= */

async function runPreparePost(
  stt,
  groupNumber
) {
  return new Promise(
    (resolve) => {
      console.log('');
      console.log(
        `Running prepare-post.js for group ${groupNumber}...`
      );

      const child =
        spawn(
          process.execPath,
          [
            preparePostPath,
            String(stt),
            String(groupNumber)
          ],
          {
            cwd:
              path.resolve(
                currentDirectory,
                '..'
              ),

            stdio:
              'inherit',

            env:
              process.env
          }
        );

      child.on(
        'error',
        (error) => {
          resolve({
            success: false,
            exitCode: null,
            error:
              error.message
          });
        }
      );

      child.on(
        'close',
        (code, signal) => {
          if (code === 0) {
            resolve({
              success: true,
              exitCode: 0,
              signal: null
            });

            return;
          }

          resolve({
            success: false,
            exitCode:
              code,

            signal:
              signal || null,

            error:
              signal
                ? `Process stopped by signal ${signal}.`
                : `prepare-post.js exited with code ${code}.`
          });
        }
      );
    }
  );
}


/* =========================================================
 * LOAD CURRENT COMPLETED GROUPS
 * ========================================================= */

async function getCompletedGroupKeys(
  stt
) {
  const progress =
    await getPostProgress(
      stt
    );

  return new Set(
    Array.isArray(
      progress?.preparedGroupKeys
    )
      ? progress.preparedGroupKeys
      : []
  );
}


/* =========================================================
 * PREPARE ALL GROUPS
 * ========================================================= */

export async function prepareAllGroups(
  stt
) {
  const numericStt =
    validateStt(
      stt
    );

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    `FACEBOOK BATCH — STT ${numericStt}`
  );

  console.log(
    '========================================'
  );


  /* =======================================================
   * LOAD GROUPS
   * ======================================================= */

  const groupResult =
    await getPostGroupsByStt(
      numericStt
    );

  const groups =
    groupResult.groups;

  if (
    !Array.isArray(groups) ||
    groups.length === 0
  ) {
    throw new Error(
      `STT ${numericStt} has no enabled Facebook Groups.`
    );
  }


  /* =======================================================
   * LOAD PROGRESS
   * ======================================================= */

  const completedGroupKeys =
    await getCompletedGroupKeys(
      numericStt
    );

  console.log('');
  console.log(
    `Total groups: ${groups.length}`
  );

  console.log(
    `Already completed: ${completedGroupKeys.size}`
  );


  /* =======================================================
   * BUILD REMAINING LIST
   * ======================================================= */

  const remainingGroups =
    groups
      .map(
        (
          group,
          index
        ) => ({
          group,

          /*
           * Number trong full group list.
           */
          groupNumber:
            index + 1
        })
      )
      .filter(
        ({
          group
        }) =>
          !completedGroupKeys.has(
            group.groupKey
          )
      );

  console.log(
    `Remaining groups: ${remainingGroups.length}`
  );

  if (
    remainingGroups.length === 0
  ) {
    console.log('');
    console.log(
      'Nothing to do. All groups are already completed.'
    );

    return;
  }


  /* =======================================================
   * RESULTS
   * ======================================================= */

  const successfulGroups = [];
  const failedGroups = [];


  /* =======================================================
   * LOOP
   * ======================================================= */

  for (
    let index = 0;
    index < remainingGroups.length;
    index += 1
  ) {
    const {
      group,
      groupNumber
    } =
      remainingGroups[index];

    console.log('');
    console.log(
      '========================================'
    );

    console.log(
      `BATCH ${index + 1}/${remainingGroups.length}`
    );

    console.log(
      `OVERALL GROUP ${groupNumber}/${groups.length}`
    );

    console.log(
      `KEY: ${group.groupKey}`
    );

    console.log(
      `NAME: ${group.name}`
    );

    console.log(
      `URL: ${group.url}`
    );

    console.log(
      '========================================'
    );


    /* =====================================================
     * RUN GROUP
     * ===================================================== */

    const result =
      await runPreparePost(
        numericStt,
        groupNumber
      );


    /* =====================================================
     * SUCCESS
     * ===================================================== */

    if (result.success) {
      successfulGroups.push({
        groupNumber,
        groupKey:
          group.groupKey,
        name:
          group.name,
        url:
          group.url
      });

      console.log('');
      console.log(
        `SUCCESS: ${group.groupKey}`
      );
    }


    /* =====================================================
     * FAILURE
     * ===================================================== */

    else {
      failedGroups.push({
        groupNumber,
        groupKey:
          group.groupKey,
        name:
          group.name,
        url:
          group.url,
        exitCode:
          result.exitCode,
        error:
          result.error
      });

      console.error('');
      console.error(
        `FAILED: ${group.groupKey}`
      );

      console.error(
        `Name: ${group.name}`
      );

      console.error(
        `URL: ${group.url}`
      );

      console.error(
        `Reason: ${result.error}`
      );

      console.error('');
      console.error(
        'This group will NOT be marked completed.'
      );

      console.error(
        'Automatically continuing to the next group.'
      );
    }


    /* =====================================================
     * WAIT BEFORE NEXT
     * ===================================================== */

    if (
      index <
      remainingGroups.length - 1
    ) {
      await waitBeforeNextGroup();
    }
  }


  /* =======================================================
   * FINAL PROGRESS
   * ======================================================= */

  const finalCompletedKeys =
    await getCompletedGroupKeys(
      numericStt
    );


  /* =======================================================
   * SUMMARY
   * ======================================================= */

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'FACEBOOK BATCH FINISHED'
  );

  console.log(
    '========================================'
  );

  console.log(
    `STT: ${numericStt}`
  );

  console.log(
    `Total groups: ${groups.length}`
  );

  console.log(
    `Successful this run: ${successfulGroups.length}`
  );

  console.log(
    `Failed this run: ${failedGroups.length}`
  );

  console.log(
    `Total completed: ${finalCompletedKeys.size}/${groups.length}`
  );


  /* =======================================================
   * FAILED SUMMARY
   * ======================================================= */

  if (
    failedGroups.length > 0
  ) {
    console.log('');
    console.log(
      'FAILED GROUPS'
    );

    console.log(
      '----------------------------------------'
    );

    failedGroups.forEach(
      (
        failed,
        index
      ) => {
        console.log('');

        console.log(
          `${index + 1}. ${failed.groupKey}`
        );

        console.log(
          `   Overall group: ${failed.groupNumber}/${groups.length}`
        );

        console.log(
          `   Name: ${failed.name}`
        );

        console.log(
          `   URL: ${failed.url}`
        );

        console.log(
          `   Error: ${failed.error}`
        );
      }
    );

    console.log('');
    console.log(
      'Failed groups remain incomplete and can be retried later.'
    );
  }

  return {
    stt:
      numericStt,

    totalGroups:
      groups.length,

    successfulGroups,

    failedGroups,

    completed:
      finalCompletedKeys.size
  };
}


/* =========================================================
 * CLI
 * ========================================================= */

async function run() {
  const stt =
    process.argv[2];

  if (!stt) {
    console.error(
      [
        'Usage:',
        'node src/prepare-all.js <stt>',
        '',
        'Examples:',
        'node src/prepare-all.js 1',
        'node src/prepare-all.js 2',
        'node src/prepare-all.js 3'
      ].join('\n')
    );

    process.exitCode = 1;

    return;
  }

  try {
    await prepareAllGroups(
      stt
    );
  } catch (error) {
    console.error('');
    console.error(
      'Facebook batch could not start.'
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
