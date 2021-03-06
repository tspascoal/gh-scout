const commander = require('commander')

const Logger = require('../utils/logger')

const getAutolinks = require('../queries/get-all-repos-autolinks')
const getFile = require('../utils/get-file')

module.exports = () => {
  const command = new commander.Command('list-repo-autolinks')

  command
    .description('Lists repositories autolinks on an organization')
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

  let autolinks

  console.log(`Getting autolinks`)

  try {
    autolinks = await getAutolinks(data, data.token, data.org)
  } catch (e) {
    logger.error(`Error ${e.message}.`)
    logger.data('Error', e)
    return
  }

  logger.space()
  logger.title('Autolinks:')

  let output
  try {
    output = getFile(data.output)
    output.write('repo,prefix,template\n')
    for (const repo of autolinks) {
      if (repo.autolinks.length > 0) {
        for (const autolink of repo.autolinks) {
          output.write(`${repo.repo.name},${autolink.key_prefix},${autolink.url_template}\n`)
        }
      }
    }
  } finally {
    if (output.close) {
      output.close()
    }
  }
}
