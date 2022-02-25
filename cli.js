#!/usr/bin/env node
const commander = require('commander')
const program = new commander.Command()

const getStatusesCreatorsCommand = require('./src/commands/list-statuses-creators')
const getDeployKeysCommand = require('./src/commands/list-deploy-keys')

async function run() {
  program.addCommand(getStatusesCreatorsCommand())
  program.addCommand(getDeployKeysCommand())

  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    console.error(error)
    process.exit(200)
  }
}

run()
