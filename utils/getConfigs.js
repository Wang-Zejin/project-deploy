const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')
const out = require('./out')
module.exports.getConfigs = function (options) {
  const prompts = [
    {
      type: 'input', 
      name: 'host',
      message: '请输入域名或ip：'
    },
    {
      type: 'input', 
      name: 'port',
      message: '请输入端口号：'
    },
    {
      type: 'input', 
      name: 'username',
      message: '请输入用户名：'
    },
    {
      type: 'input', 
      name: 'localPath',
      message: '请输入将要部署的本地文件夹的相对项目根目录的相对路径：'
    },
    {
      type: 'input', 
      name: 'targetPath',
      message: '请输入服务器部署目标路径：'
    },
    {
      type: 'input', 
      name: 'targetName',
      message: '请输入服务器部署目标文件夹名称：'
    },
    {
      type: 'input', 
      name: 'backupPath',
      message: '请输入备份文件路径：',
      when: () => options.backup
    },
    {
      type: 'number', 
      name: 'backupCount',
      message: '请输入留存最大备份数量：',
      when: () => options.backup
    },
    {
      type: 'confirm',
      name: 'save',
      message: '是否保存当前配置?',
    },
    {
      type: 'text', 
      name: 'modeName',
      message: '请输入当前配置mode：',
      when: (answers) => answers.save
    }
  ]
  return inquirer.prompt(prompts)
    .then((answers) => {
      if (answers.save){
        // 保存配置文件到文件夹
        console.log(answers)
        fs.appendFile(
          path.resolve(process.cwd(), `./project-deploy/config.${answers.modeName}.js`),
          `module.exports = {\n  host: '${answers.host}',\n  port: ${answers.port},\n  username: '${answers.username}',\n  localPath: '${answers.localPath}',\n  targetPath: '${answers.targetPath}',\n  targetName: '${answers.targetName}',\n  backupPath: '${answers.backupPath || ""}',\n  backupMaxCount: ${answers.backupMaxCount || 5}\n}`,
          (err) => {
            if (err) {
              out.error(err)
            }
          }
        )
      }
      const { save, modeName, ...configs} = answers
      return configs
    })
}

module.exports.getPassword = function () {
  return inquirer.prompt({
    type: 'password',
    name: 'password',
    message: '请输入密码'
  })
}
