const graphql = require('../utils/graphql')
const Logger = require('../utils/logger')

module.exports = async (migration, org, repo, state, includeCreator = false) => {
  const logger = new Logger(migration)

  const statuses = {}

  logger.title(`Getting ${state} prs for ${org}/${repo}`)

  const query = `query($owner: String!, $repo: String!, $lastcommits: Int!, $state: [PullRequestState!], $endCursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: 100, states: $state, after: $endCursor) {
        totalCount
        pageInfo {
            endCursor
            hasNextPage
        }
        nodes {
            number
            state
            commits(last: $lastcommits) {
                totalCount
                nodes {
                    commit {
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
}
`

  let hasNextPage = false
  let endCursor = null
  do {
    const variables = {
      owner: org,
      repo,
      state,
      lastcommits: parseInt(migration.commitsPerPr, 10) || 1,
      endCursor: endCursor
    }

    const data = await graphql(migration, query, variables, {
      token: migration.token
    })

    hasNextPage = data.repository.pullRequests.pageInfo.hasNextPage
    endCursor = data.repository.pullRequests.pageInfo.endCursor

    logger.info(`found ${data.repository.pullRequests.totalCount} PRs`)
    logger.debug(`Has More: ${hasNextPage}`)

    for (const pull of data.repository.pullRequests.nodes) {
      for (const commit of pull.commits.nodes) {
        logger.space()
        logger.info(`Getting Status for PR ${pull.number} ${pull.state} - ${commit.commit.oid}`)

        if (commit.statusCheckRollup) {
          logger.info('================')
          logger.info(`${commit.commit.oid} === ${JSON.stringify(commit.statusCheckRollup)}`)
          logger.info(`length ${commit.statusCheckRollup.contexts.nodes.length}`)
          logger.info('================')
        }

        if ((!commit.commit.status || commit.commit.status.contexts.length === 0) && (!commit.commit.statusCheckRollup || commit.commit.statusCheckRollup.contexts.nodes.length === 0)) {
          logger.log(`No statuses for ${commit.commit.oid}`)
          continue
        }

        statuses[commit.commit.oid] = []

        if (commit.commit.statusCheckRollup) {
          for (const status of commit.commit.statusCheckRollup.contexts.nodes) {

            if (status.checkSuite) {
              const creator = status.checkSuite.app

              logger.info(`Read Check ${status.id} created by ${creator.name} => ${status.name} - ${status.status} ${status.url}`)

              const contextPrefix = status.checkSuite.workflowRun ? `${status.checkSuite.workflowRun.workflow.name}/` : ''

              statuses[commit.commit.oid].push({
                id: status.id,
                state: status.status.toLowerCase(),
                description: status.name,
                context: `${contextPrefix}${status.name}`,
                targetUrl: status.url,
                creator: includeCreator ? creator : null,
                type: 'check'
              })
            } else if (status.__typename) {
              logger.info(`skipping ${status.__typename}`)
            }
          }
        }

        if (commit.commit.status) {
          for (const status of commit.commit.status.contexts) {
            logger.log(`Read Status ${status.id} => ${status.context} - ${status.state} ${status.targetUrl} ${status.description}`)

            statuses[commit.commit.oid].push({
              id: status.id,
              state: status.state.toLowerCase(),
              description: status.description,
              context: status.context,
              targetUrl: status.targetUrl,
              creator: includeCreator ? status.creator : null
            })
          }
        }
      }
    }
  } while (hasNextPage)

  return statuses
}
