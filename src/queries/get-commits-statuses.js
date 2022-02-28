const graphql = require('../utils/graphql')
const Logger = require('../utils/logger')

module.exports = async (migration, org, repo, branch, includeCreator = false) => {
  const logger = new Logger(migration)
  const MAX_RESULTS = 100

  const statuses = {}
  const commitsPerBranch = parseInt(migration.commitsPerBranch, 10) || 1

  logger.space()
  logger.title(`Gettings last ${commitsPerBranch} commits for ${org}/${repo} in branch ${branch}`)

  const query = `query($owner: String!, $repo: String!, $lastcommits: Int!, $branch: String!, $endCursor: String) {
        repository(owner: $owner, name: $repo) {
          ref(qualifiedName: $branch) {
            target {
              ... on Commit {
                id
                history(first: $lastcommits, after: $endCursor) {
                  totalCount
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  nodes {
                    oid
                    statusCheckRollup {
                      contexts(first: 100) {
                        nodes {
                          __typename
                          ... on CheckRun {
                            id
                            status
                            name
                            url
                            checkSuite {
                              app {
                                name
                                url
                              }
                              workflowRun {
                                workflow {
                                  name
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    status { 
                      contexts {
                        id
                        state
                        creator {
                          login
                          url
                        }    
                        context 
                        description
                        targetUrl
                      }
                    }                
                  }
                }
              }
            }
          }
        }
      }`

  let hasNextPage = false
  let endCursor = null
  let commitsCounter = 0
  do {
    const variables = {
      owner: org,
      repo: repo,
      branch: branch,
      lastcommits: Math.min(commitsPerBranch, MAX_RESULTS),
      endCursor: endCursor
    }

    const data = await graphql(migration, query, variables, {
      token: migration.token
    })

    if (!data.repository.ref || !data.repository.ref.target || !data.repository.ref.target.history || !data.repository.ref.target.history.totalCount === 0) {
      return statuses
    }
    const history = data.repository.ref.target.history

    // TODO: see if this code can be shared with PRs

    logger.info(`found ${history.totalCount} commits`)
    logger.debug(`Has More: ${history.pageInfo.hasNextPage}`)

    hasNextPage = history.hasNextPage
    endCursor = history.endCursor

    commitsCounter += history.nodes.length

    for (const commit of history.nodes) {
      logger.info(`Commit ${commit.oid}`)

      if ((!commit.status || commit.status.contexts.length === 0) && (!commit.statusCheckRollup || commit.statusCheckRollup.contexts.nodes.length === 0)) {
        logger.info(`No statuses for ${commit.oid}`)
        continue
      }

      statuses[commit.oid] = []

      if (commit.statusCheckRollup) {
        for (const status of commit.statusCheckRollup.contexts.nodes) {
          if (status.checkSuite) {
            const creator = status.checkSuite.app

            logger.info(`Read Check ${status.id} created by ${creator.name} => ${status.name} - ${status.status} ${status.url}`)

            const contextPrefix = status.checkSuite.workflowRun ? `${status.checkSuite.workflowRun.workflow.name}/` : ''

            statuses[commit.oid].push({
              id: status.id,
              state: status.status.toLowerCase(),
              description: status.name,
              context: `${contextPrefix}${status.name}`,
              targetUrl: status.url,
              creator: includeCreator ? creator : null,
              type: 'check'
            })
          } else if (status.__typename) {
            logger.info(`skipped ${status.__typename}`)
          }
        }
      }

      if (commit.status) {
        for (const status of commit.status.contexts) {
          const creator = status.creator.url

          logger.info(`Read Status ${status.id} created by ${creator} => ${status.context} - ${status.state} ${status.targetUrl} ${status.description}`)
          statuses[commit.oid].push({
            id: status.id,
            state: status.state.toLowerCase(),
            description: status.description,
            context: status.context,
            targetUrl: status.targetUrl,
            creator: includeCreator ? status.creator : null,
            type: 'status'
          })
        }
      }
    }
  } while (hasNextPage && commitsCounter <= commitsPerBranch)

  return statuses
}
