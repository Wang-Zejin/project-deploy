const chalk = require('chalk')
module.exports = {
  error: function (...args) {
    throw new Error(
      chalk.bold.bgRed('\n Error ') +
      chalk.red(...args)
    )
    process.exit(0)
  },
  info: function (...args) {
    console.log(
      chalk.bold.bgWhite.black('\n Info ') +
      chalk.bold(...args)
    )
  },
  warning: function (...args) {
    console.warn(
      chalk.bold.bgYellow('\n Warning ') + 
      chalk.yellow(...args)
    )
  },
  success: function (...args) {
    console.log(
      chalk.bold.bgBlue('\n Success! ') +
      chalk.greenBright(...args)
    )
  },
  tips: function (...args) {
    console.log(
      chalk.bold.bgGreen('\n Tips ') +
      chalk.blackBright(...args)
    )
  }
}