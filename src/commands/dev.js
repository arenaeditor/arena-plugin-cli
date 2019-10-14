const {Command} = require('@oclif/command')
const path = require('path')
const writer = require('arena-file/writer')
const webpackCompiler = require('../webpack/compiler')
const ipc = require('../ipc')
const t = require('../ui')

class DevCommand extends Command {
  async run() {
    const initError = await webpackCompiler.init(process.cwd())
    if (initError) {
      this.error(initError)
      return
    }

    t.newPbar()
    t.headerDev()

    await ipc.connect()

    webpackCompiler.compile(
      this.compileSuccess.bind(this),
      this.compileWarning.bind(this),
      this.compileError.bind(this),
      this.compileProgress.bind(this),
      this.compileStart.bind(this),
      this.config.root,
    )
  }

  compileStart() {
    t.headerDev()
    t.pbar().update(0)
  }

  compileProgress(percentage) {
    t.pbar().update(percentage)
  }

  async compileSuccess(content, fileBuffer) {
    t.headerDev()
    t.term.defaultColor('✌️\t').bgBrightGreen('编译成功\n')

    const savePath = path.resolve(process.cwd(), `dev-image.arenap`)
    const w = new writer(savePath)
    w.setContentVersion('0.0.0')
    w.addContent(Buffer.from(JSON.stringify(content), 'utf-8'), 'content.json')
    w.addContent(fileBuffer.code, 'code.js')
    for (let index = 0; index < content.config.plugins.length; index += 1) {
      const p = content.config.plugins[index]
      p.icon && w.addFile(path.resolve(process.cwd(), p.icon), p.icon)
      p.thumb && w.addFile(path.resolve(process.cwd(), p.thumb), p.thumb)
    }
    content.config.thumb && w.addFile(path.resolve(process.cwd(), content.config.thumb), content.config.thumb)

    fileBuffer.styles.forEach(style => {
      w.addContent(style.style, style.name)
    })

    await w.write()

    const err = ipc.sendData(JSON.stringify({
      package: content.config.pluginId,
      image: savePath,
    }))
    if (err) this.compileError(err)
    else t.term.defaultColor('🚗\t').bgBrightGreen('已更新到 Arena')
  }

  compileWarning(content) {
    t.term.brightYellow(`Warning: ${content}\n`)
  }

  compileError(content) {
    t.term.defaultColor('❗️\t').bgBrightRed(content + '\t')
  }
}

DevCommand.description = `Develope your Arena plugins with hot reload.
Develope your Arena plugins with hot reload, run this command under your project folder.
Before you run this command, you need to:
1. Create plugin.json and plugin entry file,
\t you can also run <new> command to create a new plugin project.

2. Open Arena, and run this command,
\t once the plugin is ready, plugin button will appear at the top of the app.
`

module.exports = DevCommand
