// check for enigma.js
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
config.open().then(global=>{
  global.openDoc(appConfig.id).then(app=>{
    this.apps[appConfig.id] = app
    callbackFn()
  })
})
