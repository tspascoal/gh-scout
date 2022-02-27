const Logger = require('../utils/logger')
const getOctoClient = require('../utils/octokit-factory')

module.exports = async (migration, org) => {
  const logger = new Logger(migration)

  logger.title(`Getting authorizations ${org}`)

  const octokit = getOctoClient(migration.token)

  const parameters = {
    org: org
  }

  logger.rest('Get Authorizations', parameters)
  try {
    // https://docs.github.com/en/rest/reference/orgs#list-saml-sso-authorizations-for-an-organization

    const authorizations = await octokit.paginate('GET /orgs/:org/credential-authorizations', parameters)

    logger.data('REST API (List Authorizations): Response', authorizations)
    return authorizations
  } catch (e) {
    logger.error(`Error ${e.message}. List Authorizations for ${org}`)
    logger.data('REST API (Get Repo): Error', e)
    throw e
  }
}
