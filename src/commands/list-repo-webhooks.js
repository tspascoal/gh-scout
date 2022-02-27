const commander = require('commander')

const Logger = require('../utils/logger')

const getWebHooks = require('../queries/get-all-repos-webhooks')

module.exports = () => {
  const command = new commander.Command('list-repo-webhooks')

  command
    .description('Lists repos with webhooks')
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
    repos = await getWebHooks(data, data.token, data.org)
  } catch (e) {
    logger.error(`Error ${e.message}.`)
    logger.data('Error', e)
    return
  }

  logger.space()
  logger.title('Repos with webhooks')

  for (const repo of repos) {
    if (repo.webhooks.length > 0) {
      logger.log(`${repo.repo.name} webhooks:`)
      for (const webhook of repo.webhooks) {
        logger.log(`  ${webhook.name} active: ${webhook.active} url: ${webhook.config.url} created: ${webhook.created_at} events: ${webhook.events?.join(', ')}`)
      }
    }
  }
}
