## Websy Qlik Object Manager
This Websy Qlik Object Manager is a JavaScript class that enables to developers to build web applications, powered by Qlik, based on a series of configuration options. Instead of writing code to manage connections to the Qlik Server and applications, as well as monitor when a given visualisation or visualisations should be updated, this tool allows you provide JSON structures to determine which servers/applications/data/objects etc should be used and manages the state of all of them automatically.

#### Installation
The package can be installed using NPM.
``` javascript
npm install websy-qlik-object-manager
```

#### Initializing the Manager
Once included in the page, a global Class called `WebsyNavigator` will be available. To instantiate a new instance of the class, simply call a `new` version of the class, passing in a `configuration` object. Any errors that occur during the instantiation will cause the creation to fail and the error returned within the callback function. If no error is returned then the instantiation was successful.
``` javascript
const config = {}
let manager = new WebsyQlikObjectManager(config, err=>{
  if (err) {
    console.log(err);
  }
  else {

  }
})
```

#### Connecting to a Qlik Sense Application
The Websy Qlik Object Manager supports both the `Qlik Capability APIs` and `Qlik Engine API`. By default the `Qlik Engine API` will be used. To change the api to be used, you can provide the value `capability` or `engine` to the `api` property on the configuration object.
``` javascript
const config = {
  api: "capability"
}
```

###### Connecting via the Qlik Engine API
In order to successfully connect with the `Qlik Engine API`, you'll need to load the <a>Enigma.js</a> library into the page and fetch the appropriate schema file. The schema file can then be used in the configuration of the Websy Qlik Object Manager.
``` html
<script src="<pathTo>/enimga.min.js"></script>
```
``` javascript
fetch("/resources/schema.json").then(response => {return response.json()}).then(schema=>{
  const config = {
    enigmaSchema: schema
  }
  let manager = new WebsyQlikObjectManager(config, err=>{
    if (err) {
      console.log(err);
    }
    else {

    }
  })
})
```

###### Connecting via the Qlik Capability APIs
In order to successfully connect with the `Qlik Capability APIs`, you'll need to load the Qlik implementation of `RequireJS` and the `qlik-styles.css` file into the page.
``` html
<link rel="stylesheet" href="<pathTo>/qlik-styles.css">
<script src="<pathTo>/require.js"></script>
```

###### Specifying the Applications (QVF) to use
With the Websy Qlik Object Manager, it's possible to include content from multiple Qlik applications. The information for each application can simply be added to the `apps` property of the configuration. The following properties should be provided:
* **id** - The id of the application
* **host** - The hostname/ip of the Qlik proxy hosting the application
* **port** - The port of the Qlik proxy hosting the application
* **prefix** - The prefix of the Qlik virtual proxy to be used
* **isSecure** - Determines whether or not to open a secure connection
``` javascript
const config = {  
  apps: [
    {
      id: "<some-guid>",
      host: "myhost.mydomain.com",
      port: 80,
      prefix: "/",
      isSecure: true
    },
    {
      id: "<another-guid>",
      host: "myhost.mydomain.com",
      port: 80,
      prefix: "/",
      isSecure: true
    }
  ]
}
```

#### Defining Objects
Objects are grouped into `views`, which allow you to design for performance. The `views` property on the configuration is an object where each key represents the id of the view. The value should be an array of `objects`, with a combination of these properties:
* **app** - The id of the application the object belongs to. This should match the id of one of the `apps` specified in the configuration.
* **elementId** - The id of the HTML element to use for this object. Can **only** be used with the `Qlik Capability APIs`.
* **objectId&& - The id of the Qlik object to use,
* **type** - For use with the Qlik `Visualization API`, determines the object type i.e. barchart. Can **only** be used with the `Qlik Capability APIs` and should be accompanied by the `columns` and `options` properties.
* **columns** - For use with the Qlik `Visualization API`, determines the columns to be used in the visualisation. Can **only** be used with the `Qlik Capability APIs` and should be accompanied by the `type` and `options` properties.
* **options** - For use with the Qlik `Visualization API`, allows additional options to be set. Can **only** be used with the `Qlik Capability APIs` and should be accompanied by the `type` and `columns` properties.
* **definition** - Allows you to provide the full definition of a Generic Object. The `qType` property will be used to find the corresponding custom visualisation to use for rendering. If no visualisation is found/exists, should be accompanied by the `render` property.
* **render** - Allows you to provide a custom function to use when the object should be rendered. This function receives the model of the `Generic Object` as a parameter and the `this` value represents this collection of properties.
``` javascript
const config = {
  apps: { ... },
  views: {
    dashboard: [
      { // fetch an existing object with the Capability APIs
        app: "<someAppId>",
        elementId: "<someElementId>"
        objectId: "<someQlikObjectId>"
      },
      { // create an object with the Visualization API
        app: "<someAppId>",
        elementId: "<someElementId>"
        type: "barchart",
        columns: ["a dimension", "=Sum(a measure)"],
        options: {}
      }
    ],
    analysis: [
      { // create an object from a Generic Object Definition and use a custom render function
        app: "<someAppId>",
        elementId: "<someElementId>"
        definition: {
          qInfo: {
            qType: "my-custom-object"
          },
          qHyperCubeDef: {
            qDimensions: [{
              qDef: { qFieldDefs: ["Country"] }
            }],
            qMeasures: [{
              qDef: { qDef: "Sum([Sales Amount])" }
            }],
            qInitialDataFetch: [{
              qTop: 0,
              qLeft: 0,
              qWidth: 2,
              qHeight: 50
            }]
          }
        },
        render: (model)=>{
          model.getLayout().then(layout=>{
            document.getElementById(this.elementId).innerHTML = JSON.stringify(layout)
          })
        }
      }
    ]    
  }
}
```
#### Registering Visualisations
Custom visualization classes can be used to simplify the rendering of Objects. To be compatible, the constructor on the class should accept 2 parameters that represent the `HTML element Id` and `Generic Object model`. It should also have `render()` method that will be called on every subsequent state change. To call the render function on creation of the object add the functionality to the constructor.
``` javascript
class myVisualisation {
  constructor(elementId, model) {
    this.elementId = elementId
    this.model = model
    this.render()
  }
  render(){
    this.model.getLayout().then(layout=>{
      document.getElementById(this.elementId).innerHTML = JSON.stringify(layout)
    })
  }
}
```
To register the visualisation, it should be added to a `visualisationPlugins` array on the configuration object. Each item in the array should contain 2 properties:
* **id** - The identifier for the visualisation. This value should be used as the `qType` in a `Generic Object` definition.
* **definition** - The class to be used
``` javascript
visualisationPlugins: [
  {
    id: "my-custom-object",
    definition: myVisualisation
  }
]
```

#### Methods

###### loadObjects(<view>)
The loadObjects() method causes all objects in the specified view to be re-validated and, where applicable, re-rendered.
``` javascript
manager.loadObjects("dashboard")
```

###### closeObjects(<view>)
The closeObjects() method causes all objects in the specified view to be detached/destroyed.
``` javascript
manager.closeObjects("dashboard")
```
