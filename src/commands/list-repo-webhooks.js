const commander = require('commander')

const Logger = require('../utils/logger')
const getWebHooks = require('../queries/get-all-repos-webhooks')
const getFile = require('../utils/get-file')

module.exports = () => {
  const command = new commander.Command('list-repo-webhooks')

  command
    .description('Lists repos with webhooks')
    .requiredOption('-o, --org <string>', 'Organization')
    .requiredOption('--token <string>', 'the personal access token (with repo scope) of the GitHub.com organization', process.env.GITHUB_TOKEN)
    .option('--output <string>', 'Output file', '-')
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

  let output
  try {
    output = getFile(data.output)
    output.write('repo,name,active,url,created,events\n')

    for (const repo of repos) {
      if (repo.webhooks.length > 0) {
        output.write(`${repo.repo.name}`)
        for (const webhook of repo.webhooks) {
          output.write(`${webhook.name},${webhook.active},${webhook.config.url},${webhook.created_at},${webhook.events?.join(';')}\n`)
        }
      }
    }
  } finally {
    if (output?.close) {
      output.close()
    }
  }
}
