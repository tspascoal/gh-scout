const HttpsProxyAgent = require('https-proxy-agent')

module.exports = () => {
  // Pickup proxy information from environment variable if available
  const proxy = process.env.http_proxy || process.env.https_proxy
  let result = {
    enabled: false,
    proxyAgent: null
  }

  if (proxy) {
    result['enabled'] = true
    result['proxyAgent'] = new HttpsProxyAgent(proxy)
  }

  return result
}
