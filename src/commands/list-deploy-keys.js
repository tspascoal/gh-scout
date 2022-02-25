const commander = require('commander')

const Logger = require('../utils/logger')

const getDeployKeys = require('../queries/get-deploy-keys')

module.exports = () => {
  const command = new commander.Command('list-deploy-keys')

  command
    .description('Lists repos with deploy keys')
    .requiredOption('-o, --org <string>', 'Organization')
    .requiredOption('--token <string>', 'the personal access token (with repo scope) of the GitHub.com organization', process.env.GITHUB_TOKEN)
    .option('-d, --debug', 'display debug output')
    .option('--color', 'Force colors (use --color to force when autodetect disables colors (eg: piping')
    .action(run)

  return command
}

async function run(data) {
  const logger = new Logger(data)

  console.log(`Getting repos with deploy keys`)

  let repos = null
  try {
    repos = await getDeployKeys(data, data.org)
  } catch (e) {
    logger.error(`Error ${e.message}.`)
    logger.data('Error', e)
    return
  }

  logger.space()
  logger.title('Repos with keys')
  for (const repo of repos) {
    if (repo.deployKeys.length > 0) {
      logger.log(`${repo.name} keys:`)
      for (const key of repo.deployKeys) {
        logger.log(`  ${key.title} created: ${key.createdAt} access: ${key.readOnly ? '(read only)' : '(write)'}`)
      }
    }
  }
}
