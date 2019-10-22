const { Command } = require('@oclif/command')
const { cli } = require('cli-ux')
const crypto = require('crypto')
const os = require('os')
const fs = require('fs')
const path = require('path')

const { exec } = require('child_process');
const TEMPLATE_URL = 'https://github.com/arenaeditor/arena-plugin-template.git'

const pluginJsonTemplate = {
  name: '',
  pluginId: '',
  author: '',
  description: '',
  version: '',
}

const answers = [
  {
    q: '✨  插件名称',
    key: 'name',
    default: () => '',
    required: true,
  },
  {
    q: '🗒   插件描述',
    key: 'description',
    default: ctx => `Plugin ${ctx.name} for Arena`,
  },
  {
    q: '📚  插件包名',
    key: 'pluginId',
    default: (ctx, config) => {
      return crypto
      .createHash('md5')
      .update(config.root)
      .digest('hex')
    },
    required: true,
  },
  {
    q: '📌  插件作者',
    key: 'author',
    default: () => os.userInfo().username,
  },
  {
    q: '🛠   插件版本',
    key: 'version',
    default: () => '0.0.1',
  },
]

class InitCommand extends Command {
  static args = [
    { name: 'dirName' },
  ]
  async run() {
    const { argv } = this.parse(InitCommand);
    if (!argv[0]) {
      this.warn(new Error('require dir name!'));
      this.exit();
    }
    for (let ai = 0; ai < answers.length; ai++) {
      const ans = answers[ai];
      const df = ans.default(pluginJsonTemplate, this.config);
      // eslint-disable-next-line no-await-in-loop
      const r = await cli.prompt(ans.q, {
        default: df, 
        required: ans.required || false
      })
      pluginJsonTemplate[ans.key] = r || df
    }

     // git命令，远程拉取项目并自定义项目名
    let cmdStr = `git clone ${TEMPLATE_URL} ${argv[0]}`;
    cli.action.start('🔍 正在获取模版');

    // 在nodejs中执行shell命令，第一个参数是命令，第二个是具体的回调函数
    exec(cmdStr, (error, stdout, stderr) => {
      if (error) {
        this.warn(new Error(error));
        this.exit();
      }
      const base = path.resolve(process.cwd(), argv[0]);
      const configFile = path.resolve(base, 'plugin.json');

      let temp = fs.readFileSync(configFile);
      temp = JSON.parse(temp);
      Object.keys(pluginJsonTemplate).forEach(key => {
        temp[key] = pluginJsonTemplate[key];
      });

      fs.writeFileSync(configFile, JSON.stringify(temp, null, 2));
      cli.action.stop(`🎉  Successfully created project ${argv[0]}`);
    });
  }
}

InitCommand.description = `Create a empty Arena plugin project
Create an new empty Arena plugin project in current directory
`
module.exports = InitCommand
