const chalk = require('chalk')
const log = console.log

module.exports = class Logger {
  constructor(options) {
    this.options = options
    this.isDebugMode = options.debug
    this.debugPrefix = '[DEBUG] '
    this.titleSeparator = '----------------------------------------'
    this.outgoingSeparator = '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>'
    this.incomingSeparator = '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
    this.debugEndSeparator = '########################################'
  }

  log(text) {
    return console.log(text)
  }

  space() {
    return console.log('')
  }

  debug(text, value) {
    if (this.isDebugMode) {
      this.log(chalk.gray(this.debugPrefix) + text)

      if (value) {
        this.space()
        this.log(value)
      }
    }
  }

  debugEnd() {
    if (this.isDebugMode) {
      this.space()
      this.log(chalk.gray(this.debugPrefix) + chalk.blue.bold(this.debugEndSeparator))
      this.log(chalk.gray(this.debugPrefix) + chalk.blue.bold(this.debugEndSeparator))
      this.space()
    }
  }

  title(title) {
    if (this.isDebugMode) {
      const maxStackLength = 5
      const stack = new Error().stack.split('at ')

      log()
      this.debug(chalk.blue.bold(title))
      for (let x = 2; x < Math.min(stack.length, maxStackLength); x++) {
        this.debug(chalk.gray(stack[x].trim()))
      }
      this.debug(chalk.blue.bold(this.titleSeparator))
      log()
    } else {
      this.step(title)
    }
  }

  step(step) {
    this.log('> ' + chalk.blue.bold(step) + ' ...')
  }

  sleep(seconds) {
    this.log('| ' + chalk.gray.bold(`Waiting (${seconds}s) ...`))
  }

  info(info) {
    this.log('# ' + chalk.gray.bold(info))
  }

  warn(warning) {
    this.log('# ' + chalk.yellow.bold(warning))
  }

  error(warning) {
    this.log('# ' + chalk.red.bold(warning))
  }

  data(title, data) {
    if (this.isDebugMode) {
      this.debug(chalk.magenta.bold(title))
      this.debug(chalk.magenta.bold(this.incomingSeparator))
      this.space()
      this.log(data)
      this.space()
    }
  }

  graphql(query, variables) {
    if (this.isDebugMode) {
      this.debug(chalk.magenta.bold('GraphQL: Query'))
      this.debug(chalk.magenta.bold(this.outgoingSeparator))
      this.space()
      this.log(query)
      this.space()
      this.debug(chalk.magenta.bold('GraphQL: Variables'))
      this.space()
      this.log(variables)
      this.space()
    }
  }

  rest(title, parameters) {
    if (this.isDebugMode) {
      this.debug(chalk.magenta.bold(`REST API (${title})`))
      this.debug(chalk.magenta.bold(this.outgoingSeparator))
      this.space()
      this.debug(chalk.magenta.bold(`REST API (${title}): Parameters`))
      this.space()
      this.log(parameters)
      this.space()
    }
  }

  graphqlResponse(data) {
    this.data('GraphQL: Response', JSON.stringify(data))
  }
}
