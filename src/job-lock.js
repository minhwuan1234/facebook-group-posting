import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_LOCK_FILE =
  './runtime/facebook-post.lock';

const DEFAULT_STALE_TIMEOUT_MS =
  15 * 60 * 1000;

function getLockFilePath(options = {}) {
  const lockFile =
    options.lockFile ||
    process.env.LOCK_FILE ||
    DEFAULT_LOCK_FILE;

  return path.resolve(lockFile);
}

function getStaleTimeout(options = {}) {
  const configuredTimeout = Number(
    options.staleTimeoutMs ||
    process.env.STALE_LOCK_TIMEOUT_MS
  );

  if (
    Number.isFinite(configuredTimeout) &&
    configuredTimeout > 0
  ) {
    return configuredTimeout;
  }

  return DEFAULT_STALE_TIMEOUT_MS;
}

async function readExistingLock(lockFilePath) {
  try {
    const content = await fs.readFile(
      lockFilePath,
      'utf8'
    );

    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw new Error(
      [
        `Could not read job lock: ${lockFilePath}`,
        `Original error: ${error.message}`
      ].join('\n')
    );
  }
}

function isLockStale(lockData, staleTimeoutMs) {
  if (
    !lockData ||
    typeof lockData.createdAt !== 'string'
  ) {
    return true;
  }

  const createdAt = new Date(
    lockData.createdAt
  ).getTime();

  if (!Number.isFinite(createdAt)) {
    return true;
  }

  return (
    Date.now() - createdAt >
    staleTimeoutMs
  );
}

export async function acquireJobLock(
  jobData = {},
  options = {}
) {
  const lockFilePath =
    getLockFilePath(options);

  const staleTimeoutMs =
    getStaleTimeout(options);

  await fs.mkdir(
    path.dirname(lockFilePath),
    {
      recursive: true
    }
  );

  const existingLock =
    await readExistingLock(lockFilePath);

  if (
    existingLock &&
    !isLockStale(
      existingLock,
      staleTimeoutMs
    )
  ) {
    throw new Error(
      [
        'Facebook posting bot is already busy.',
        '',
        `Active process ID: ${existingLock.pid || 'unknown'}`,
        `STT: ${existingLock.stt || 'unknown'}`,
        `Group number: ${existingLock.groupNumber || 'unknown'}`,
        `Started at: ${existingLock.createdAt || 'unknown'}`,
        '',
        'Wait for the current job to finish or close it manually.'
      ].join('\n')
    );
  }

  if (existingLock) {
    console.log(
      'Removing stale Facebook job lock...'
    );

    await fs.unlink(lockFilePath).catch(
      () => {}
    );
  }

  const lockData = {
    pid: process.pid,
    stt: jobData.stt ?? null,
    groupNumber:
      jobData.groupNumber ?? null,
    createdAt: new Date().toISOString()
  };

  try {
    await fs.writeFile(
      lockFilePath,
      JSON.stringify(lockData, null, 2),
      {
        encoding: 'utf8',
        flag: 'wx'
      }
    );
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(
        'Facebook posting bot became busy before the lock could be acquired.'
      );
    }

    throw new Error(
      [
        `Could not create job lock: ${lockFilePath}`,
        `Original error: ${error.message}`
      ].join('\n')
    );
  }

  return {
    lockFilePath,
    lockData
  };
}

export async function releaseJobLock(
  lockHandle
) {
  if (!lockHandle?.lockFilePath) {
    return;
  }

  try {
    const existingLock =
      await readExistingLock(
        lockHandle.lockFilePath
      );

    if (
      existingLock &&
      existingLock.pid !== process.pid
    ) {
      return;
    }

    await fs.unlink(
      lockHandle.lockFilePath
    );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(
        [
          `Could not remove job lock: ${lockHandle.lockFilePath}`,
          `Original error: ${error.message}`
        ].join('\n')
      );
    }
  }
}
