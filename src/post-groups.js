import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createSupabaseClient
} from './supabase.js';

function validateGroup(group, index) {
  if (!group || typeof group !== 'object') {
    throw new Error(
      `Group at index ${index} is invalid.`
    );
  }

  if (
    typeof group.group_key !== 'string' ||
    group.group_key.trim() === ''
  ) {
    throw new Error(
      `Group at index ${index} is missing "group_key".`
    );
  }

  if (
    typeof group.name !== 'string' ||
    group.name.trim() === ''
  ) {
    throw new Error(
      `Group "${group.group_key}" is missing "name".`
    );
  }

  if (
    typeof group.url !== 'string' ||
    group.url.trim() === ''
  ) {
    throw new Error(
      `Group "${group.group_key}" is missing "url".`
    );
  }

  return {
    id: group.id,
    groupKey: group.group_key.trim(),
    name: group.name.trim(),
    url: group.url.trim(),
    enabled: group.enabled !== false
  };
}

export async function getPostGroupsByStt(
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

  const supabase =
    options.supabase ||
    createSupabaseClient();

  const {
    data: post,
    error: postError
  } = await supabase
    .from('facebook_posts')
    .select('id, stt, position')
    .eq('stt', numericStt)
    .maybeSingle();

  if (postError) {
    throw new Error(
      [
        `Could not load post STT ${numericStt}.`,
        `Original error: ${postError.message}`
      ].join('\n')
    );
  }

  if (!post) {
    throw new Error(
      `No Facebook post found with STT ${numericStt}.`
    );
  }

  const {
    data: mappings,
    error: mappingError
  } = await supabase
    .from('facebook_post_groups')
    .select(`
      group:facebook_groups!facebook_post_groups_group_id_fkey (
        id,
        group_key,
        name,
        url,
        enabled
      )
    `)
    .eq('post_id', post.id);

  if (mappingError) {
    throw new Error(
      [
        `Could not load groups for post STT ${numericStt}.`,
        `Original error: ${mappingError.message}`
      ].join('\n')
    );
  }

  const groups = (mappings || [])
    .map((mapping) => mapping.group)
    .filter(Boolean)
    .filter((group) => group.enabled !== false)
    .map(validateGroup)
    .sort((a, b) =>
      a.groupKey.localeCompare(
        b.groupKey,
        undefined,
        {
          numeric: true
        }
      )
    );

  if (groups.length === 0) {
    throw new Error(
      `Post STT ${numericStt} has no enabled Facebook Groups assigned.`
    );
  }

  return {
    post: {
      id: post.id,
      stt: post.stt,
      position: post.position
    },
    groups
  };
}

async function runTest() {
  const stt = process.argv[2];

  if (!stt) {
    console.error(
      'Usage: node src/post-groups.js <stt>'
    );

    process.exitCode = 1;
    return;
  }

  try {
    console.log(
      `Loading assigned groups for STT ${stt}...`
    );

    const result =
      await getPostGroupsByStt(stt);

    console.log('');
    console.log('Assigned groups loaded successfully.');
    console.log(`Post ID: ${result.post.id}`);
    console.log(`STT: ${result.post.stt}`);
    console.log(`Position: ${result.post.position}`);
    console.log(
      `Enabled groups: ${result.groups.length}`
    );
    console.log('');

    result.groups.forEach((group, index) => {
      console.log(
        `${index + 1}. ${group.groupKey}`
      );
      console.log(`   Name: ${group.name}`);
      console.log(`   URL: ${group.url}`);
    });
  } catch (error) {
    console.error('');
    console.error(
      'Post group loading test failed.'
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
