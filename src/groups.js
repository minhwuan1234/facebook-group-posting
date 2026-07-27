import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_GROUPS_FILE = './data/groups.json';

function isValidFacebookGroupUrl(url) {
  try {
    const parsedUrl = new URL(url);

    const isFacebookHost =
      parsedUrl.hostname === 'facebook.com' ||
      parsedUrl.hostname === 'www.facebook.com';

    return (
      isFacebookHost &&
      parsedUrl.pathname.startsWith('/groups/')
    );
  } catch {
    return false;
  }
}

function validateGroup(group, index) {
  if (!group || typeof group !== 'object') {
    throw new Error(`Group at index ${index} must be an object.`);
  }

  if (
    typeof group.id !== 'string' ||
    group.id.trim() === ''
  ) {
    throw new Error(
      `Group at index ${index} is missing a valid "id".`
    );
  }

  if (
    typeof group.name !== 'string' ||
    group.name.trim() === ''
  ) {
    throw new Error(
      `Group "${group.id}" is missing a valid "name".`
    );
  }

  if (
    typeof group.url !== 'string' ||
    !isValidFacebookGroupUrl(group.url)
  ) {
    throw new Error(
      `Group "${group.id}" has an invalid Facebook Group URL.`
    );
  }

  if (
    typeof group.enabled !== 'undefined' &&
    typeof group.enabled !== 'boolean'
  ) {
    throw new Error(
      `Group "${group.id}" has an invalid "enabled" value.`
    );
  }

  return {
    id: group.id.trim(),
    name: group.name.trim(),
    url: group.url.trim(),
    enabled: group.enabled !== false
  };
}

export async function loadGroups(options = {}) {
  const groupsFile =
    options.groupsFile ||
    process.env.GROUPS_FILE ||
    DEFAULT_GROUPS_FILE;

  const absolutePath = path.resolve(groupsFile);

  let rawContent;

  try {
    rawContent = await fs.readFile(absolutePath, 'utf8');
  } catch (error) {
    throw new Error(
      [
        `Could not read groups file: ${absolutePath}`,
        `Original error: ${error.message}`
      ].join('\n')
    );
  }

  let parsedData;

  try {
    parsedData = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(
      [
        `Invalid JSON in groups file: ${absolutePath}`,
        `Original error: ${error.message}`
      ].join('\n')
    );
  }

  if (!Array.isArray(parsedData.groups)) {
    throw new Error(
      `Groups file must contain a top-level "groups" array.`
    );
  }

  const groups = parsedData.groups.map(validateGroup);

  const ids = new Set();

  for (const group of groups) {
    if (ids.has(group.id)) {
      throw new Error(
        `Duplicate group id found: "${group.id}".`
      );
    }

    ids.add(group.id);
  }

  return groups;
}

export async function getGroupById(groupId, options = {}) {
  if (
    typeof groupId !== 'string' ||
    groupId.trim() === ''
  ) {
    throw new Error('A valid group id is required.');
  }

  const groups = await loadGroups(options);

  const group = groups.find(
    (item) => item.id === groupId.trim()
  );

  if (!group) {
    throw new Error(
      `Unknown group id: "${groupId}".`
    );
  }

  if (!group.enabled) {
    throw new Error(
      `Group "${groupId}" is disabled.`
    );
  }

  return group;
}

/**
 * Temporary test.
 *
 * Run:
 * node src/groups.js group-01
 */
async function runTest() {
  const groupId = process.argv[2];

  if (!groupId) {
    console.error(
      'Usage: node src/groups.js <group-id>'
    );

    process.exitCode = 1;
    return;
  }

  try {
    const group = await getGroupById(groupId);

    console.log('Group loaded successfully.');
    console.log(`ID: ${group.id}`);
    console.log(`Name: ${group.name}`);
    console.log(`URL: ${group.url}`);
    console.log(`Enabled: ${group.enabled}`);
  } catch (error) {
    console.error('');
    console.error('Group loading test failed.');
    console.error(error.message);

    process.exitCode = 1;
  }
}

const isDirectExecution =
  process.argv[1] &&
  new URL(import.meta.url).pathname === process.argv[1];

if (isDirectExecution) {
  await runTest();
}
