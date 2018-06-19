// check for requirejs
let originalId = appConfig.id
appConfig.id = this.normalizeId(appConfig.id)
if (typeof require==="undefined") {
  callbackFn({
    error: "RequireJs not found."
  })
  return
}
require.config({baseUrl: `${(appConfig.isSecure===true?"https":"http")}://${appConfig.host}:${appConfig.port}${appConfig.prefix}resources`})
require(["js/qlik"], qlik=>{
  this.apps[appConfig.id] = qlik.openApp(originalId, appConfig)
  callbackFn()
})
