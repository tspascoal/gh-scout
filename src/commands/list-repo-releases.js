const commander = require('commander')

const Logger = require('../utils/logger')

const getReleases = require('../queries/get-releases')

module.exports = () => {
  const command = new commander.Command('list-repo-releases')

  command
    .description('Lists repos releases count')
    .requiredOption('-o, --org <string>', 'Organization')
    .requiredOption('--token <string>', 'the personal access token (with repo scope) of the GitHub.com organization', process.env.GITHUB_TOKEN)
    .option('-d, --debug', 'display debug output')
    .option('--color', 'Force colors (use --color to force when autodetect disables colors (eg: piping')
    .action(run)

  return command
}

async function run(data) {
  const logger = new Logger(data)

  console.log(`Getting repos`)

  let repos = null
  try {
    repos = await getReleases(data, data.org)
  } catch (e) {
    logger.error(`Error ${e.message}.`)
    logger.data('Error', e)
    return
  }

  logger.space()
  logger.title('Repos:')

  logger.log('repo,nr_releases')
  for (const repo of repos) {
    logger.log(`${repo.name},${repo.numberReleases}`)
  }
}
