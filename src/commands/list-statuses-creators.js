const commander = require('commander')

const Logger = require('../utils/logger')

const getPullRequestStatuses = require('../queries/get-pull-request-statuses')
const getCommitStatuses = require('../queries/get-commits-statuses')
const getDefaultBranch = require('../queries/get-default-branch')
const getAllRepos = require('../queries/get-all-repos')

module.exports = () => {
  const command = new commander.Command('list-statuses-creators')

  command
    .description('List the creators and the contexts they are creating (statuses and checks)')
    .requiredOption('-o, --org <string>', 'Organization')
    .requiredOption('--token <string>', 'the personal access token (with repo scope) of the GitHub.com organization', process.env.GITHUB_TOKEN)
    .option('-r, --repos <string>', 'List of repos to get creates (comma separated). If ommited all repos will be scanned')
    .option('--pr-states <csv states>', 'The PR states to consider (default OPEN)', 'OPEN')
    .option('--commits-per-pr <number>', 'Scan last N commit statuses per PR (default value 5, max 250)', 5)
    .option('--commits-per-branch <number>', 'Get last N commit statuses per PR (default value 5)', 5)
    .option('-d, --debug', 'display debug output')
    .option('--color', 'Force colors (use --color to force when autodetect disables colors (eg: piping')
    .action(run)

  return command
}

async function run(migration) {
  const logger = new Logger(migration)

  console.log(`Getting Statuses creators for PRs and Commits of default branch`)

  if (migration.commitsPerPr < 1 || migration.commitsPerPr > 250) {
    logger.error(`--commits-per-pr must be between 1 and 250`)
    process.exit(1)
  }

  if (migration.commitsPerBranch < 1) {
    logger.error(`--commits-per-branch must be bigger than 0`)
    process.exit(1)
  }

  const repos = migration.repos ? migration.repos.split(',').map(repo => repo.trim()) : await getAllRepos(migration, migration.token, migration.org)

  const creators = []

  try {
    for (const repo of repos) {
      let default_branch
      let repo_name

      if (typeof repo === 'string') {
        repo_name = repo
        default_branch = await getDefaultBranch(migration, migration.token, migration.org, repo)

        if (!default_branch || default_branch.length === 0) {
          logger.warn(`Cannot find ${migration.org}/${repo}. Will continue`)
          continue
        }
      } else {
        default_branch = repo.default_branch
        repo_name = repo.name
      }

      for (const state of migration.prStates.split(',').map(state => state.trim().toUpperCase())) {
        const prStatuses = await getPullRequestStatuses(migration, migration.org, repo_name, state, true)

        aggregateCreators(prStatuses, creators)
      }

      const commitStatuses = await getCommitStatuses(migration, migration.org, repo_name, default_branch, true)

      aggregateCreators(commitStatuses, creators)
    }
  } catch (e) {
    logger.error(`Error ${e.message}. We haven't been able to fetch all the data, but will show what we have got.`)
    logger.data('Error', e)
  } finally {
    logger.space()
    logger.title('Creators')

    for (const creator in creators) {
      logger.space()
      logger.log(`${creator} set the following contexts (${creators[creator].contexts.length}):`)
      logger.log(`  ${creators[creator].contexts.join(', ')}`)
    }
  }
}

function aggregateCreators(statuses, creators) {
  Object.keys(statuses).forEach(oid => {
    const commitStatuses = statuses[oid]

    for (const status of commitStatuses) {
      const createKey = status.creator ? (status.creator.name ? status.creator.name : status.creator.url) : 'unknown'

      if (creators[createKey]) {
        if (!creators[createKey].contexts.includes(status.context)) {
          creators[createKey].contexts.push(status.context)
        }
      } else {
        creators[createKey] = {
          creator: status.creator,
          contexts: [status.context]
        }
      }
    }
  })
}
