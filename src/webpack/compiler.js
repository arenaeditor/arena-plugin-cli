const webpack = require('webpack')
const webpackConfig = require('./dist.config')
const WebpackProgressPlugin = require('webpack/lib/ProgressPlugin')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const MemoryFS = require('memory-fs')

const memfs = new MemoryFS()

class ArenaPluginCompiler {
  constructor() {
    this.compiler = null
    this.projectId = ''
    this.pluginJsonPath = ''
    this.pluginJson = {}
    this.pluginEntry = ''
    this.pluginOutput = ''
  }

  init(projectPath) {
    this.projectId = crypto
    .createHash('md5')
    .update(projectPath)
    .digest('hex')

    this.pluginJsonPath = path.resolve(projectPath, 'plugin.json')
    if (!fs.existsSync(this.pluginJsonPath)) {
      return '插件配置不存在 (plugin.json)'
    }

    try {
      this.pluginJson = JSON.parse(
        fs.readFileSync(this.pluginJsonPath, {encoding: 'utf8'})
      )
    } catch (error) {
      return '无法读取插件配置 (plugin.json): ' + error.message
    }

    this.pluginEntry = path.resolve(projectPath, this.pluginJson.main)
    if (!fs.existsSync(this.pluginEntry)) {
      return '无法读取 plugin.json 指定的入口文件 ->' + this.pluginEntry
    }

    this.pluginOutput = `/plugin-${this.projectId}.js`
    global._pid = this.projectId
    global._name = this.pluginJson.name

    return false
  }

  compile(successCallback, warningCallback, errorCallback, progressCallback, beforeCallback, root) {
    this.compiler = webpack(
      webpackConfig({
        entry: this.pluginEntry,
        id: this.projectId,
        dist: '/',
      }, root)
    )
    this.compiler.outputFileSystem = memfs
    this.compiler.apply(new WebpackProgressPlugin(percentage => {
      progressCallback(percentage)
    }))

    this.compiler.hooks.beforeCompile.tap('plugin', () => {
      beforeCallback()
    })

    this.compiler.watch({}, (err, stats) => {
      if (err) {
        if (err.details) {
          errorCallback(err.details)
        }

        return
      }

      if (stats.hasErrors()) {
        errorCallback(stats.toJson().errors)
      }

      // if (stats.hasWarnings()) {
      //   warningCallback(stats.toJson().warnings)
      // }

      const content = memfs.readFileSync(this.pluginOutput, 'utf-8')
      const plugin = {
        code: content,
        id: this.projectId,
        config: this.pluginJson,
        type: 'dev',
      }
      successCallback(JSON.stringify(plugin))
    })
  }

  get id() {
    return this.projectId
  }
}

module.exports = new ArenaPluginCompiler()
