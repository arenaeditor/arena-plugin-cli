const {Command} = require('@oclif/command')
const {cli} = require('cli-ux')
const crypto = require('crypto')
const os = require('os')
const fs = require('fs')
const path = require('path')

const pluginJsonTemplate = {
  name: '',
  pluginId: '',
  author: '',
  description: '',
  version: '',
  main: 'app/index.js',
  props: [],
}

const answers = [
  {
    q: '插件名称',
    key: 'name',
    default: () => '',
    required: true,
  },
  {
    q: '插件描述',
    key: 'description',
    default: ctx => `Plugin ${ctx.name} for Arena`,
  },
  {
    q: '插件包名',
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
    q: '插件作者',
    key: 'author',
    default: () => os.userInfo().username,
  },
  {
    q: '插件版本',
    key: 'version',
    default: () => '0.0.1',
  },
]

const indexJs = `
export default class MyPlugin extends ArenaPluginCanvas {
  constructor(...args) {
    super(...args)
  }

  /**
   * Plugin loaded
   */
  onMounted() {
  }

  /**
   * Plugin prop will update
   * @param {string} target Which prop will be updated
   * @param {any} oldValue Old value
   * @param {any} newValue New value
   */
  propWillUpdate(target, oldValue, newValue) {
  }

  /**
   * Plugin resize end, this event will be call
   * during editing most of the time
   */
  onResizeEnd() {
  }

  /**
   * Unloading plugin
   */
  onDestroy() {
  }
}
`

class InitCommand extends Command {
  async run() {
    for (let ai = 0; ai < answers.length; ai++) {
      const ans = answers[ai]
      const df = ans.default(pluginJsonTemplate, this.config)
      // eslint-disable-next-line no-await-in-loop
      const r = await cli.prompt(ans.q, {default: df, required: ans.required || false})
      pluginJsonTemplate[ans.key] = r || df
    }

    const base = path.resolve(process.cwd())
    const mainFolder = path.resolve(base, 'app')
    const entryFile = path.resolve(mainFolder, 'index.js')
    const configFile = path.resolve(base, 'plugin.json')

    // create folder
    if (!fs.existsSync(mainFolder)) {
      fs.mkdir(mainFolder)
    }

    if (!fs.existsSync(entryFile)) {
      fs.writeFileSync(entryFile, indexJs, {encoding: 'utf8'})
    }

    if (!fs.existsSync(configFile)) {
      fs.writeFileSync(configFile, JSON.stringify(pluginJsonTemplate, null, 2))
    }
  }
}

InitCommand.description = `Create a empty Arena plugin project
Create an new empty Arena plugin project in current directory
`
module.exports = InitCommand
