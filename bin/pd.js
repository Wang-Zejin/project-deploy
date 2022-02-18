#!/usr/bin/env node
const program = require('commander')
console.log('pd')
program
  .version(`project-deploy ${require('../package.json').version}`)
  .usage('<command> [options] 快速部署项目')

// 部署
program
  .command('deploy')
  .description('根据mode，执行不同配置文件，部署项目到服务器')
  .option('-b, --backup', '对服务器中正在运行的项目进行备份')
  .option('-c, --custom', '手动输入服务器配置，进行部署，此时mode失效')
  .option('-m, --mode <mode>', '选择配置文件模式')
  .action((options) => {
    // console.log('mode', options)
    require('../command/deploy')(options)
  })

program
  .command('back')
  .description('选择服务器上的备份，并将项目切换到备份文件')
  .option('-l, --list', '只展示备份列表，不进行切换')
  .option('-c, --custom', '手动输入服务器配置，进行部署，此时mode失效')
  .option('-m, --mode <mode>', '选择配置文件模式')
  .action((options) => {
    require('../command/back')(options)
  })
  
// 查看信息
// program
//   .command('info <mode>')
//   .description('根据mode,执行不同配置文件，查看服务器项目信息')
//   .option('-b, --backup', '查看备份文件信息')
//   .action((mode, options) => {
//     require('../command/info')(mode, options)
//   })

program.parse(process.argv)