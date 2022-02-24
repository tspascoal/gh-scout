#!/usr/bin/env node
const commander = require('commander')
const program = new commander.Command()

const getStatusesCreatorsCommand = require('./src/commands/get-statuses-creators')

async function run() {
  program.addCommand(getStatusesCreatorsCommand())

  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    console.error(error)
    process.exit(200)
  }
}

run()
