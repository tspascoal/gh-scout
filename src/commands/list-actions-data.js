const commander = require('commander')

const Logger = require('../utils/logger')

const getActionsData = require('../queries/get-all-repos-actions-data')
const getFile = require('../utils/get-file')

module.exports = () => {
  const command = new commander.Command('list-repo-actions-data')

  command
    .description('Lists repos actions data on an organization (secrets,environments,self hosted runners')
    .requiredOption('-o, --org <string>', 'Organization')
    .requiredOption('--token <string>', 'the personal access token (with repo scope) of the GitHub.com organization', process.env.GITHUB_TOKEN)
    .option('--output <string>', 'Output file', '-')
    .option('-u, --user', 'User')
    .option('-d, --debug', 'display debug output')
    .option('--color', 'Force colors (use --color to force when autodetect disables colors (eg: piping')
    .action(run)

  return command
}

async function run(data) {
  const logger = new Logger(data)

  let repos

  console.log(`Getting autolinks`)

  try {
    repos = await getActionsData(data, data.token, data.org)
  } catch (e) {
    logger.error(`Error ${e.message}.`)
    logger.data('Error', e)
    return
  }

  logger.space()
  logger.title('Actions Data:')
  let output
  try {
    output = getFile(data.output)
    output.write('repo,nr_secrets,nr_environments,nr_runners\n')

    for (const repo of repos) {
      output.write(`${repo.repo.name},${repo.numberSecrets},${repo.numberEnvironments},${repo.numberRunners}\n`)
    }
  } finally {
    if (output.close) {
      output.close()
    }
  }
}
