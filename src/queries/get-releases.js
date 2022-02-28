const graphql = require('../utils/graphql')
const Logger = require('../utils/logger')

module.exports = async (data, org) => {
  const logger = new Logger(data)

  let repos = []

  logger.space()
  logger.title(`Getting releases for ${org}`)

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
          releases {
            totalCount
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

    const responseData = await graphql(data, query, variables, {
      token: data.token
    })

    let dataNode = responseData.organization.repositories

    logger.info(`found ${dataNode.totalCount} repos`)
    logger.debug(`Has More: ${dataNode.pageInfo.hasNextPage}`)

    hasNextPage = dataNode.pageInfo.hasNextPage
    endCursor = dataNode.pageInfo.endCursor

    for (const repo of dataNode.nodes) {
      logger.step(`Repo ${repo.name}`)

      logger.info(`${repo.releases.totalCount} deploy keys`)

      repos.push({
        name: repo.name,
        numberReleases: repo.releases.totalCount
      })
    }
  } while (hasNextPage)

  return repos
}
