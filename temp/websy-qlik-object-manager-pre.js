"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebsyQlikObjectManager = function () {
  function WebsyQlikObjectManager(options, callbackFn) {
    _classCallCheck(this, WebsyQlikObjectManager);

    var defaults = {
      api: "engine"
    };
    this.apps = {};
    this.supportedChartTypes = [];
    this.chartLibrary = {};
    this.connectedCallback = callbackFn;
    if (options.visualisationPlugins && options.visualisationPlugins.length > 0) {
      for (var i = 0; i < options.visualisationPlugins.length; i++) {
        this.registerVisualisation(options.visualisationPlugins[i].id, options.visualisationPlugins[i].definition);
      }
    }
    this.options = Object.assign({}, defaults, options);
    this.connectToApps();
  }

  _createClass(WebsyQlikObjectManager, [{
    key: "connectToApps",
    value: function connectToApps() {
      var _this = this;

      var connectedApps = 0;
      var method = "connectWithEngineAPI";
      if (this.options.api == "capability") {
        method = "connectWithCapabilityAPI";
      }
      for (var i = 0; i < this.options.apps.length; i++) {
        this[method](this.options.apps[i], function (err) {
          if (err) {
            _this.connectedCallback(err);
            return;
          }
          connectedApps++;
          if (connectedApps == _this.options.apps.length) {
            _this.connectedCallback(null);
            if (_this.options.defaultView && _this.options.defaultView !== "") {
              _this.loadObjects(_this.options.defaultView);
            }
          }
        });
      }
    }
  }, {
    key: "connectWithCapabilityAPI",
    value: function connectWithCapabilityAPI(appConfig, callbackFn) {
      var _this2 = this;

      // check for requirejs
      var originalId = appConfig.id;
      appConfig.id = this.normalizeId(appConfig.id);
      if (typeof require === "undefined") {
        callbackFn({
          error: "RequireJs not found."
        });
        return;
      }
      require.config({ baseUrl: (appConfig.isSecure === true ? "https" : "http") + "://" + appConfig.host + ":" + appConfig.port + appConfig.prefix + "resources" });
      require(["js/qlik"], function (qlik) {
        _this2.apps[appConfig.id] = qlik.openApp(originalId, appConfig);
        callbackFn();
      });
    }
  }, {
    key: "connectWithEngineAPI",
    value: function connectWithEngineAPI(appConfig, callbackFn) {
      var _this3 = this;

      // check for enigma.js
      var originalId = appConfig.id;
      appConfig.id = this.normalizeId(appConfig.id);
      if (typeof enigma === "undefined") {
        callbackFn({
          error: "Enigma.js not found."
        });
        return;
      }
      var config = {
        schema: this.options.enigmaSchema,
        url: (appConfig.isSecure === true ? "wss" : "ws") + "://" + appConfig.host + ":" + appConfig.port + appConfig.prefix + "app/" + appConfig.id
      };
      var session = enigma.create(config);
      session.open().then(function (global) {
        global.openDoc(originalId).then(function (app) {
          _this3.apps[appConfig.id] = app;
          callbackFn();
        });
      });
    }
  }, {
    key: "loadObjects",
    value: function loadObjects(view) {
      var objList = this.options.views[view];
      if (objList && objList.length > 0) {
        for (var i = 0; i < objList.length; i++) {
          if (this.options.api === "engine") {
            if (objList[i].objectId) {
              objList[i].attached = true;
              objList[i].vis.render();
            } else if (objList[i].definition) {
              this.createObjectFromDefinition(objList[i]);
            }
          } else if (this.options.api === "capability") {
            if (objList[i].objectId) {
              if (objList[i].vis) {
                // It's a custom vis
                objList[i].attached = true;
                objList[i].vis.render();
              } else {
                // Use the getObject method
                this.getObjectFromId(objList[i]);
              }
            } else if (objList[i].type) {
              // use the Visualization API
              this.createObjectWithVisualizationAPI(objList[i]);
            } else if (objList[i].definition && objList[i].definition.qInfo) {
              // use the createGenericObject method
              this.createObjectFromDefinition(objList[i]);
            }
          }
        }
      }
    }
  }, {
    key: "closeObjects",
    value: function closeObjects(view) {
      var objList = this.options.views[view];
      if (objList && objList.length > 0) {
        for (var i = 0; i < objList.length; i++) {
          if (objList[i].vis) {
            objList[i].attached = false;
          } else if (objList[i].objectId) {
            this.destroyObjectFromId(objList[i]);
          }
        }
      }
    }
  }, {
    key: "getObjectFromId",
    value: function getObjectFromId(objectConfig) {
      this.apps[objectConfig.app].getObject(objectConfig.elementId, objectConfig.objectId);
    }
  }, {
    key: "createObjectFromDefinition",
    value: function createObjectFromDefinition(objectConfig) {
      var _this4 = this;

      var method = void 0;
      if (this.options.api == "engine") {
        method = "createSessionObject";
      } else if (this.options.api === "capability") {
        method = "createGenericObject";
      }
      this.apps[objectConfig.app][method](objectConfig.definition).then(function (model) {
        objectConfig.objectId = model.id;
        objectConfig.attached = true;
        if (_this4.supportedChartTypes.indexOf(objectConfig.definition.qInfo.qType) !== -1) {
          objectConfig.vis = new _this4.chartLibrary[objectConfig.definition.qInfo.qType](objectConfig.elementId, model);
          model.on("changed", function () {
            if (objectConfig.attached === true) {
              objectConfig.vis.render();
            }
          });
        } else if (objectConfig.render && typeof objectConfig.render == "function") {
          objectConfig.vis = {};
          objectConfig.render.call(objectConfig, model);
          model.on("changed", function () {
            if (objectConfig.attached === true) {
              objectConfig.render.call(objectConfig, model);
            }
          });
        }
      });
    }
  }, {
    key: "createObjectWithVisualizationAPI",
    value: function createObjectWithVisualizationAPI(objectConfig) {
      this.apps[objectConfig.app].visualization.create(objectConfig.type, objectConfig.columns, objectConfig.options).then(function (viz) {
        return viz.show(objectConfig.elementId);
      });
    }
  }, {
    key: "destroyObjectFromId",
    value: function destroyObjectFromId(objectConfig) {
      this.apps[objectConfig.app].destroySessionObject(objectConfig.elementId, objectConfig.objectId);
    }
  }, {
    key: "detachObject",
    value: function detachObject(objectConfig) {
      objectConfig.attached = false;
    }
  }, {
    key: "normalizeId",
    value: function normalizeId(id) {
      return id.replace(/\s:\\\//, '-');
    }
  }, {
    key: "registerVisualisation",
    value: function registerVisualisation(name, classDef) {
      if (name.indexOf(/\s/) !== -1) {
        console.log("Failed to register Chart Extension. Chart name must not contain spaces.");
        return;
      }
      if (this.supportedChartTypes.indexOf(name) !== -1) {
        console.log("Failed to register Chart Extension. Chart name already exists.");
        return;
      }
      this.supportedChartTypes.push(name);
      this.chartLibrary[name] = classDef;
    }
  }]);

  return WebsyQlikObjectManager;
}();
