const {Command, flags} = require('@oclif/command')
const webpackCompiler = require('../webpack/compiler')
const t = require('../ui')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const semver = require('semver')

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

  compileSuccess(content) {
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
      content.config.version = semver.inc(content.config.version, flags.bump)
      const pluginJson = path.resolve(process.cwd(), 'plugin.json')
      const jsonOnDisk = fs.readFileSync(pluginJson, {encoding: 'utf8'})
      const jsonContent = JSON.parse(jsonOnDisk)
      jsonContent.version = content.config.version
      fs.writeFileSync(pluginJson, JSON.stringify(jsonContent, null, 2))
    }

    // compress
    const contentBuffer = Buffer.from(JSON.stringify(content), 'utf8')
    const compressedBuffer = zlib.deflateSync(contentBuffer)
    const savePath = path.resolve(process.cwd(), `${webpackCompiler.id}${content.config.version ? '-' + content.config.version : ''}.arenap`)
    fs.writeFileSync(savePath, compressedBuffer)
    // const v1struct = {
    //   VERSION: 2,
    //   CONFIG_LEN: 4,
    //   FIXED_LEN: 2 + 4,
    // };

    // const defaultDir = path.resolve(process.cwd(), 'app/static/thumb');
    
    // let range = 0;
    // const collectedResources = fs.readdirSync(defaultDir)
    //   .filter(f => !f.startsWith('.'))
    //   .map((f) => {
    //     const fstate = fs.statSync(path.resolve(defaultDir, f));
    //     const stat = {
    //       name: f,
    //       size: fstate.size,
    //       from: range,
    //     };

    //     range += fstate.size;
    //     return stat;
    //   });

    // const f_identifiers = JSON.stringify(content);
    // const f_identifiers_buffer = zlib.deflateSync((Buffer.from(f_identifiers, 'utf8')));
    // const f_length = f_identifiers_buffer.length;

    // const f_iv_fixed_buffer = Buffer.alloc(v1struct.VERSION);
    // const f_il_fixed_buffer = Buffer.alloc(v1struct.CONFIG_LEN);

    // f_iv_fixed_buffer.writeUInt16LE(1);
    // f_il_fixed_buffer.writeUInt32LE(f_length);

    // const f = fs.createWriteStream(
    //   path.resolve(process.cwd(), `${webpackCompiler.id}${content.config.version ? '-' + content.config.version : ''}.arenap`),
    // );

    // f.write(f_iv_fixed_buffer);
    // f.write(f_il_fixed_buffer);
    // f.write(f_identifiers_buffer);

    // collectedResources.forEach((fd) => {
    //   const file = path.resolve(defaultDir, fd.name);
    //   const f_buffer = fs.readFileSync(file);
    //   f.write(f_buffer);
    // });

    // f.end();
    // f.close();
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
}

module.exports = BuildCommand
