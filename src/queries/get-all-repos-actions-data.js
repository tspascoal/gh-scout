const Logger = require('../utils/logger')
const getOctoClient = require('../utils/octokit-factory')
const getRepos = require('./get-all-repos')

module.exports = async (data, token, org) => {
  const logger = new Logger(data)
  const actionsData = []

  const repos = await getRepos(data, token, org)

  const octokit = getOctoClient(token)

  for (const repo of repos) {
    const parameters = {
      owner: org,
      repo: repo.name
    }
    logger.info(`Getting a for ${repo.name}`)
    logger.rest('Get secrets', parameters)

    let numberSecrets = 0
    let numberEnvironments = 0
    let numberRunners = 0

    try {
      const repoSecrets = await octokit.paginate(octokit.actions.listRepoSecrets, parameters)
      logger.data('REST API (Get repo autolinks): Response', repoSecrets)

      logger.log(`  Found ${repoSecrets.length} secrets`)

      numberSecrets = repoSecrets.length
    } catch (e) {
      logger.error(`Error ${e.message}. List secrets ${repo.name}`)
      logger.data('REST API (List secrets): Error', e)
      throw e
    }

    try {
      const environments = await octokit.paginate(octokit.repos.getAllEnvironments, parameters)
      logger.data('REST API (Get all environments): Response', environments)

      logger.log(`  Found ${environments.length} environments`)

      numberEnvironments = environments.length
    } catch (e) {
      logger.error(`Error ${e.message}. List Environments ${repo.name}`)
      logger.data('REST API (List Environments): Error', e)
      throw e
    }

    try {
      const runners = await octokit.paginate(octokit.actions.listSelfHostedRunnersForRepo, parameters)
      logger.data('REST API (list self hosted runners): Response', runners)

      logger.log(`  Found ${runners.length} self hosted runners`)

      numberRunners = runners.length
    } catch (e) {
      logger.error(`Error ${e.message}. List Runners ${repo.name}`)
      logger.data('REST API (List Runnters): Error', e)
      throw e
    }

    actionsData.push({
      repo,
      numberSecrets,
      numberEnvironments,
      numberRunners
    })
  }

  return actionsData
}
