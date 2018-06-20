class WebsyQlikObjectManager {
  constructor(options, callbackFn) {
    const defaults = {
      api: "engine"
    }
    this.apps = {}
    this.supportedChartTypes = []
    this.chartLibrary = {}
    this.connectedCallback = callbackFn
    if (options.visualisationPlugins && options.visualisationPlugins.length > 0) {
      for (let i = 0; i < options.visualisationPlugins.length; i++) {
        this.registerVisualisation(options.visualisationPlugins[i].id, options.visualisationPlugins[i].definition)
      }
    }
    this.options = Object.assign({}, defaults, options)
    this.connectToApps()
  }
  connectToApps(){
    let connectedApps = 0
    let method = "connectWithEngineAPI"
    if (this.options.api=="capability") {
      method = "connectWithCapabilityAPI"
    }
    for (let i = 0; i < this.options.apps.length; i++) {
      this[method](this.options.apps[i], (err)=>{
        if (err) {
          this.connectedCallback(err)
          return
        }
        connectedApps++
        if (connectedApps==this.options.apps.length) {
          this.connectedCallback(null)
          if (this.options.defaultView && this.options.defaultView!=="") {
            this.loadObjects(this.options.defaultView)
          }
        }
      })
    }
  }
  connectWithCapabilityAPI(appConfig, callbackFn){
    include "./connectWithCapabilityAPI.js"
  }
  connectWithEngineAPI(appConfig, callbackFn){
    include "./connectWithEngineAPI.js"
  }
  loadObjects(view){
    let objList = this.options.views[view]
    if (objList && objList.length > 0) {
      for (var i = 0; i < objList.length; i++) {
        if (this.options.api==="engine") {
          if (objList[i].objectId) {
            objList[i].attached = true
            objList[i].vis.render()
          }
          else if (objList[i].definition){
            this.createObjectFromDefinition(objList[i])
          }
        }
        else if (this.options.api==="capability") {
          if (objList[i].objectId) {
            if (objList[i].vis) {
              // It's a custom vis
              objList[i].attached = true
              objList[i].vis.render()
            }
            else {
              // Use the getObject method
              this.getObjectFromId(objList[i])
            }
          }
          else if (objList[i].type) {
            // use the Visualization API
            this.createObjectWithVisualizationAPI(objList[i])
          }
          else if (objList[i].definition && objList[i].definition.qInfo) {
            // use the createGenericObject method
            this.createObjectFromDefinition(objList[i])
          }
        }
      }
    }
  }
  closeObjects(view){
    let objList = this.options.views[view]
    if (objList && objList.length > 0) {
      for (var i = 0; i < objList.length; i++) {
        if (objList[i].vis) {
          objList[i].attached = false
        }
        else if (objList[i].objectId) {
          this.destroyObjectFromId(objList[i])
        }
      }
    }
  }
  getObjectFromId(objectConfig){
    this.apps[objectConfig.app].getObject(objectConfig.elementId, objectConfig.objectId)
  }
  createObjectFromDefinition(objectConfig){
    include "./createObjectFromDefinition.js"
  }
  createObjectWithVisualizationAPI(objectConfig){
    this.apps[objectConfig.app].visualization.create(objectConfig.type, objectConfig.columns, objectConfig.options).then(viz=>viz.show(objectConfig.elementId))
  }
  destroyObjectFromId(objectConfig){
    this.apps[objectConfig.app].destroySessionObject(objectConfig.elementId, objectConfig.objectId)
  }
  detachObject(objectConfig){
    objectConfig.attached = false
  }
  normalizeId(id){
    return id.replace(/\s:\\\//,'-')
  }
  registerVisualisation(name, classDef){
    if (name.indexOf(/\s/)!==-1) {
      console.log("Failed to register Chart Extension. Chart name must not contain spaces.")
      return
    }
    if (this.supportedChartTypes.indexOf(name)!==-1) {
      console.log("Failed to register Chart Extension. Chart name already exists.")
      return
    }
    this.supportedChartTypes.push(name)
    this.chartLibrary[name] = classDef
  }
}
