const graphql = require('../utils/graphql')
const Logger = require('../utils/logger')

module.exports = async (migration, org) => {
  const logger = new Logger(migration)

  let repos = []

  logger.space()
  logger.title(`Getting deploy keys ${org}`)

  const query = `query($owner: String! $endCursor: String) {
    organization(login: $owner) {    
      repositories(first: 100, after: $endCursor) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          name
          deployKeys(first:100) {
            nodes {
              readOnly
              key
              title
              createdAt
            }
          }
        }
      }
    }
  }`

  let hasNextPage = false
  let endCursor = null
  do {
    const variables = {
      owner: org,
      endCursor: endCursor
    }

    const data = await graphql(migration, query, variables, {
      token: migration.token
    })

    let dataNode = data.organization.repositories

    logger.info(`found ${dataNode.totalCount} repos`)
    logger.debug(`Has More: ${dataNode.pageInfo.hasNextPage}`)

    hasNextPage = dataNode.pageInfo.hasNextPage
    endCursor = dataNode.pageInfo.endCursor

    for (const repo of dataNode.nodes) {
      logger.step(`Repo ${repo.name}`)

      if (!repo.deployKeys || repo.deployKeys.nodes.length === 0) {
        logger.info(`No deploy keys`)
      } else {
        logger.info(`${repo.deployKeys.nodes.length} deploy keys`)
      }

      repos.push({
        name: repo.name,
        deployKeys: repo.deployKeys ? repo.deployKeys.nodes : []
      })
    }
  } while (hasNextPage)

  return repos
}
