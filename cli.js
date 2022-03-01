#!/usr/bin/env node
const commander = require('commander')
const program = new commander.Command()

const getStatusesCreatorsCommand = require('./src/commands/list-statuses-creators')
const getDeployKeysCommand = require('./src/commands/list-deploy-keys')
const getWebHooksCommand = require('./src/commands/list-repo-webhooks')
const getAutolinksCommand = require('./src/commands/list-repo-autolinks')
const getReleasesCommand = require('./src/commands/list-repo-releases')
const getActionsData = require('./src/commands/list-actions-data')
const getAuthorizationsCommand = require('./src/commands/list-authorizations')
const getTopicsCommand = require('./src/commands/list-repo-topics')

async function run() {
  program.addCommand(getStatusesCreatorsCommand())
  program.addCommand(getDeployKeysCommand())
  program.addCommand(getWebHooksCommand())
  program.addCommand(getAutolinksCommand())
  program.addCommand(getReleasesCommand())
  program.addCommand(getActionsData())
  program.addCommand(getAuthorizationsCommand())
  program.addCommand(getTopicsCommand())

  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    console.error(error)
    process.exit(200)
  }
}

run()
