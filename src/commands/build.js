const {Command} = require('@oclif/command')
const webpackCompiler = require('../webpack/compiler')
const t = require('../ui')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

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
    t.term.defaultColor('✌️\t').bgBrightGreen('打包完成\n')
    webpackCompiler.stop()

    // compress
    const contentBuffer = Buffer.from(content, 'utf8')
    const compressedBuffer = zlib.deflateSync(contentBuffer)
    const savePath = path.resolve(process.cwd(), `${webpackCompiler.id}${webpackCompiler.pjson.version ? '-' + webpackCompiler.pjson.version : ''}.arenap`);
    fs.writeFileSync(savePath, compressedBuffer)
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

module.exports = BuildCommand
