const Logger = require('../utils/logger')
const getOctoClient = require('../utils/octokit-factory')
const getRepos = require('./get-all-repos')

module.exports = async (data, token, org) => {
  const logger = new Logger(data)
  const webhooks = []

  const repos = await getRepos(data, token, org)

  const octokit = getOctoClient(token)

  for (const repo of repos) {
    const parameters = {
      owner: org,
      repo: repo.name
    }
    logger.info(`Getting webhooks for ${repo.name}`)
    logger.rest('Get All Webhooks', parameters)
    try {
      const repoWebHooks = await octokit.paginate(octokit.repos.listWebhooks, parameters)
      logger.data('REST API (Get repo webhooks): Response', repoWebHooks)

      logger.log(`  Found ${repoWebHooks.length} webhooks`)

      webhooks.push({
        repo: repo,
        webhooks: repoWebHooks
      })
    } catch (e) {
      logger.error(`Error ${e.message}. List webhooks repo ${repo.name}`)
      logger.data('REST API (Get Webhooks): Error', e)
      throw e
    }
  }

  return webhooks
}
