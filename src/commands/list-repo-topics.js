const commander = require('commander')

const Logger = require('../utils/logger')

const getTopics = require('../queries/get-repo-topics')

module.exports = () => {
  const command = new commander.Command('list-repo-topics')

  command
    .description('Lists repos with topics')
    .requiredOption('-o, --org <string>', 'Organization')
    .requiredOption('--token <string>', 'the personal access token (with repo scope) of the GitHub.com organization', process.env.GITHUB_TOKEN)
    .option('-d, --debug', 'display debug output')
    .option('--color', 'Force colors (use --color to force when autodetect disables colors (eg: piping')
    .action(run)

  return command
}

async function run(data) {
  const logger = new Logger(data)

  console.log(`Getting repos with topics`)

  let repos = null
  try {
    repos = await getTopics(data, data.org)
  } catch (e) {
    logger.error(`Error ${e.message}.`)
    logger.data('Error', e)
    return
  }

  logger.space()
  logger.title(`Repos with topics (${repos.filter(r=> r.topics.length > 0).length})`)
  logger.log('repo,topics')
  for (const repo of repos) {
    if (repo.topics.length > 0) {
      logger.log(`${repo.name},${repo.topics?.map(r => r.topic.name).join(';')}`)
    }
  }
}
