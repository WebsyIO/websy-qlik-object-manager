class WebsyQlikObjectManager {
  constructor(options, callbackFn) {
    const defaults = {
      api: "engine",
			helpEvent: "mouseover"
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
		this.prep()
    this.connectToApps()
  }
	buildChildElement(elementId, text){
		let html = `<article id="${elementId}_vis" class="websy-vis-article"></article>`
		if (text && text!=="") {
			html += `
				<i class="websy-vis-help-listener" data-element="${elementId}"></i>
				<div id="${elementId}_help" class="websy-vis-help"><span>${text || ""}</span></div>
			`
		}
		return html
	}
	prep() {
		for (let view in this.options.views) {
			// sort out the elements in each view
			for (let o = 0; o < this.options.views[view].length; o++) {
				let config = this.options.views[view][o]
				let el = document.getElementById(config.elementId)
				if (el) {
					el.innerHTML += this.buildChildElement(config.elementId, config.help)
					if (config.help && config.help!=="") {
						el.addEventListener(this.options.helpEvent, this.handleEvent.bind(this))
						el.addEventListener("mouseout", this.handleEvent.bind(this))
					}
				}
			}
		}
		// setup  the event listeners for the actions
		// actions should not have a visualisation in the same property structure
		for (let a = 0; a < this.options.actions.length; a++) {
			if (!Array.isArray(this.options.actions[a].app)) {
				this.options.actions[a].app = [this.options.actions[a].app]
			}
			let el = document.getElementById(this.options.actions[a].elementId)
			if (el) {
				el.addEventListener(this.options.actions[a].event, ()=>{
					for (let p = 0; p < this.options.actions[a].app.length; p++) {
						let appModel = this.apps[this.options.actions[a].app[p]].model
						if (appModel.enigmaModel) {
							appModel = appModel.enigmaModel
						}
						for (let i = 0; i < this.options.actions[a].items.length; i++) {
							let item = this.options.actions[a].items[i]
							if (item.field) {
								appModel.getField(item.field).then(field=>{
									field[item.method](...item.params)
								})
							}
							else {
								appModel[item.method](...item.params)
							}
						}
					}
				})
			}
		}
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
    this.apps[objectConfig.app].getObject(`${objectConfig.elementId}_vis`, objectConfig.objectId)
  }
	handleEvent(event) {
		if (event.target.classList.contains("websy-vis-help-listener")) {
			let elementId = event.target.attributes["data-element"]
			if (elementId.value) {
				this.toggleHelp(`${elementId.value}_help`)
			}
		}
	}
  createObjectFromDefinition(objectConfig){
    include "./createObjectFromDefinition.js"
  }
  createObjectWithVisualizationAPI(objectConfig){
    this.apps[objectConfig.app].visualization.create(objectConfig.type, objectConfig.columns, objectConfig.options).then(viz=>viz.show(`${objectConfig.elementId}_vis`))
  }
  destroyObjectFromId(objectConfig){
		let hostEl = document.getElementById(`${objectConfig.elementId}_vis`)
		if (hostEl) {
			hostEl.innerHTML = ""
		}
    this.apps[objectConfig.app].destroySessionObject(objectConfig.objectId)
  }
  detachObject(objectConfig){
    objectConfig.attached = false
  }
  normalizeId(id){
    return id.replace(/\s:\\\//,'-')
  }
	showHelp(elementId) {
		let el = document.getElementById(elementId)
		if (el) {
			el.classList.add("active")
		}
	}
	hideHelp(elementId) {
		let el = document.getElementById(elementId)
		if (el) {
			el.classList.remove("active")
		}
	}
	toggleHelp(elementId) {
		let el = document.getElementById(elementId)
		if (el) {
			el.classList.toggle("active")
		}
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
