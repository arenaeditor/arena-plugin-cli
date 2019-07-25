const {Command} = require('@oclif/command')
const path = require('path')
const t = require('../ui')
const ipc = require('../ipc')
const fs = require('fs')
const zlib = require('zlib')

class InstallCommand extends Command {
  async run() {
    const {args} = this.parse(InstallCommand)
    const filePath = path.resolve(process.cwd(), args.apfn.file)
    if (args.apfn.ext !== '.arenap') {
      this.error('不是一个插件文件')
      return
    }

    if (!fs.existsSync(filePath)) {
      this.error('文件不存在')
      return
    }

    await ipc.connect()

    const content = fs.readFileSync(filePath)
    const decompressedContent = zlib.inflateSync(content).toString('utf8')
    ipc.sendData(decompressedContent)

    t.term.defaultColor('✌️\t').bgBrightGreen('安装成功\n')
    ipc.disconnect()
  }

  error(content) {
    t.term.defaultColor('❗️\t').bgBrightRed(content)
  }
}

InstallCommand.description = `Install a plugin to Arena Editor
...
Install a .arenap to Arena Editor
`

InstallCommand.args = [{
  name: 'apfn',
  required: true,
  description: 'The plugin file you want to install',
  parse: input => {
    return {
      file: input,
      ext: path.extname(input),
    }
  },
}]

module.exports = InstallCommand
