const graphql = require('../utils/graphql')
const Logger = require('../utils/logger')

module.exports = async (migration, org) => {
  const logger = new Logger(migration)

  let repos = []

  logger.space()
  logger.title(`Getting topics ${org}`)

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
          repositoryTopics(first: 100) {
            nodes {
              topic {
                name
              }
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

      if (!repo.repositoryTopics || repo.repositoryTopics.nodes.length === 0) {
        logger.info(`No topics`)
      } else {
        logger.info(`${repo.repositoryTopics.nodes.length} topics`)
      }

      repos.push({
        name: repo.name,
        topics: repo.repositoryTopics ? repo.repositoryTopics.nodes : []
      })
    }
  } while (hasNextPage)

  return repos
}
