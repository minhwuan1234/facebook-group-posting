import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_POSITIONS_FILE = './data/positions.json';

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function validatePosition(position, index) {
  if (!position || typeof position !== 'object') {
    throw new Error(
      `Position at index ${index} must be an object.`
    );
  }

  if (
    typeof position.id !== 'string' ||
    position.id.trim() === ''
  ) {
    throw new Error(
      `Position at index ${index} is missing a valid "id".`
    );
  }

  if (
    typeof position.name !== 'string' ||
    position.name.trim() === ''
  ) {
    throw new Error(
      `Position "${position.id}" is missing a valid "name".`
    );
  }

  if (
    typeof position.image !== 'string' ||
    position.image.trim() === ''
  ) {
    throw new Error(
      `Position "${position.id}" is missing a valid "image".`
    );
  }

  if (
    typeof position.enabled !== 'undefined' &&
    typeof position.enabled !== 'boolean'
  ) {
    throw new Error(
      `Position "${position.id}" has an invalid "enabled" value.`
    );
  }

  return {
    id: position.id.trim(),
    name: position.name.trim(),
    image: position.image.trim(),
    enabled: position.enabled !== false
  };
}

export async function loadPositions(options = {}) {
  const positionsFile =
    options.positionsFile ||
    process.env.POSITIONS_FILE ||
    DEFAULT_POSITIONS_FILE;

  const absolutePositionsFile = path.resolve(
    positionsFile
  );

  let rawContent;

  try {
    rawContent = await fs.readFile(
      absolutePositionsFile,
      'utf8'
    );
  } catch (error) {
    throw new Error(
      [
        `Could not read positions file: ${absolutePositionsFile}`,
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
        `Invalid JSON in positions file: ${absolutePositionsFile}`,
        `Original error: ${error.message}`
      ].join('\n')
    );
  }

  if (!Array.isArray(parsedData.positions)) {
    throw new Error(
      'Positions file must contain a top-level "positions" array.'
    );
  }

  const positions = parsedData.positions.map(
    validatePosition
  );

  const ids = new Set();

  for (const position of positions) {
    if (ids.has(position.id)) {
      throw new Error(
        `Duplicate position id found: "${position.id}".`
      );
    }

    ids.add(position.id);
  }

  return positions;
}

export async function getPositionById(
  positionId,
  options = {}
) {
  if (
    typeof positionId !== 'string' ||
    positionId.trim() === ''
  ) {
    throw new Error(
      'A valid position id is required.'
    );
  }

  const positions = await loadPositions(options);

  const position = positions.find(
    (item) => item.id === positionId.trim()
  );

  if (!position) {
    throw new Error(
      `Unknown position id: "${positionId}".`
    );
  }

  if (!position.enabled) {
    throw new Error(
      `Position "${positionId}" is disabled.`
    );
  }

  const absoluteImagePath = path.resolve(
    position.image
  );

  const imageExists = await fileExists(
    absoluteImagePath
  );

  if (!imageExists) {
    throw new Error(
      [
        `Image file was not found for position "${position.id}".`,
        `Expected path: ${absoluteImagePath}`
      ].join('\n')
    );
  }

  return {
    ...position,
    absoluteImagePath
  };
}

async function runTest() {
  const positionId = process.argv[2];

  if (!positionId) {
    console.error(
      'Usage: node src/positions.js <position-id>'
    );

    process.exitCode = 1;
    return;
  }

  try {
    const position = await getPositionById(
      positionId
    );

    console.log('');
    console.log('Position loaded successfully.');
    console.log(`ID: ${position.id}`);
    console.log(`Name: ${position.name}`);
    console.log(`Image: ${position.image}`);
    console.log(
      `Absolute image path: ${position.absoluteImagePath}`
    );
    console.log(`Enabled: ${position.enabled}`);
  } catch (error) {
    console.error('');
    console.error(
      'Position loading test failed.'
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
  await runTest();
}
