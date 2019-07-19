arena-plugin
============

Arena Plugin Dev Command Line Interface

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/arena-plugin-cli.svg)](https://npmjs.org/package/arena-plugin)
![Downloads/week](https://img.shields.io/npm/dw/arena-plugin-cli.svg)
![License](https://img.shields.io/npm/l/arena-plugin-cli.svg)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g arena-plugin-cli
$ arena-plugin COMMAND
running command...
$ arena-plugin (-v|--version|version)
arena-plugin-cli/0.0.20 darwin-x64 node-v8.12.0
$ arena-plugin --help [COMMAND]
USAGE
  $ arena-plugin COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`arena-plugin dev`](#arena-plugin-dev)
* [`arena-plugin help [COMMAND]`](#arena-plugin-help-command)
* [`arena-plugin init`](#arena-plugin-init)
* [`arena-plugin selfhost`](#arena-plugin-selfhost)

## `arena-plugin dev`

Develope your Arena plugins with hot reload.

```
USAGE
  $ arena-plugin dev

DESCRIPTION
  Develope your Arena plugins with hot reload, run this command under your project folder.
  Before you run this command, you need to:
  1. Create plugin.json and plugin entry file,
  	you can also run <new> command to create a new plugin project.

  2. Open Arena, and run this command,
  	once the plugin is ready, plugin button will appear at the top of the app.
```

_See code: [src/commands/dev.js](https://github.com/corpcode/arena-plugin/blob/v0.0.20/src/commands/dev.js)_

## `arena-plugin help [COMMAND]`

display help for arena-plugin

```
USAGE
  $ arena-plugin help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `arena-plugin init`

Create a empty Arena plugin project

```
USAGE
  $ arena-plugin init

DESCRIPTION
  Create an new empty Arena plugin project in current directory
```

_See code: [src/commands/init.js](https://github.com/corpcode/arena-plugin/blob/v0.0.20/src/commands/init.js)_

## `arena-plugin selfhost`

Self hosting unix socket port for testing only

```
USAGE
  $ arena-plugin selfhost
```

_See code: [src/commands/selfhost.js](https://github.com/corpcode/arena-plugin/blob/v0.0.20/src/commands/selfhost.js)_
<!-- commandsstop -->
