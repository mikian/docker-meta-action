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
    `org.opencontainers.image.revision=${sha(context) || ''}`,
    `org.opencontainers.image.source=${context.payload.repository.html_url || ''}`,
  ];
}

function metaTags(repository, context, commit) {
  var tags = [];

  console.log(`Context: ${json.dumps(context)}`);

  var ref = context.head_ref || context.ref;

  tags.push(`${repository}:${commit}`);
  tags.push(`${repository}:${ref.replace('refs/heads/', '')}`);

  if (context.ref == `refs/heads/${context.payload.repository.default_branch}`) {
    tags.push(`${repository}:latest`)
    tags.push(`${repository}:release-${commit.substr(0, 7)}`)
  } else {
    tags.push(`${repository}:dev-${commit.substr(0, 7)}`)
  }

  // Append PR number
  if (context.payload && context.payload.pull_request) {
    tags.push(`${repository}:pr-${context.payload.pull_request.number}`)
  }

  return tags;
}

try {
  // Fetch inputs
  const repository = core.getInput('repository');

  // Initialize context
  const labels = metaLabels(github.context);
  const tags = metaTags(
    repository,
    github.context,
    sha(github.context)
  );

  console.log(`RepositoryTag:\n  ${tags[0]}`);
  core.setOutput('repositoryTag', tags[0]);

  console.log(`repository:\n  ${core.getInput('repository')}`);
  core.setOutput('repository', core.getInput('repository'));

  console.log(`Tag:\n  ${sha(github.context)}`);
  core.setOutput('tag', `${sha(github.context)}`);


  console.log(`Tags:\n  ${tags.join(`\n  `)}`);
  core.setOutput('tags', tags.join(`\n`));

  console.log(`Labels:\n  ${labels.join(`\n  `)}`);
  core.setOutput('labels', labels.join(`\n`));

  console.log(`SHA:\n  ${sha(github.context)}`);
  core.setOutput('sha', sha(github.context));

} catch (error) {
  core.setFailed(error.message);
}
