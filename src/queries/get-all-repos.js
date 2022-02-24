const Logger = require('../utils/logger')
const getOctoClient = require('../utils/octokit-factory')

module.exports = async (migration, token, org) => {
  const logger = new Logger(migration)

  logger.title(`Getting All repos for ${org}`)

  const octokit = getOctoClient(token)

  const parameters = {
    org: org,
    type: 'all'
  }

  logger.rest('Get All Repos', parameters)
  try {
    const repos = await octokit.paginate(octokit.repos.listForOrg, parameters)
    logger.data('REST API (Get All Repos): Response', repos)
    return repos.map(r => {
      return { name: r.name, default_branch: r.default_branch }
    })
  } catch (e) {
    logger.error(`Error ${e.message}. List repos for ${org}`)
    logger.data('REST API (Get Repo): Error', e)
    throw e
  }
}
