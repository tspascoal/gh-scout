const Logger = require('../utils/logger')
const getOctoClient = require('../utils/octokit-factory')

module.exports = async (migration, token, org, repo) => {
  const logger = new Logger(migration)

  logger.title(`Getting default branch for ${org}/${repo} `)

  const octokit = getOctoClient(token)

  const parameters = {
    owner: org,
    repo: repo
  }

  logger.rest('Get repo', parameters)
  try {
    const repo = await octokit.repos.get(parameters)
    logger.data('REST API (Get Repo): Response', repo)
    logger.log(`Default Branch ${repo.data.default_branch}`)

    return repo.data.default_branch
  } catch (e) {
    logger.error(`Error ${e.message}. Getting repo ${org}/${repo}`)
    logger.data('REST API (Get Repo): Error', e)
  }
}
