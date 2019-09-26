const {Command} = require('@oclif/command')
const t = require('../ui')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Sharp = require('sharp')

const v1struct = {
  VERSION: 2,
  CLEN: 4,
  CSUM: 32,
}

class BuildThemeCommand extends Command {
  async run() {
    const pluginJsonPath = path.resolve(process.cwd(), 'plugin.json')
    let themeFileList = []
    if (fs.existsSync(pluginJsonPath)) {
      const jsonStr = fs.readFileSync(pluginJsonPath)
      const json = JSON.parse(jsonStr)

      themeFileList = json.theme && Object.entries(json.theme).map(([name, fn]) => {
        return {
          name,
          from: path.resolve(process.cwd(), fn),
          to: path.resolve(process.cwd(), `${json.pluginId}-${name}.apt`),
        }
      })

      this.buildThemeFiles(themeFileList, json)
    }
  }

  buildThemeFiles(list, json) {
    for (let index = 0; index < list.length; index++) {
      this.buildThemeFile(list[index], json)
    }
  }

  async buildThemeFile(config, json) {
    t.term(`Building file ${config.from}`)
    const fVersionBuffer = Buffer.alloc(v1struct.VERSION)
    const fCLENBuffer = Buffer.alloc(v1struct.CLEN)
    const fCSUMBuffer = Buffer.alloc(v1struct.CSUM)

    const themeContent = fs.readFileSync(config.from, {encoding: 'utf8'})
    const themeJson = JSON.parse(themeContent)

    themeJson.targetPlugin = json.pluginId
    themeJson.name = config.name

    const themeConfig = {
      content: themeJson,
      res: {},
    }

    let range = 0
    const thumbBuffers = []
    for (const [varient, config] of Object.entries(themeJson.varients)) {
      const thumbBuffer = await this.processImage(config.thumb)
      themeConfig.res[varient] = {
        name: varient,
        from: range,
        size: thumbBuffer.length,
      }

      thumbBuffers.push(thumbBuffer)
      range += thumbBuffer.length
    }

    const pluginThumbPath = path.resolve(process.cwd(), themeJson.thumb)
    if (themeJson.thumb && fs.existsSync(pluginThumbPath)) {
      const thumbBuffer = await this.processImage(pluginThumbPath)

      themeConfig.res.plugin_thumb = {
        name: 'plugin_thumb',
        from: range,
        size: thumbBuffer.length,
      }

      thumbBuffers.push(thumbBuffer)
    }

    const themeContentBuffer = Buffer.from(JSON.stringify(themeConfig), 'utf8')

    const md5 = crypto.createHash('md5').update(themeContentBuffer).digest('hex')

    fVersionBuffer.writeInt16BE(1)
    fCLENBuffer.writeInt32BE(themeContentBuffer.length)
    fCSUMBuffer.write(md5)

    const f = fs.createWriteStream(config.to)

    f.write(fVersionBuffer)
    f.write(fCLENBuffer)
    f.write(fCSUMBuffer)
    f.write(themeContentBuffer)

    thumbBuffers.forEach(buffer => f.write(buffer))
    f.end()
    f.close()
  }

  async processImage(fn) {
    const sharp = new Sharp(path.resolve(process.cwd(), fn))
    return sharp.png({quality: 85}).toBuffer()
  }
}

BuildThemeCommand.description = `Building apt files from themes section
...
Build all available theme from themes section in plugin.json
`
module.exports = BuildThemeCommand
