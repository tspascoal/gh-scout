// graphql

const { Octokit } = require('@octokit/rest')
const proxyAgent = require('../utils/proxy-agent')
const { throttling } = require('@octokit/plugin-throttling')

module.exports = token => {
  const proxy = proxyAgent()

  if (!token || token === '') {
    throw new Error('No token provided')
  }

  const throttlingOctokit = Octokit.plugin(throttling)

  const baseUrl = process.env['GH_HOST'] ? process.env['GH_HOST'] + '/api/v3' : null

  return new throttlingOctokit({
    auth: token,
    baseUrl,
    ...(proxy.enabled ? { request: { agent: proxy.proxyAgent } } : {}),
    throttle: {
      onRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`)

        if (options.request.retryCount < 2) {
          octokit.log.info(`Retrying after ${retryAfter} seconds!`)
          return true
        }
      },
      onAbuseLimit: (retryAfter, options, octokit) => {
        // does not retry, only logs a warning
        octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`)
      }
    }
  })
}
