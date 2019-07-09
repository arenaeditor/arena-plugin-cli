module.exports = {
  document: (() => {
    return window.__arena_document
  })(),
  Vue: (() => {
    return window.__arena_vue
  })(),
}
