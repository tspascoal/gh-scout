const fs = require('fs')

module.exports = filename => {
  if (filename === '-') return process.stdout

  console.log(`result will be written to ${filename}`)
  return fs.createWriteStream(filename)
}
