const ora = require('ora');
const fs = require('fs-extra');
const api = require('./api');
const inquirer = require('inquirer');
const util = require('util');
const downloadGitRepo = require('download-git-repo');
const chalk = require('chalk');

class Creator {
  /**
   * @param {string} projectName 项目名称
   * @param {string} target 项目保存路径
   */
  constructor(projectName, target) {
    this.projectName = projectName;
    this.target = target;

    // download-git-repo 不支持 promise，要先将其 promise 化
    this.downloadGitRepo = util.promisify(downloadGitRepo);
  }
  /**
   * @description 创建项目
   */
  async create() {
    const repo = await this.getRepoInfo();
    const tag = await this.getTagInfo(repo);

    await this.download(repo, tag);

    // 输出使用说明
    console.log(
      `\n\tSuccessfully created project ${chalk.cyan(this.projectName)}`
    );
    console.log(`\n\tcd ${this.projectName}`);
    console.log(`\tpnpm i`);
    console.log(`\tpnpm run serve`);
  }

  /**
   * @description 睡眠一会儿
   * @param {number} timeout 睡眠时间
   */
  sleep(timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }

  /**
   * @description 封装 ora 实现 loading 效果
   * @param {string} message loading 的消息
   * @param {Function} fn loading 要执行的函数
   * @param  {...any} args fn 的参数
   */
  async loading(message, fn, ...args) {
    const spinner = ora(message);
    spinner.start();

    try {
      let res = await fn(...args);
      spinner.succeed();

      return res;
    } catch (e) {
      spinner.fail('request failed');
      console.log(chalk.red(e.response.data.message));
      // 睡眠 1 秒再去重新请求 避免频繁请求
      await this.sleep(1000);

      // 重新请求
      spinner.start('refetching...');
      return this.loading(message, fn, ...args);
    }
  }

  /**
   * @description 获取模板信息并获取用户选择的模板
   */
  async getRepoInfo() {
    // 获取仓库信息
    const repoList = await this.loading(
      'fetching repo info...',
      api.getZhuRongRepo
    );

    // 提取仓库名
    const repoNameList = repoList.map((item) => item.name);

    // 选取模板信息
    let { repo } = await inquirer.prompt([
      {
        name: 'repo',
        type: 'list',
        message: 'Please choose a template',
        choices: repoNameList,
      },
    ]);

    return repo;
  }

  /**
   * @description 获取仓库的版本 tag 并获取用户选择的版本
   * @param {string} repo 仓库名称
   */
  async getTagInfo(repo) {
    const tagList = await this.loading(
      `fetching ${repo} tag info...`,
      api.getTagsByRepo,
      repo
    );
    const tagNameList = tagList.map((item) => item.name);

    let { tag } = inquirer.prompt([
      {
        name: 'tag',
        type: 'list',
        message: 'Please choose a version',
        choices: tagNameList,
      },
    ]);

    return tag;
  }

  /**
   * @description 拉取仓库
   * @param {string} repo 仓库名称
   * @param {string} tag 仓库 tag
   */
  async download(repo, tag) {
    // 拼接模板下载地址
    const templateUrl = `zhurong-cli/${repo}${tag ? '#' + tag : ''}`;

    // 调用 downloadGitRepo 下载模板到指定目录
    await this.loading(
      'downloading template, please wait...',
      this.downloadGitRepo,
      templateUrl,
      this.target
    );
  }
}

module.exports = Creator;
