const inquirer = require('inquirer')

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
