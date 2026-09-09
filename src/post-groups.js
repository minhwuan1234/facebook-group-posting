import path from 'node:path';
import { pathToFileURL } from 'node:url';

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    'Missing SUPABASE_URL in .env'
  );
}

if (!SUPABASE_KEY) {
  throw new Error(
    'Missing SUPABASE_KEY in .env'
  );
}

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
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
 * NORMALIZE GROUP
 * ========================================================= */

function normalizeGroup(group) {
  return {
    id:
      group.id,

    groupKey:
      group.group_key,

    name:
      group.name,

    url:
      group.url,

    enabled:
      group.enabled,

    positionId:
      group.position_id
  };
}


/* =========================================================
 * LOAD GROUPS BY POST
 *
 * Current matching rule:
 *
 * facebook_posts.id
 * =
 * facebook_groups.position_id
 *
 * Example:
 *
 * BD:
 * post.id = 2
 * position_id = "2"
 * ========================================================= */

export async function getPostGroupsByStt(
  stt
) {
  const numericStt =
    validateStt(stt);

  console.log(
    `Loading assigned groups for STT ${numericStt}...`
  );

  /*
   * Step 1:
   * Load post by STT.
   */
  const {
    data: post,
    error: postError
  } =
    await supabase
      .from(
        'facebook_posts'
      )
      .select(
        'id, stt, position, jd'
      )
      .eq(
        'stt',
        numericStt
      )
      .single();

  if (postError) {
    throw new Error(
      `Could not load Facebook post: ${postError.message}`
    );
  }

  if (!post) {
    throw new Error(
      `Post STT ${numericStt} was not found.`
    );
  }

  console.log('');
  console.log(
    `Post ID: ${post.id}`
  );

  console.log(
    `STT: ${post.stt}`
  );

  console.log(
    `Position: ${post.position}`
  );

  console.log(
    `Looking for groups with position_id = ${post.id}...`
  );

  /*
   * Step 2:
   * Match directly:
   *
   * facebook_groups.position_id
   * =
   * facebook_posts.id
   */
  const {
    data: groups,
    error: groupsError
  } =
    await supabase
      .from(
        'facebook_groups'
      )
      .select(
        [
          'id',
          'group_key',
          'name',
          'url',
          'enabled',
          'position_id'
        ].join(',')
      )
      .eq(
        'position_id',
        String(post.id)
      )
      .eq(
        'enabled',
        true
      )
      .order(
        'id',
        {
          ascending: true
        }
      );

  if (groupsError) {
    throw new Error(
      `Could not load Facebook Groups: ${groupsError.message}`
    );
  }

  if (
    !Array.isArray(groups) ||
    groups.length === 0
  ) {
    throw new Error(
      [
        `Post STT ${numericStt} has no enabled Facebook Groups assigned.`,
        '',
        `Post ID: ${post.id}`,
        `Position: ${post.position}`,
        '',
        'Expected matching rule:',
        `facebook_groups.position_id = "${post.id}"`,
        'facebook_groups.enabled = true'
      ].join('\n')
    );
  }

  const normalizedGroups =
    groups.map(
      normalizeGroup
    );

  console.log('');
  console.log(
    'Assigned groups loaded successfully.'
  );

  console.log(
    `Post ID: ${post.id}`
  );

  console.log(
    `STT: ${post.stt}`
  );

  console.log(
    `Position: ${post.position}`
  );

  console.log(
    `Matching position_id: ${post.id}`
  );

  console.log(
    `Enabled groups: ${normalizedGroups.length}`
  );

  normalizedGroups.forEach(
    (
      group,
      index
    ) => {
      console.log('');

      console.log(
        `${index + 1}. ${group.groupKey}`
      );

      console.log(
        `   Group DB ID: ${group.id}`
      );

      console.log(
        `   Position ID: ${group.positionId}`
      );

      console.log(
        `   Name: ${group.name}`
      );

      console.log(
        `   URL: ${group.url}`
      );
    }
  );

  return {
    postId:
      post.id,

    stt:
      post.stt,

    position:
      post.position,

    post,

    groups:
      normalizedGroups
  };
}


/* =========================================================
 * CLI TEST
 * ========================================================= */

async function run() {
  const stt =
    process.argv[2];

  if (!stt) {
    console.error(
      [
        'Usage:',
        'node src/post-groups.js <stt>',
        '',
        'Examples:',
        'node src/post-groups.js 1',
        'node src/post-groups.js 2'
      ].join('\n')
    );

    process.exitCode = 1;

    return;
  }

  try {
    await getPostGroupsByStt(
      stt
    );
  } catch (error) {
    console.error('');

    console.error(
      'Post group loading test failed.'
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
