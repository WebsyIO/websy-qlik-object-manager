## Websy Qlik Object Manager
This Websy Qlik Object Manager is a JavaScript class that enables to developers to build web applications, powered by Qlik, based on a series of configuration options. Instead of writing code to manage connections to the Qlik Server and applications, as well as monitor when a given visualisation or visualisations should be updated, this tool allows you provide JSON structures to determine which servers/applications/data/objects etc should be used and manages the state of all of them automatically.

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
The Websy Qlik Object Manager supports both the `Qlik Capability APIs` and `Qlik Engine API`. By default the `Qlik Engine API` will be used.

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
  enigmaSchema: schema,
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
