const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const Creator = require('./Creator');

module.exports = async function (projectName, options) {
  // 1. 获取当前工作目录
  const cwd = process.cwd();
  // 2. 拼接出项目目录
  const targetDirectory = path.join(cwd, projectName);
  const creator = new Creator(projectName, targetDirectory);
  // 3. 判断项目是否存在
  if (fs.existsSync(targetDirectory)) {
    // 3.1 判断是否使用了 --force 参数
    if (options.force) {
      // 3.1.1 使用了 --force 参数 删除同名目录 -- remove 是异步函数 等待其执行完毕
      await fs.remove(targetDirectory);
      creator.create();
    } else {
      // 3.1.2 未使用 --force 参数 开启交互式命令窗口询问用户是否需要删除同名目录
      const { isOverwrite } = await inquirer.prompt([
        {
          name: 'isOverwrite', // 作为返回值的 key
          type: 'list',
          message:
            'Target directory exists, please choose whether to overwrite it.',
          choices: [
            { name: 'overwrite', value: true },
            { name: 'cancel', value: false },
          ],
        },
      ]);

      if (isOverwrite) {
        // 3.1.2.1 覆盖
        const loading = ora(chalk.red('removing')).start();

        await fs.remove(targetDirectory);
        loading.succeed(`${targetDirectory} removed`);

        creator.create();
      } else {
        // 3.1.2.2 取消覆盖
        console.log(chalk.cyan('cancel'));
      }
    }
  } else {
    // 4. 创建项目
    creator.create();
  }
};
