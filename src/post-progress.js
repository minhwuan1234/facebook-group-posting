import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PROGRESS_FILE =
  './runtime/post-progress.json';

function getProgressFilePath(options = {}) {
  const progressFile =
    options.progressFile ||
    process.env.POST_PROGRESS_FILE ||
    DEFAULT_PROGRESS_FILE;

  return path.resolve(progressFile);
}

async function readProgressFile(
  progressFilePath
) {
  try {
    const rawContent = await fs.readFile(
      progressFilePath,
      'utf8'
    );

    const parsedData = JSON.parse(rawContent);

    if (
      !parsedData ||
      typeof parsedData !== 'object'
    ) {
      throw new Error(
        'Progress file must contain a JSON object.'
      );
    }

    if (
      !parsedData.posts ||
      typeof parsedData.posts !== 'object'
    ) {
      parsedData.posts = {};
    }

    return parsedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        posts: {}
      };
    }

    if (error instanceof SyntaxError) {
      throw new Error(
        [
          `Invalid JSON in progress file: ${progressFilePath}`,
          `Original error: ${error.message}`
        ].join('\n')
      );
    }

    throw error;
  }
}

async function writeProgressFile(
  progressFilePath,
  progressData
) {
  await fs.mkdir(
    path.dirname(progressFilePath),
    {
      recursive: true
    }
  );

  const temporaryFilePath =
    `${progressFilePath}.tmp`;

  await fs.writeFile(
    temporaryFilePath,
    JSON.stringify(
      progressData,
      null,
      2
    ),
    'utf8'
  );

  await fs.rename(
    temporaryFilePath,
    progressFilePath
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

function validateGroupNumber(groupNumber) {
  const numericGroupNumber =
    Number(groupNumber);

  if (
    !Number.isInteger(numericGroupNumber) ||
    numericGroupNumber <= 0
  ) {
    throw new Error(
      'Group number must be a positive integer.'
    );
  }

  return numericGroupNumber;
}

function validateGroupKey(groupKey) {
  if (
    typeof groupKey !== 'string' ||
    groupKey.trim() === ''
  ) {
    throw new Error(
      'A valid group key is required.'
    );
  }

  return groupKey.trim();
}

export async function getPostProgress(
  stt,
  options = {}
) {
  const numericStt = validateStt(stt);

  const progressFilePath =
    getProgressFilePath(options);

  const progressData =
    await readProgressFile(
      progressFilePath
    );

  const postProgress =
    progressData.posts[
      String(numericStt)
    ];

  if (!postProgress) {
    return {
      stt: numericStt,
      preparedGroupKeys: [],
      lastGroupNumber: 0,
      updatedAt: null
    };
  }

  return {
    stt: numericStt,

    preparedGroupKeys:
      Array.isArray(
        postProgress.preparedGroupKeys
      )
        ? postProgress.preparedGroupKeys
        : [],

    lastGroupNumber:
      Number.isInteger(
        postProgress.lastGroupNumber
      )
        ? postProgress.lastGroupNumber
        : 0,

    updatedAt:
      postProgress.updatedAt || null
  };
}

export async function markGroupPrepared(
  {
    stt,
    groupNumber,
    groupKey
  },
  options = {}
) {
  const numericStt = validateStt(stt);

  const numericGroupNumber =
    validateGroupNumber(groupNumber);

  const normalisedGroupKey =
    validateGroupKey(groupKey);

  const progressFilePath =
    getProgressFilePath(options);

  const progressData =
    await readProgressFile(
      progressFilePath
    );

  const postKey = String(numericStt);

  const currentProgress =
    progressData.posts[postKey] || {
      preparedGroupKeys: [],
      lastGroupNumber: 0,
      updatedAt: null
    };

  const preparedGroupKeys =
    Array.isArray(
      currentProgress.preparedGroupKeys
    )
      ? currentProgress.preparedGroupKeys
      : [];

  if (
    !preparedGroupKeys.includes(
      normalisedGroupKey
    )
  ) {
    preparedGroupKeys.push(
      normalisedGroupKey
    );
  }

  progressData.posts[postKey] = {
    preparedGroupKeys,
    lastGroupNumber:
      numericGroupNumber,
    updatedAt:
      new Date().toISOString()
  };

  await writeProgressFile(
    progressFilePath,
    progressData
  );

  return getPostProgress(
    numericStt,
    options
  );
}

export async function resetPostProgress(
  stt,
  options = {}
) {
  const numericStt = validateStt(stt);

  const progressFilePath =
    getProgressFilePath(options);

  const progressData =
    await readProgressFile(
      progressFilePath
    );

  delete progressData.posts[
    String(numericStt)
  ];

  await writeProgressFile(
    progressFilePath,
    progressData
  );

  return {
    stt: numericStt,
    preparedGroupKeys: [],
    lastGroupNumber: 0,
    updatedAt: null
  };
}

async function run() {
  const command = process.argv[2];
  const stt = process.argv[3];

  if (!command || !stt) {
    console.error(
      [
        'Usage:',
        'node src/post-progress.js status <stt>',
        'node src/post-progress.js mark <stt> <group-number> <group-key>',
        'node src/post-progress.js reset <stt>'
      ].join('\n')
    );

    process.exitCode = 1;
    return;
  }

  try {
    if (command === 'status') {
      const progress =
        await getPostProgress(stt);

      console.log(
        JSON.stringify(
          progress,
          null,
          2
        )
      );

      return;
    }

    if (command === 'mark') {
      const groupNumber =
        process.argv[4];

      const groupKey =
        process.argv[5];

      if (
        !groupNumber ||
        !groupKey
      ) {
        throw new Error(
          'Mark requires group-number and group-key.'
        );
      }

      const progress =
        await markGroupPrepared({
          stt,
          groupNumber,
          groupKey
        });

      console.log(
        'Group marked as prepared.'
      );

      console.log(
        JSON.stringify(
          progress,
          null,
          2
        )
      );

      return;
    }

    if (command === 'reset') {
      const progress =
        await resetPostProgress(stt);

      console.log(
        'Post progress reset.'
      );

      console.log(
        JSON.stringify(
          progress,
          null,
          2
        )
      );

      return;
    }

    throw new Error(
      `Unknown command: "${command}".`
    );
  } catch (error) {
    console.error('');
    console.error(
      'Post progress command failed.'
    );

    console.error(error.message);

    process.exitCode = 1;
  }
}

const currentFilePath =
  fileURLToPath(import.meta.url);

const executedFilePath =
  process.argv[1]
    ? path.resolve(process.argv[1])
    : null;

if (
  executedFilePath ===
  currentFilePath
) {
  await run();
}
