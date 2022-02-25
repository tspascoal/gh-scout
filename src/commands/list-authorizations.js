const commander = require('commander')

const Logger = require('../utils/logger')

const getAuthorizations = require('../queries/get-authorizations')

module.exports = () => {
  const command = new commander.Command('list-authorizations')

  command
    .description('Lists authorizations on an organization (PATS,SSH keys...)')
    .requiredOption('-o, --org <string>', 'Organization')
    .requiredOption('--token <string>', 'the personal access token (with repo scope) of the GitHub.com organization', process.env.GITHUB_TOKEN)
    .option('-u, --user', 'User')
    .option('-d, --debug', 'display debug output')
    .option('--color', 'Force colors (use --color to force when autodetect disables colors (eg: piping')
    .action(run)

  return command
}

async function run(data) {
  const logger = new Logger(data)

  let auths

  console.log(`Getting authorizations`)

  try {
    auths = await getAuthorizations(data, data.org)
  } catch (e) {
    logger.error(`Error ${e.message}.`)
    logger.data('Error', e)
    return
  }

  logger.space()
  logger.title('Authorizations:')

  for (const authorization of auths) {
    logger.log(
      `  ${authorization.login} ${authorization.credential_type} authorization: ${authorization.credential_authorized_at} last access: ${authorization.credential_accessed_at} ${
        authorization.authorized_credential_note ?? ''
      }${authorization.authorized_credential_title ?? ''} ${authorization.scopes ? 'scopes: ' + authorization.scopes.join(', ') : ''}`
    )
  }
}
