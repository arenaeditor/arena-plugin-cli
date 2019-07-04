const {Command} = require('@oclif/command')
const {cli} = require('cli-ux')
const ipc = require('node-ipc')
const unixSocketPath = '/tmp/cn.360.arena.plugin'

ipc.config.encoding = 'utf8'
ipc.config.id = 'ArenaPluginSocketService'
ipc.config.silent = true

class SelfhostCommand extends Command {
  async run() {
    cli.action.start('Starting socket server...')
    ipc.serve(unixSocketPath, this.started.bind(this))
    ipc.server.start()
    ipc.server.on('data', this.data.bind(this))
  }

  started() {
    cli.action.stop('Success')
    cli.info('Listening...')
  }

  data(data) {
    this.log('receive', data)
  }
}

SelfhostCommand.description = `Self hosting unix socket port for testing only
`

module.exports = SelfhostCommand
