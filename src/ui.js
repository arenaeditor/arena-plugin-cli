const term = require('terminal-kit').terminal

let pbar = null

module.exports = {
  clear: () => term.clear(),
  fs: () => term.fullscreen(true),
  term,
  headerDev: () => {
    term.clear()
    term.defaultColor('📦\t').bgWhite(`${global._pid}/${global._name}\n`)
  },
  pbar: () => pbar,
  newPbar: () => {
    pbar = term.progressBar({
      width: 80,
      title: '请稍后',
      eta: true,
      percent: true,
    })
  },
}
