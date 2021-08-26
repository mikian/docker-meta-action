const core = require('@actions/core');
const github = require('@actions/github');

function sha(context) {
  if (context.payload && context.payload.pull_request) {
    return context.payload.pull_request.head.sha;
  } else {
    return context.sha;
  }
}

function metaLabels(context) {
  return [
    `org.opencontainers.image.created=${(new Date()).toISOString()}`,
    `org.opencontainers.image.description=${context.payload.repository.description || ''}`,
    `org.opencontainers.image.revision=${sha(context) || ''}`,
    `org.opencontainers.image.source=${context.payload.repository.html_url || ''}`,
    `org.opencontainers.image.title=${context.payload.repository.name || ''}`,
    `org.opencontainers.image.url=${context.payload.repository.html_url || ''}`,
  ];
}

function metaTags(image, context, commit) {
  var tags = [];

  tags.push(`${image}:${commit}`);

  if (context.ref == `refs/heads/${context.payload.repository.default_branch}`) {
    tags.push(`${image}:latest`)
    tags.push(`${image}:release-${commit.substr(0, 7)}`)
  } else {
    tags.push(`${image}:dev-${commit.substr(0, 7)}`)
  }

  return tags;
}

try {
  // Fetch inputs
  const image = core.getInput('image');

  // Initialize context
  const labels = metaLabels(github.context);
  const tags = metaTags(
    image,
    github.context,
    sha(github.context)
  );

  console.log(`Labels:\n  ${labels.join(`\n  `)}`);
  core.setOutput('labels', labels.join(`\n`));

  console.log(`Tags:\n  ${tags.join(`\n  `)}`);
  core.setOutput('tags', tags.join(`\n`));

  // Accessors
  core.setOutput('image-tag', tags[0]);
  core.setOutput('image', image);
  core.setOutput('tag', sha(github.context));
} catch (error) {
  core.setFailed(error.message);
}
