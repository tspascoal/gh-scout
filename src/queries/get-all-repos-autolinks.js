const Logger = require('../utils/logger')
const getOctoClient = require('../utils/octokit-factory')
const getRepos = require('./get-all-repos')

module.exports = async (data, token, org) => {
  const logger = new Logger(data)
  const autolinks = []

  const repos = await getRepos(data, token, org)

  const octokit = getOctoClient(token)

  for (const repo of repos) {
    const parameters = {
      owner: org,
      repo: repo.name
    }
    logger.info(`Getting autolinks for ${repo.name}`)
    logger.rest('Get All autolinks', parameters)
    try {
      const repoAutoLinks = await octokit.paginate(octokit.repos.listAutolinks, parameters)
      logger.data('REST API (Get repo autolinks): Response', repoAutoLinks)

      logger.log(`  Found ${repoAutoLinks.length} autolinks`)

      autolinks.push({
        repo: repo,
        autolinks: repoAutoLinks
      })
    } catch (e) {
      logger.error(`Error ${e.message}. List autolinks repo ${repo.name}`)
      logger.data('REST API (Get autolinks): Error', e)
      throw e
    }
  }

  return autolinks
}
