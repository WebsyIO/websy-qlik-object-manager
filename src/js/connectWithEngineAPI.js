// check for enigma.js
let originalId = appConfig.id
appConfig.id = this.normalizeId(appConfig.id)
if (typeof enigma==="undefined") {
  callbackFn({
    error: "Enigma.js not found."
  })
  return
}
let config = {
  schema: this.options.enigmaSchema,
  url: `${(appConfig.isSecure===true?"wss":"ws")}://${appConfig.host}:${appConfig.port}${appConfig.prefix}app/${appConfig.id}`
}
let session = enigma.create(config)
session.open().then(global=>{
  global.openDoc(originalId).then(app=>{
    this.apps[appConfig.id] = app
    callbackFn()
  })
})
