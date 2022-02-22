# project-deploy
For more convenient deployment of the project.

### 使用方法

>注：本插件只用于简化项目部署上传备份操作，需要提前配置好服务器

`npm install pd`

`pd deploy -m <mode>`

### 配置文件

> 配置文件需要放在项目根目录的project-deploy目录下，以`config.<mode>.js`命名
>
> 如果不需要分模式，则配置文件直接放在根目录下的`config.pd.js`中

例：

```javascript
// nginx配置为 root = /home/project/index
module.exports = {
  host: '121.x.xxx.xxx', // ip或域名
  port: xx,	//端口
  username: 'xxx',	// 登录用户名
  localPath: './dist',	// 将上传的本地目录的相对路径
  targetPath: '/home/project',	// 想要部署到的项目目标路径
  targetName: 'index',	// 目标路径下目录名
  backupPath: '/home/test/backup',	// 如需备份，则备份目录
  backupMaxCount: 5	// 留存最大备份数量，超过数量则将较为久远的备份删除
}
```

