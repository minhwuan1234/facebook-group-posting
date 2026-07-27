import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getPostByStt
} from './supabase.js';

import {
  getPositionById
} from './positions.js';

export async function getPreparedPostData(
  stt,
  options = {}
) {
  const post = await getPostByStt(
    stt,
    options.supabaseOptions
  );

  const position = await getPositionById(
    post.position,
    options.positionOptions
  );

  return {
    id: post.id,
    stt: post.stt,
    jd: post.jd,

    position: {
      id: position.id,
      name: position.name
    },

    image: {
      relativePath: position.image,
      absolutePath: position.absoluteImagePath
    }
  };
}

async function runTest() {
  const stt = process.argv[2];

  if (!stt) {
    console.error(
      'Usage: node src/post-data.js <stt>'
    );

    process.exitCode = 1;
    return;
  }

  try {
    console.log(
      `Preparing post data for STT ${stt}...`
    );

    const preparedPost =
      await getPreparedPostData(stt);

    console.log('');
    console.log(
      'Post data prepared successfully.'
    );

    console.log(`ID: ${preparedPost.id}`);
    console.log(`STT: ${preparedPost.stt}`);
    console.log(
      `Position ID: ${preparedPost.position.id}`
    );
    console.log(
      `Position name: ${preparedPost.position.name}`
    );
    console.log(
      `Image: ${preparedPost.image.relativePath}`
    );
    console.log(
      `Absolute image path: ${preparedPost.image.absolutePath}`
    );

    console.log('');
    console.log('JD content:');
    console.log('--------------------');
    console.log(preparedPost.jd);
    console.log('--------------------');
  } catch (error) {
    console.error('');
    console.error(
      'Post data preparation failed.'
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
