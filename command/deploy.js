// 注册三方依赖
const path = require('path')
const { NodeSSH } = require('node-ssh')
const chalk = require('chalk')
const archiver = require('archiver')
const fs = require('fs')
// 本地依赖工具
const out = require('../utils/out')
const { getConfigs, getPassword } = require('../utils/getConfigs')
const rootPath = process.cwd()
const tempZipPath = path.resolve(rootPath, './temp.zip')
let configs = null

// 重写对execCommand的响应进行拦截展示
NodeSSH.prototype.execShow = async function ({
  stopProcess = true
}, ...args) {
  const result = await this.execCommand(...args);
  if (result.stderr) {
    if (stopProcess) {
      out.error(result.stderr)
    }
    console.log(
      chalk.bgYellow.bold.black(`\n ${configs.host} `),
      result.stderr
    )
  }
  if (result.stdout && result.stdout !== '') {
    console.log(
      chalk.bgWhite.bold.black(`\n ${configs.host} `),
      result.stdout
    )
  }

  return result
}
const ssh = new NodeSSH()
/**
 * 根据参数选择，获取到响应配置
 * @param {object} options 通过命令行获取到的参数对象
 * @returns {object} 返回获取到的配置对象
 */
async function getConfig(options) {
  let configs
  out.info('正在获取相关配置...')
  try {
    if (options.custom) {
      configs = await getConfigs(options)
    } else if (options.mode && options.mode !== null) {
      configs = require(path.resolve(rootPath, `./project-deploy/config.${options.mode}.js`))
    } else {
      configs = require(path.resolve(rootPath, `./project-deploy/config.js`))
    }
  } catch(err) {
    out.error(
      err + '\n' +
      '获取配置文件失败：请检查是否有相关模式的配置文件是否正确。'
    )
  }
  return configs
}
/**
 * 根据配置 与服务器简历ssh链接
 * @param {object} config 服务器配置对象
 * @returns {Promise} 返回一个Promise对象
 */
function connect(config) {
  out.info('正在与服务器简历ssh连接...')
  return ssh.connect({
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password
  }).catch((err) => {
    out.error(
      err + '\n' +
      '链接服务器失败，请检查相关配置是否正确。'
    )
  })
}
/**
 * 将待发布包，压缩到临时压缩文件
 * @param {object} config 服务器配置对象
 * @param {string} tempZipPath 临时文件位置
 * @returns {Promise}
 */
function startZip(config, tempZipPath) {
  let srcPath = path.resolve(rootPath, config.localPath)
  return new Promise((resolve, reject) => {
    let archive = archiver('zip', {
      zlib: { level: 9 }
    }).on('error', function(err) {
        throw err
    })
    let output = fs.createWriteStream(tempZipPath)
      .on('close', function(err) {
          if (err) {
            out.warning('关闭archiver异常:',err);
            reject(err)
          }
          out.info('已生成压缩文件包')
          resolve(archive)
      })
    archive.pipe(output)
    archive.directory(srcPath,`/${config.targetName}`)
    archive.finalize()
  })
}

/**
 * 本地压缩包上传至服务器
 * @param {object} config 服务器配置对象
 * @param {string} tempZipPath 临时文件位置
 * @returns {Promise}
 */
function upload(config, tempZipPath) {
  let targetFile = `${config.targetPath}/${config.targetName}.zip`
  out.info('正在上传文件...')
  return ssh.putFile(tempZipPath, targetFile)
    .then((result) => {
      out.success('文件上传成功！')
      return result
    })
    .catch(err=>{
      out.error(
        `${err}\n` + 
        '上传文件异常，进程结束。\n'
      )
    })
}
/**
 * 获取文件更改时间作为备份文件名称
 * @param {object} config 服务器配置对象
 * @returns {Promise}
 */
function getDeployTime(config) {
  return ssh.execShow(
    {},
    `stat ${config.targetName}`,
    { cwd: config.targetPath}
  )
    .then((result) => {
      if (result.stderr) {
        return result
      }
      const deployTime = result.stdout.split('\n')
        .find(item => item.includes('Change'))
        .match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/g)[0]
        .replace(/\s/g, '+')
        return { deployTime }
    })
    .catch((err) => {
      out.warning(err)
    })
}
/**
 * 
 * @param {array} backupList 备份文件列表
 * @param {object} config 服务器配置对象
 * @returns {array} 返回需要删除备份文件列表
 */
function getOverList(backupList, configs) {
  backupList
    .sort((a, b) => {
      let aTime = new Date(a.replace('.zip', '').replace('+', ' ')).getTime()
      let bTime = new Date(b.replace('.zip', '').replace('+', ' ')).getTime()
      return bTime - aTime
    })
  let rmList = []
  for(let i = backupList.length-1; i>=0; i--) {
    if (backupList.length > configs.backupMaxCount) {
      rmList.push(backupList.splice(backupList.length-1, 1)[0])
    } else {
      break
    }
  }
  return rmList
}
/**
 * 备份服务器正在运行的项目
 * @param {object} config 服务器配置对象
 * @returns {Promise}
 */
function backupFile(configs) {
  let dateStr = new Date().getTime()
  out.info('正在进行备份...')
  return ssh.execShow({ stopProcess: false }, `find ${configs.backupPath}`)
    .then((result) => {
      if (result.stderr) {
        return ssh.execShow({}, `mkdir ${configs.backupPath}`)
      }
      return result
    })
    // .then((result) => {
    //   return ssh.execShow(
    //     { stopProcess: false},
    //     `find ${configs.targetName}`, 
    //     { cwd: configs.targetPath }
    //   )
    // })
    .then((result) => {
      return getDeployTime(configs)
    })
    .then((result) => {
      if (result.stderr) {
        return Promise.reject(result.stderr)
      }
      dateStr = result.deployTime
      return ssh.execShow(
        {},
        `mv ./${configs.targetName} ${configs.backupPath}/${dateStr}`, 
        { cwd: configs.targetPath }
      )
    })
    .then((result) => {
      return ssh.execShow(
        {},
        `zip -r ${dateStr}.zip ${dateStr}`,
        { cwd: configs.backupPath}
      )
    })
    .then((result) => {
      return ssh.execShow(
        {},
        `rm -rf ${dateStr}`,
        { cwd: configs.backupPath }
      )
    })
    .then((result) => {
      return ssh.execCommand(
        'ls',
        { cwd: configs.backupPath }
      )
    })
    .then((result) => {
      let backupList = result.stdout.split('\n')
      if (
        configs.backupMaxCount && 
        configs.backupMaxCount > 0 &&
        backupList.length > configs.backupMaxCount
      ) {
        return getOverList(backupList, configs)
      }
    })
    .then((rmList) => {
      if (rmList && rmList.length !== 0) {
        rmList.forEach((zipName) => {
          ssh.execCommand(
            `rm -rf ${zipName}`,
            { cwd: configs.backupPath}
          )
        })
      }
    })
    .catch((result) => {
      out.warning('备份异常')
    })
}

/**
 * 正在运行的文件夹重命名备份，解压缩新的包
 * @param {object} config 服务器配置对象
 * @returns {Promise}
 */
function remoteUnzip(configs) {
  out.info('正在进行部署...')
  return ssh.execShow(
    { stopProcess: false },
    `find ${configs.targetName}`,
    { cwd: configs.targetPath }
  )
    .then((result) => {
      if (!result.stderr) {
        return ssh.execShow(
          {},
          `mv ${configs.targetName} ${configs.targetName}_old_temp`,
          { cwd: configs.targetPath }
        )
      }
      return result
    })
    .then(() => {
      return ssh.execShow(
        {},
        `unzip ${configs.targetName}.zip`,
        { cwd: configs.targetPath }
      )
    })   
}

/**
 * 删除产生的全部临时文件 rm -rf是个危险的操作，
 * 所以只对产生的临时文件删除
 * @param {object} config 服务器配置对象
 * @param {string} tempZipPath 临时文件位置
 * @returns {Promise}
 */
function removeTemp(configs, tempZipPath) {
  out.info('正在删除相关临时文件...')
  return ssh.execCommand(
    `find ${configs.targetName}_old_temp`,
    { cwd: configs.targetPath }
  )
    .then((result) => {
      if (!result.stderr) {
        return ssh.execShow(
          {},
          `rm -rf ${configs.targetName}_old_temp`,
          { cwd: configs.targetPath }
        )
      }
      return result
    })
    .then((result) => {
      return ssh.execShow(
        { stopProcess: false },
        `find ${configs.targetName}.zip`,
        { cwd: configs.targetPath }
      )
    })
    .then((result) => {
      if (!result.stderr) {
        return ssh.execShow(
          {},
          `rm -rf ${configs.targetName}.zip`,
          { cwd: configs.targetPath }
        )
      }
      return result
    })
    .then((result) => {
      return new Promise((resolve, reject) => {
        fs.access(tempZipPath, fs.constants.F_OK, (err) => {
          if (!err) {
            resolve(err)
          }
          reject(err)
        })
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        fs.unlink(tempZipPath, (err) => {
          if(err) {
            out.error(err)
            reject(err)
          }
          resolve(tempZipPath)
        })
      })
    })
}

module.exports = function (options) {
  getConfig(options)
    .then((config) => {
      return Promise.all([configs, getPassword()])
    })
    .then((resultArr) => {
      configs = Object.assign(resultArr[0], resultArr[1])
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