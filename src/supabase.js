import 'dotenv/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createClient
} from '@supabase/supabase-js';

const DEFAULT_TABLE = 'facebook_posts';

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (
    typeof value !== 'string' ||
    value.trim() === ''
  ) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value.trim();
}

export function createSupabaseClient() {
  const supabaseUrl =
    getRequiredEnvironmentVariable('SUPABASE_URL');

  const supabaseKey =
    getRequiredEnvironmentVariable('SUPABASE_KEY');

  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
}

function validatePostRow(row) {
  if (!row || typeof row !== 'object') {
    throw new Error(
      'Supabase returned an invalid post row.'
    );
  }

  if (
    !Number.isInteger(row.stt) ||
    row.stt <= 0
  ) {
    throw new Error(
      'Post row has an invalid "stt" value.'
    );
  }

  if (
    typeof row.position !== 'string' ||
    row.position.trim() === ''
  ) {
    throw new Error(
      `Post STT ${row.stt} is missing "position".`
    );
  }

  if (
    typeof row.jd !== 'string' ||
    row.jd.trim() === ''
  ) {
    throw new Error(
      `Post STT ${row.stt} is missing JD content.`
    );
  }

  return {
    id: row.id,
    stt: row.stt,
    position: row.position.trim(),
    jd: row.jd
  };
}

export async function getPostByStt(
  stt,
  options = {}
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

  const tableName =
    options.tableName ||
    process.env.SUPABASE_POSTS_TABLE ||
    DEFAULT_TABLE;

  const supabase =
    options.supabase ||
    createSupabaseClient();

  const {
    data,
    error
  } = await supabase
    .from(tableName)
    .select('id, stt, position, jd')
    .eq('stt', numericStt)
    .maybeSingle();

  if (error) {
    throw new Error(
      [
        `Could not load post STT ${numericStt} from Supabase.`,
        `Original error: ${error.message}`
      ].join('\n')
    );
  }

  if (!data) {
    throw new Error(
      `No Facebook post found with STT ${numericStt}.`
    );
  }

  return validatePostRow(data);
}

async function runTest() {
  const stt = process.argv[2];

  if (!stt) {
    console.error(
      'Usage: node src/supabase.js <stt>'
    );

    process.exitCode = 1;
    return;
  }

  try {
    console.log(
      `Loading Facebook post STT ${stt}...`
    );

    const post = await getPostByStt(stt);

    console.log('');
    console.log('Post loaded successfully.');
    console.log(`ID: ${post.id}`);
    console.log(`STT: ${post.stt}`);
    console.log(`Position: ${post.position}`);
    console.log('');
    console.log('JD content:');
    console.log('--------------------');
    console.log(post.jd);
    console.log('--------------------');
  } catch (error) {
    console.error('');
    console.error(
      'Supabase post loading test failed.'
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
