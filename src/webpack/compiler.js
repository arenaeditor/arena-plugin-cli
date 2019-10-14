const webpack = require('webpack')
const webpackConfig = require('./dist.config')
const WebpackProgressPlugin = require('webpack/lib/ProgressPlugin')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const MemoryFS = require('memory-fs')
const pkg = require('../../package.json')
const Sharp = require('sharp')

const memfs = new MemoryFS()
const supportedIconExtension = ['.png', '.jpg', '.jpeg']

class ArenaPluginCompiler {
  constructor() {
    this.compiler = null
    this.projectId = ''
    this.projectPath = ''
    this.pluginJsonPath = ''
    this.pluginJson = {}
    this.pluginEntry = ''
    this.pluginOutput = ''
    this.varientConfig = {}
    this.styleEntries = {}
  }

  async init(projectPath) {
    this.projectPath = projectPath

    this.pluginJsonPath = path.resolve(projectPath, 'plugin.json')
    if (!fs.existsSync(this.pluginJsonPath)) {
      return '插件配置不存在 (plugin.json)'
    }

    try {
      this.pluginJson = JSON.parse(
        fs.readFileSync(this.pluginJsonPath, {encoding: 'utf8'}),
      )
    } catch (error) {
      return '无法读取插件配置 (plugin.json): ' + error.message
    }

    this.pluginEntry = path.resolve(projectPath, this.pluginJson.main)
    if (!fs.existsSync(this.pluginEntry)) {
      return '无法读取 plugin.json 指定的入口文件 ->' + this.pluginEntry
    }

    if (this.pluginJson.icon) {
      const iconPath = path.resolve(projectPath, this.pluginJson.icon)
      const ext = path.extname(iconPath)
      if (fs.existsSync(iconPath) && supportedIconExtension.includes(ext)) {
        const sharp = new Sharp(iconPath)
        const buffer = await sharp
          .resize({width: 64, height: 64, fit: 'cover'})
          .png({quality: 85})
          .toBuffer()

        this.pluginJson.icon = `data:image/png;base64,${buffer.toString('base64')}`
      }
    }

    // for (let index = 0; index < this.pluginJson.plugins.length; index += 1) {
    //   const pluginIcon = this.pluginJson.plugins[index].icon
    //   if (pluginIcon) {
    //     const iconPath = path.resolve(projectPath, pluginIcon)
    //     const ext = path.extname(iconPath)
    //     if (fs.existsSync(iconPath) && supportedIconExtension.includes(ext)) {
    //       const sharp = new Sharp(iconPath)
    //       const buffer = await sharp
    //         .resize({width: 64, height: 64, fit: 'cover'})
    //         .png({quality: 85})
    //         .toBuffer()
    //       this.pluginJson.plugins[index].icon = `data:image/png;base64,${buffer.toString('base64')}`;
    //     }
    //   }
    //   const pluginThumb = this.pluginJson.plugins[index].thumb
    //   if (pluginThumb) {
    //     const thumbPath = path.resolve(projectPath, pluginThumb)
    //     const ext = path.extname(thumbPath)
    //     if (fs.existsSync(thumbPath) && supportedIconExtension.includes(ext)) {
    //       const sharp = new Sharp(thumbPath)
    //       const buffer = await sharp
    //         .png({quality: 85})
    //         .toBuffer()
    //
    //       this.pluginJson.plugins[index].thumb = `data:image/png;base64,${buffer.toString('base64')}`;
    //     }
    //   }
    // }

    this.projectId = this.pluginJson.pluginId || crypto
      .createHash('md5')
      .update(projectPath)
      .digest('hex')

    this.pluginJson.plugins = this.pluginJson.plugins.reduce(
      (result, plugin) => {
        const configFile = path.resolve(
          projectPath,
          'config',
          `${plugin.config || plugin.export}.json`,
        )

        const configFileExists = fs.existsSync(configFile)

        const data = {...plugin}

        if (configFileExists) {
          const content = fs.readFileSync(configFile, {encoding: 'utf8'})
          try {
            data.config = JSON.parse(content)
          } catch (error) {
            data.config = {}
          }
        }

        result.push(data)
        return result
      },
      [],
    )

    this.pluginOutput = `/plugin-${this.projectId}.compiled`
    global._pid = this.projectId
    global._name = this.pluginJson.name

    return false
  }

  getStyleEntries() {
    return this.pluginJson.plugins.reduce((result, plugin) => {
      const stylePath = path.resolve(
        this.projectPath,
        'style',
        `${plugin.export}.scss`,
      )

      const styleExists = fs.existsSync(stylePath)

      if (styleExists) {
        result[plugin.export] = stylePath
      }
      return result
    }, {})
  }

  compile(
    successCallback,
    warningCallback,
    errorCallback,
    progressCallback,
    beforeCallback,
    root,
    prod = false,
  ) {
    this.styleEntries = this.getStyleEntries()

    this.compiler = webpack(
      webpackConfig(
        {
          entry: this.pluginEntry,
          id: this.projectId,
          dist: '/',
          extendedEntries: {...this.styleEntries},
        },
        root,
        prod,
      ),
    )
    this.compiler.outputFileSystem = memfs
    this.compiler.apply(
      new WebpackProgressPlugin(percentage => {
        progressCallback(percentage)
      }),
    )

    this.compiler.hooks.beforeCompile.tap('plugin', () => {
      beforeCallback()
    })

    this.compiler.hooks.beforeCompile.tap('default', () => {
      beforeCallback()
    })

    this.close = this.compiler.watch({}, (err, stats) => {
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

      // 插件JS
      const content = memfs.readFileSync(this.pluginOutput, 'utf-8')

      // 样式
      const styleContent = Object.entries(this.styleEntries).map(
        ([key]) => {
          const file = `/${key}_style.css`
          const exists = memfs.existsSync(file)
          const data = {
            varient: key,
            style: '',
            name: `${key}.css`,
          }

          if (exists) {
            data.style = Buffer.from(memfs.readFileSync(file, 'utf-8'))
          }

          return data
        },
      )

      this.pluginJson._styles = styleContent.map(s => s.varient);

      const plugin = {
        // code: content,
        id: this.projectId,
        config: this.pluginJson,
        type: 'dev',
        cliVersion: pkg.version,
      }

      const fileBuffer = {
        code: Buffer.from(content, 'utf8'),
        styles: styleContent,
      }

      successCallback(plugin, fileBuffer)
    })
  }

  stop() {
    this.close && this.close.close(() => {
    })
  }

  get id() {
    return this.projectId
  }

  get pjson() {
    return this.pluginJson
  }
}

module.exports = new ArenaPluginCompiler()
