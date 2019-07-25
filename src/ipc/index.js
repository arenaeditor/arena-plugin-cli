const ipc = require('node-ipc')
const fs = require('fs')
// const unixSocketPath = '/tmp/cn.360.arena.plugin'
const connectionId = 'ArenaPluginSocketService'
const universalTCPPort = 9999
ipc.config.encoding = 'utf8'
ipc.config.silent = true
ipc.config.id = Math.random().toString(36).slice(2)

class ArenaPluginIPCClient {
  constructor() {
    this.ipc = null
    this.resolved = false
  }

  async connect() {
    // if (!fs.existsSync(unixSocketPath)) {
    //   return '插件宿主不存在，请先启动 Arena'
    // }
    return new Promise(resolve => {
      ipc.connectToNet(connectionId, undefined, universalTCPPort, () => {
        resolve()
      })
    })
  }

  disconnect() {
    ipc.disconnect(connectionId)
  }

  sendData(data) {
    const server = ipc.of[connectionId]
    if (server) server.emit('data', data)
    else return 'Arena 未启动，更新插件失败'
  }

  get id() {
    return ipc.config.id
  }
}

module.exports = new ArenaPluginIPCClient()
