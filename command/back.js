const out = require('../utils/out')
const {
  connect,
  getConfig,
  getBackupList,
  chooseBackupAndMv,
  backupFile,
  remoteUnzip,
  mvBackupToIndex,
  removeTemp
} = require('../utils/pd')
let configs
let choosedName
module.exports = function(options) {
  getConfig(options)
    .then((config) => {
      configs = config
      return connect(configs)
    })
    .then(() => {
      return getBackupList(configs)
    })
    .then((backupList) => {
      if (options.list) {
        console.table(backupList)
        return Promise.reject('列表展示完成。')
      }
      return chooseBackupAndMv(configs, backupList)
    })
    .then((choosedname) => {
      choosedName = choosedname
      console.log('choosedName3',choosedName)
      return backupFile(configs)
    })
    .then(() => {
      console.log('choosedName4',choosedName)
      return remoteUnzip(configs, choosedName)
    })
    .then(() => {
      return mvBackupToIndex(configs, choosedName)
    })
    .then(() => {
      out.success('线上项目包切换成功！')
    })
    .catch((err) => {
      console.log(err)
    })
    .finally(() => {
      removeTemp(configs).then(() => process.exit(1))
    })
}