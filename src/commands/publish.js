const {Command, flags} = require('@oclif/command')
const path = require('path')
const fs = require('fs')
const t = require('../ui')
const request = require('request-promise-native')

class PublishCommand extends Command {
  async run() {
    const pluginJsonPath = path.resolve(process.cwd(), 'plugin.json');
    t.headerDev()
    if (!fs.existsSync(pluginJsonPath)) {
      t.term.defaultColor('找不到 plugin.json')
    }

    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, {encoding: 'utf8'}))
    const pluginFile = path.resolve(process.cwd(), `${pluginJson.pluginId}-${pluginJson.version}.arenap`)
    await request({
      url: 'http://arena.qiwoo.org/api/plugins/upload',
      formData: {
        file: fs.createReadStream(pluginFile),
      },
      method: 'POST',
    })
  }
}

PublishCommand.description = `Describe the command here
...
Extra documentation goes here
`

PublishCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = PublishCommand
