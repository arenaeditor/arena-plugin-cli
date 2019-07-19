const {Command} = require('@oclif/command')
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
    // t.fs()
    t.headerDev()

    await ipc.connect()

    webpackCompiler.compile(
      this.compileSuccess.bind(this),
      this.compileWarning.bind(this),
      this.compileError.bind(this),
      this.compileProgress.bind(this),
      this.compileStart.bind(this),
      this.config.root
    )
  }

  compileStart() {
    t.headerDev()
    t.pbar().update(0)
  }

  compileProgress(percentage) {
    t.pbar().update(percentage)
  }

  compileSuccess(content) {
    t.headerDev()
    t.term.defaultColor('✌️\t').bgBrightGreen('编译成功\n')
    const err = ipc.sendData(content)
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
