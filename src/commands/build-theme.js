const {Command} = require('@oclif/command')
const t = require('../ui')
const fs = require('fs')
const path = require('path')
const Writer = require('arena-file/writer')
const MemoryFS = require('memory-fs')
const webpack = require('webpack')
const webpackConfig = require('../webpack/dist.config')

const memfs = new MemoryFS()

class BuildThemeCommand extends Command {
  async run() {
    const pluginJsonPath = path.resolve(process.cwd(), 'plugin.json')
    if (fs.existsSync(pluginJsonPath)) {
      const content = require(pluginJsonPath)
      if (content.theme) {
        const list = Object.entries(content.theme).map(([id, config]) => {
          const jsonFile = config.json ? path.resolve(process.cwd(), config.json) : ''
          const styleFile = config.style ? path.resolve(process.cwd(), config.style) : ''
          const thumb = config.thumb ? path.resolve(process.cwd(), config.thumb) : ''
          const contentJson = {
            id,
            target: content.pluginId,
            useValue: jsonFile ? fs.existsSync(jsonFile) : false,
            useStyle: styleFile ? fs.existsSync(styleFile) : false,
            thumb: thumb ? fs.existsSync(thumb) : thumb,
            config,
          }

          return {
            jsonFile,
            styleFile,
            thumb,
            contentJson,
            version: config.version || content.version,
          }
        })

        list.forEach(theme => this.buildThemeFile(theme))
      }
    } else {
      t.term.defaultColor('没有找到 plugin.json 文件😯')
    }
  }

  async buildThemeFile(config) {
    t.term(`正在为 ${config.contentJson.target} 构建主题 ${config.contentJson.id} (${config.version})\n`)
    const writer = new Writer(path.resolve(process.cwd(), `${config.contentJson.target}-${config.contentJson.id}.apt`))
    writer.setContentVersion(config.version)
    if (config.styleFile) {
      const styleBuffer = await this.bundleStyles(config.contentJson.id, config.styleFile, config.contentJson.target)
      writer.addContent(styleBuffer, 'style.css', false)
    }

    if (config.jsonFile) {
      writer.addFile(config.jsonFile, 'value.json', false)
    }

    if (config.thumb) {
      writer.addFile(config.thumb)
    }

    writer.addContent(Buffer.from(JSON.stringify(config.contentJson)), 'content.json', false)
    writer.write()
  }

  async bundleStyles(name, filename, id) {
    return new Promise((resolve, reject) => {
      const compiler = webpack(webpackConfig(
        {
          id,
          dist: '/',
          extendedEntries: {[name]: filename},
        },
        this.config.root,
        true,
      ))

      compiler.outputFileSystem = memfs
      const close = compiler.watch({}, (err, stats) => {
        if (err) {
          return reject(err.details)
        }

        if (stats.hasErrors()) {
          return reject(stats.toJson().errors)
        }

        close.close(() => {
          resolve(memfs.readFileSync(`/${name}_style.css`))
        })
      })
    })
  }
}

BuildThemeCommand.description = `Building apt files from themes section
...
Build all available theme from themes section in plugin.json
`
module.exports = BuildThemeCommand
