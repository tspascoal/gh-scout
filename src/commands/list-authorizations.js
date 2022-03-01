const commander = require('commander')

const Logger = require('../utils/logger')

const getAuthorizations = require('../queries/get-authorizations')
const getFile = require('../utils/get-file')

module.exports = () => {
  const command = new commander.Command('list-authorizations')

  command
    .description('Lists authorizations on an organization (PATS,SSH keys...)')
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

  let output
  try {
    output = getFile(data.output)
    output.write(`login,type,authorized_at,last_access_at,expires_at,note,scopes\n`)

    for (const authorization of auths) {
      output.write(
        `${authorization.login},${authorization.credential_type},${authorization.credential_authorized_at},${authorization.credential_accessed_at ?? 'never'},${
          authorization.authorized_credential_expires_at ?? 'never'
        },${authorization.authorized_credential_note ?? ''}${authorization.authorized_credential_title ?? ''},${authorization.scopes ? authorization.scopes.join('; ') : ''}\n`
      )
    }
  } finally {
    if (output.close) {
      output.close()
    }
  }
}
