const {Command, flags} = require('@oclif/command')
const writer = require('arena-file/writer')
const webpackCompiler = require('../webpack/compiler')
const t = require('../ui')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const request = require('request')
const semver = require('semver')
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb2MiOiI1ZDY0OWY0YmRlZGM0ZTMyY2Y1NDU4NjYiLCJ1biI6Imhld2VubGkiLCJlbWFpbCI6Imhld2VubGlAMzYwLmNuIiwibmlja25hbWUiOiLkvZXmloflipsiLCJwZXJtcyI6WyJVU0VSIl0sImlzQWRtaW4iOmZhbHNlLCJhZG1pbiI6e30sImlhdCI6MTU3MjMyMDg5MiwiZXhwIjoxNTcyOTI1NjkyLCJpc3MiOiJBUkVOQV9URVNUIn0.0pBfVkcEm__DRU_Qc7PxwlifksgnjFJJlgBi0t_NbIM'

class BuildCommand extends Command {
  async run() {
    const initError = await webpackCompiler.init(process.cwd())
    if (initError) {
      this.error(initError)
      return
    }

    t.newPbar()
    t.headerDev()

    webpackCompiler.compile(
      this.compileSuccess.bind(this),
      this.compileWarning.bind(this),
      this.compileError.bind(this),
      this.compileProgress.bind(this),
      this.compileStart.bind(this),
      this.config.root,
      true,
    )
  }

  compileStart() {
    t.headerDev()
    t.pbar().update(0)
  }

  compileProgress(percentage) {
    t.pbar().update(percentage)
  }

  compileSuccess(content, fileBuffer) {
    const {flags} = this.parse(BuildCommand)

    t.headerDev()
    t.term.defaultColor('✌️\t').bgBrightGreen('打包完成\n')
    webpackCompiler.stop()

    // version increment
    const prevSavedPath = path.resolve(process.cwd(), `${webpackCompiler.id}${webpackCompiler.pjson.version ? '-' + webpackCompiler.pjson.version : ''}.arenap`)
    if (fs.existsSync(prevSavedPath) && flags.delete) {
      fs.unlinkSync(prevSavedPath)
    }

    if (content.config.version) {
      // content.config.version = semver.inc(content.config.version, flags.bump)
      const pluginJson = path.resolve(process.cwd(), 'plugin.json')
      const jsonOnDisk = fs.readFileSync(pluginJson, {encoding: 'utf8'})
      const jsonContent = JSON.parse(jsonOnDisk)
      jsonContent.version = content.config.version
      fs.writeFileSync(pluginJson, JSON.stringify(jsonContent, null, 2))
    }

    // compress
    const contentBuffer = Buffer.from(JSON.stringify(content), 'utf8')
    // const compressedBuffer = zlib.deflateSync(contentBuffer)
    const savePath = path.resolve(process.cwd(), `${webpackCompiler.id}${content.config.version ? '-' + content.config.version : ''}.arenap`)

    const w = new writer(savePath)
    w.setContentVersion(content.config.version || '0.0.0')
    w.addContent(contentBuffer, 'content.json', true)
    w.addContent(fileBuffer.code, 'code.js', true)
    for (let index = 0; index < content.config.plugins.length; index += 1) {
      const p = content.config.plugins[index]
      p.icon && w.addFile(path.resolve(process.cwd(), p.icon), p.icon, false)
      p.thumb && w.addFile(path.resolve(process.cwd(), p.thumb), p.thumb, false)
    }
    content.config.thumb && w.addFile(path.resolve(process.cwd(), content.config.thumb), content.config.thumb, false)

    // add style
    fileBuffer.styles.forEach(style => {
      w.addContent(style.style, style.name)
    })

    w.write().then(() => {
      if (flags.publish) {
        t.term.defaultColor('正在发布插件')
        this.uploadPlugin(savePath, content.config)
      }
    })

    // fs.writeFileSync(savePath, compressedBuffer)
  }

  /**
   * 上传本地打包好的文件
   * @param filePath
   * @param config
   */
  uploadPlugin(filePath, config) {
    request({
      headers: {
        'Access-Token': userToken,
      },
      formData: {
        file: fs.createReadStream(filePath),
        id: config.pluginId,
        version: config.version,
      },
      method: 'POST',
      url: 'http://arena.qiwoo.org/api/license/publish',
    })
  }

  compileWarning(content) {
    t.term.brightYellow(`Warning: ${content}\n`)
  }

  compileError(content) {
    t.term.defaultColor('❗️\t').bgBrightRed(content + '\t')
  }
}

BuildCommand.description = `Build production plugin
...
Build production Arena plugin
`

BuildCommand.flags = {
  bump: flags.string({
    char: 'b',
    default: 'patch',
    description: 'Auto versioning',
    options: ['patch', 'minor', 'major'],
  }),
  delete: flags.boolean({
    char: 'd',
    description: 'Delete old version',
  }),
  publish: flags.boolean({
    char: 'p',
    description: 'Publish to Arena Market',
    default: false,
  }),
}

module.exports = BuildCommand
