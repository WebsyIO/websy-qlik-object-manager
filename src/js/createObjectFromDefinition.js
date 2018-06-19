let method
if (this.options.api=="engine") {
  method = "createSessionObject"
}
else if (this.options.api==="capability") {
  method = "createGenericObject"
}
this.apps[objectConfig.app][method](objectConfig.definition).then(model=>{
  objectConfig.objectId = model.id
  objectConfig.attached = true
  if (this.supportedChartTypes.indexOf(objectConfig.definition.qInfo.qType)!==-1) {
    objectConfig.vis = new this.chartLibrary[objectConfig.definition.qInfo.qType](objectConfig.elementId, model, {})
    model.on("changed", ()=>{
      if (objectConfig.attached===true) {
        objectConfig.vis.render()
      }
    })
  }
  else if (objectConfig.render && typeof objectConfig.render == "function"){
    objectConfig.vis = {}
    objectConfig.render.call(objectConfig, model)
    model.on("changed", ()=>{
      if (objectConfig.attached===true) {
        objectConfig.render.call(objectConfig, model)
      }
    })
  }
})
