const inquirer = require('inquirer')
module.exports = function (options) {
  return inquirer.prompt([{
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
    type: 'password', 
    name: 'password',
    message: '请输入密码：'
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
  }]).then((answer) => {
    if (options.backup) {
      return inquirer.prompt([{
        type: 'input', 
        name: 'backupPath',
        message: '请输入备份文件路径：'
      },
      {
        type: 'number', 
        name: 'backupCount',
        message: '请输入留存最大备份数量：'
      }]).then((backupanswer) => {
        return Object.assign(answer, backupanswer)
      })
    } else {
      return answer
    }
  })
}