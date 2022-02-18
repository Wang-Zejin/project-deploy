// 注册三方依赖
const path = require('path')

// 本地依赖工具
const out = require('../utils/out')

const rootPath = process.cwd()
const tempZipPath = path.resolve(rootPath, './temp.zip')
let configs = null

const {
  getConfig,
  connect,
  startZip,
  upload,
  remoteUnzip,
  backupFile,
  removeTemp
} = require('../utils/pd')

module.exports = function (options) {
  getConfig(options)
    .then((config) => {
      configs = config
      return connect(configs)
    })
    .then((nodessh) => {
      return startZip(configs, tempZipPath)
    })
    .then((archive) => {
      return upload(configs, tempZipPath)
    })
    .then((result) => {
      if (options.backup) {
        return backupFile(configs)
      }
      return result
    })
    .then((result) => {
      return remoteUnzip(configs)
    })
    .then((result) => {
      out.success('部署完成')
      return result
    })
    .catch((err) => {
      console.log(err)
    })
    .finally(() => {
      removeTemp(configs, tempZipPath).then(() => { process.exit(1) })
    })
}