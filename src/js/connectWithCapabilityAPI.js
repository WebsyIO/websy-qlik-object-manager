// check for requirejs
if (typeof require==="undefined") {
  callbackFn({
    error: "RequireJs not found."
  })
  return
}
require.config({baseUrl: `${(appConfig.isSecure===true?"https":"http")}://${appConfig.host}:${appConfig.port}${appConfig.prefix}resources`})
require(["js/qlik"], qlik=>{
  this.apps[appConfig.id] = qlik.openApp(appConfig.id, appConfig)
  callbackFn()
})
