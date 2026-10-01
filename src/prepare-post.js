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
  fileURLToPath(import.meta.url);

const currentDirectory =
  path.dirname(currentFilePath);

const projectRoot =
  path.resolve(
    currentDirectory,
    '..'
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
    !Number.isInteger(numericStt) ||
    numericStt <= 0
  ) {
    throw new Error(
      'STT must be a positive integer.'
    );
  }

  return numericStt;
}


/* =========================================================
 * WAIT HELPER
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
 * PROGRESS
 * ========================================================= */

async function loadCompletedGroupKeys(
  stt
) {
  const progress =
    await getPostProgress(stt);

  const preparedGroupKeys =
    Array.isArray(
      progress?.preparedGroupKeys
    )
      ? progress.preparedGroupKeys
      : [];

  return new Set(
    preparedGroupKeys
  );
}


/* =========================================================
 * RUN ONE GROUP
 *
 * IMPORTANT:
 *
 * Không import prepareGroupPost().
 *
 * Chạy đúng CLI đã hoạt động:
 *
 * node src/prepare-post.js <stt> <group-number>
 *
 * Vì vậy prepare-post.js không cần export function.
 * ========================================================= */

async function runSingleGroup(
  stt,
  groupNumber
) {
  return new Promise(
    (resolve) => {
      console.log('');
      console.log(
        `Starting prepare-post.js for group ${groupNumber}...`
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
              projectRoot,

            stdio:
              'inherit',

            env:
              {
                ...process.env,

                /*
                 * Batch thật.
                 *
                 * Đảm bảo TEST_MODE cũ
                 * không vô tình ngăn nút Post.
                 */
                TEST_MODE:
                  '0'
              }
          }
        );


      /* -----------------------------------------------------
       * CHILD PROCESS FAILED TO START
       * ----------------------------------------------------- */

      child.once(
        'error',
        (error) => {
          resolve({
            success:
              false,

            exitCode:
              null,

            signal:
              null,

            error:
              `Could not start prepare-post.js: ${error.message}`
          });
        }
      );


      /* -----------------------------------------------------
       * CHILD PROCESS FINISHED
       * ----------------------------------------------------- */

      child.once(
        'close',
        (
          code,
          signal
        ) => {
          if (code === 0) {
            resolve({
              success:
                true,

              exitCode:
                0,

              signal:
                null,

              error:
                null
            });

            return;
          }

          resolve({
            success:
              false,

            exitCode:
              code,

            signal:
              signal || null,

            error:
              signal
                ? `prepare-post.js stopped by signal ${signal}.`
                : `prepare-post.js exited with code ${code}.`
          });
        }
      );
    }
  );
}


/* =========================================================
 * PREPARE ALL GROUPS
 * ========================================================= */

export async function prepareAllGroups(
  stt
) {
  const numericStt =
    validateStt(stt);


  /* =======================================================
   * HEADER
   * ======================================================= */

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    `FACEBOOK BATCH START — STT ${numericStt}`
  );

  console.log(
    '========================================'
  );


  /* =======================================================
   * LOAD GROUPS
   * ======================================================= */

  console.log('');
  console.log(
    'Loading Facebook Groups...'
  );

  const groupResult =
    await getPostGroupsByStt(
      numericStt
    );

  const groups =
    Array.isArray(
      groupResult?.groups
    )
      ? groupResult.groups
      : [];


  if (
    groups.length === 0
  ) {
    throw new Error(
      `STT ${numericStt} has no enabled Facebook Groups.`
    );
  }


  /* =======================================================
   * LOAD EXISTING PROGRESS
   * ======================================================= */

  const completedGroupKeys =
    await loadCompletedGroupKeys(
      numericStt
    );


  console.log('');
  console.log(
    `Total assigned groups: ${groups.length}`
  );

  console.log(
    `Already completed: ${completedGroupKeys.size}`
  );


  /* =======================================================
   * BUILD GROUP QUEUE
   *
   * Giữ original group number.
   *
   * Ví dụ:
   *
   * hr-group-01 → 1
   * hr-group-04 → 4
   * hr-group-12 → 12
   * ======================================================= */

  const groupQueue =
    groups
      .map(
        (
          group,
          index
        ) => {
          return {
            group,
            groupNumber:
              index + 1
          };
        }
      )
      .filter(
        ({
          group
        }) => {
          return !completedGroupKeys.has(
            group.groupKey
          );
        }
      );


  console.log(
    `Remaining groups: ${groupQueue.length}`
  );


  /* =======================================================
   * NOTHING LEFT
   * ======================================================= */

  if (
    groupQueue.length === 0
  ) {
    console.log('');
    console.log(
      'All Facebook Groups have already been completed.'
    );

    return {
      stt:
        numericStt,

      totalGroups:
        groups.length,

      successfulThisRun:
        0,

      failedThisRun:
        0,

      skippedCompleted:
        groups.length,

      failedGroups:
        []
    };
  }


  /* =======================================================
   * BATCH RESULT
   * ======================================================= */

  const successfulGroups = [];
  const failedGroups = [];


  /* =======================================================
   * MAIN LOOP
   * ======================================================= */

  for (
    let queueIndex = 0;
    queueIndex < groupQueue.length;
    queueIndex += 1
  ) {
    const {
      group,
      groupNumber
    } =
      groupQueue[
        queueIndex
      ];


    console.log('');
    console.log(
      '========================================'
    );

    console.log(
      `BATCH ITEM ${queueIndex + 1}/${groupQueue.length}`
    );

    console.log(
      `OVERALL GROUP ${groupNumber}/${groups.length}`
    );

    console.log(
      `Group key: ${group.groupKey}`
    );

    console.log(
      `Group name: ${group.name}`
    );

    console.log(
      `URL: ${group.url}`
    );

    console.log(
      '========================================'
    );


    /* =====================================================
     * RUN CURRENT GROUP
     * ===================================================== */

    let result;

    try {
      result =
        await runSingleGroup(
          numericStt,
          groupNumber
        );
    } catch (error) {
      /*
       * Safety fallback.
       *
       * Một exception ở batch controller
       * cũng không được kill toàn batch.
       */
      result = {
        success:
          false,

        exitCode:
          null,

        signal:
          null,

        error:
          error.message
      };
    }


    /* =====================================================
     * SUCCESS
     * ===================================================== */

    if (
      result.success
    ) {
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

      console.log(
        `Completed overall group ${groupNumber}/${groups.length}.`
      );
    }


    /* =====================================================
     * FAILURE
     *
     * QUAN TRỌNG:
     *
     * Không throw.
     * Không stop batch.
     * Không mark completed.
     * Sang group tiếp theo.
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

        signal:
          result.signal,

        error:
          result.error
      });


      console.error('');
      console.error(
        `FAILED: ${group.groupKey}`
      );

      console.error(
        `Overall group: ${groupNumber}/${groups.length}`
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
        'This group was NOT marked completed.'
      );

      console.error(
        'Automatically continuing to the next group.'
      );
    }


    /* =====================================================
     * WAIT BEFORE NEXT GROUP
     * ===================================================== */

    const hasNextGroup =
      queueIndex <
      groupQueue.length - 1;

    if (
      hasNextGroup
    ) {
      await waitBeforeNextGroup();
    }
  }


  /* =======================================================
   * RELOAD FINAL PROGRESS
   * ======================================================= */

  const finalCompletedGroupKeys =
    await loadCompletedGroupKeys(
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
    `Total assigned groups: ${groups.length}`
  );

  console.log(
    `Successful this run: ${successfulGroups.length}`
  );

  console.log(
    `Failed this run: ${failedGroups.length}`
  );

  console.log(
    `Total completed: ${finalCompletedGroupKeys.size}/${groups.length}`
  );


  /* =======================================================
   * SUCCESS SUMMARY
   * ======================================================= */

  if (
    successfulGroups.length > 0
  ) {
    console.log('');
    console.log(
      'SUCCESSFUL GROUPS'
    );

    console.log(
      '----------------------------------------'
    );

    successfulGroups.forEach(
      (
        item,
        index
      ) => {
        console.log(
          `${index + 1}. ${item.groupKey} — overall ${item.groupNumber}/${groups.length}`
        );
      }
    );
  }


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
        item,
        index
      ) => {
        console.log('');

        console.log(
          `${index + 1}. ${item.groupKey}`
        );

        console.log(
          `   Overall group: ${item.groupNumber}/${groups.length}`
        );

        console.log(
          `   Name: ${item.name}`
        );

        console.log(
          `   URL: ${item.url}`
        );

        console.log(
          `   Exit code: ${item.exitCode ?? 'N/A'}`
        );

        console.log(
          `   Error: ${item.error}`
        );
      }
    );


    console.log('');
    console.log(
      'Failed groups remain incomplete.'
    );

    console.log(
      'Run prepare-all.js again later to retry them.'
    );
  }


  /* =======================================================
   * RETURN
   * ======================================================= */

  return {
    stt:
      numericStt,

    totalGroups:
      groups.length,

    successfulThisRun:
      successfulGroups.length,

    failedThisRun:
      failedGroups.length,

    totalCompleted:
      finalCompletedGroupKeys.size,

    successfulGroups,

    failedGroups
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
