"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebsyQlikObjectManager = function () {
  function WebsyQlikObjectManager(options, callbackFn) {
    _classCallCheck(this, WebsyQlikObjectManager);

    var defaults = {
      api: "engine",
      helpEvent: "mouseover"
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
    this.prep();
    this.connectToApps();
  }

  _createClass(WebsyQlikObjectManager, [{
    key: "buildChildElement",
    value: function buildChildElement(elementId, text) {
      var html = "<article id=\"" + elementId + "_vis\" class=\"websy-vis-article\"></article>";
      if (text && text !== "") {
        html += "\n\t\t\t\t<i class=\"websy-vis-help-listener\" data-element=\"" + elementId + "\"></i>\n\t\t\t\t<div id=\"" + elementId + "_help\" class=\"websy-vis-help\"><span>" + (text || "") + "</span></div>\n\t\t\t";
      }
      return html;
    }
  }, {
    key: "prep",
    value: function prep() {
      var _this = this;

      for (var view in this.options.views) {
        // sort out the elements in each view
        for (var o = 0; o < this.options.views[view].length; o++) {
          var config = this.options.views[view][o];
          var el = document.getElementById(config.elementId);
          if (el) {
            el.innerHTML += this.buildChildElement(config.elementId, config.help);
            if (config.help && config.help !== "") {
              el.addEventListener(this.options.helpEvent, this.handleEvent.bind(this));
              el.addEventListener("mouseout", this.handleEvent.bind(this));
            }
          }
        }
      }
      // setup  the event listeners for the actions
      // actions should not have a visualisation in the same property structure

      var _loop = function _loop(a) {
        if (!Array.isArray(_this.options.actions[a].app)) {
          _this.options.actions[a].app = [_this.options.actions[a].app];
        }
        var el = document.getElementById(_this.options.actions[a].elementId);
        if (el) {
          el.addEventListener(_this.options.actions[a].event, function () {
            for (var p = 0; p < _this.options.actions[a].app.length; p++) {
              var appModel = _this.apps[_this.options.actions[a].app[p]].model;
              if (appModel.enigmaModel) {
                appModel = appModel.enigmaModel;
              }

              var _loop2 = function _loop2(i) {
                var item = _this.options.actions[a].items[i];
                if (item.field) {
                  appModel.getField(item.field).then(function (field) {
                    field[item.method].apply(field, _toConsumableArray(item.params));
                  });
                } else {
                  var _appModel;

                  (_appModel = appModel)[item.method].apply(_appModel, _toConsumableArray(item.params));
                }
              };

              for (var i = 0; i < _this.options.actions[a].items.length; i++) {
                _loop2(i);
              }
            }
          });
        }
      };

      for (var a = 0; a < this.options.actions.length; a++) {
        _loop(a);
      }
    }
  }, {
    key: "connectToApps",
    value: function connectToApps() {
      var _this2 = this;

      var connectedApps = 0;
      var method = "connectWithEngineAPI";
      if (this.options.api == "capability") {
        method = "connectWithCapabilityAPI";
      }
      for (var i = 0; i < this.options.apps.length; i++) {
        this[method](this.options.apps[i], function (err) {
          if (err) {
            _this2.connectedCallback(err);
            return;
          }
          connectedApps++;
          if (connectedApps == _this2.options.apps.length) {
            _this2.connectedCallback(null);
            if (_this2.options.defaultView && _this2.options.defaultView !== "") {
              _this2.loadObjects(_this2.options.defaultView);
            }
          }
        });
      }
    }
  }, {
    key: "connectWithCapabilityAPI",
    value: function connectWithCapabilityAPI(appConfig, callbackFn) {
      var _this3 = this;

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
        _this3.apps[appConfig.id] = qlik.openApp(originalId, appConfig);
        callbackFn();
      });
    }
  }, {
    key: "connectWithEngineAPI",
    value: function connectWithEngineAPI(appConfig, callbackFn) {
      var _this4 = this;

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
          _this4.apps[appConfig.id] = app;
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
      this.apps[objectConfig.app].getObject(objectConfig.elementId + "_vis", objectConfig.objectId);
    }
  }, {
    key: "handleEvent",
    value: function handleEvent(event) {
      if (event.target.classList.contains("websy-vis-help-listener")) {
        var elementId = event.target.attributes["data-element"];
        if (elementId.value) {
          this.toggleHelp(elementId.value + "_help");
        }
      }
    }
  }, {
    key: "createObjectFromDefinition",
    value: function createObjectFromDefinition(objectConfig) {
      var _this5 = this;

      var method = void 0;
      if (this.options.api == "engine") {
        method = "createSessionObject";
      } else if (this.options.api === "capability") {
        method = "createGenericObject";
      }
      this.apps[objectConfig.app][method](objectConfig.definition).then(function (model) {
        objectConfig.objectId = model.id;
        objectConfig.attached = true;
        if (_this5.supportedChartTypes.indexOf(objectConfig.definition.qInfo.qType) !== -1) {
          objectConfig.vis = new _this5.chartLibrary[objectConfig.definition.qInfo.qType](objectConfig.elementId + "_vis", model);
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
        return viz.show(objectConfig.elementId + "_vis");
      });
    }
  }, {
    key: "destroyObjectFromId",
    value: function destroyObjectFromId(objectConfig) {
      var hostEl = document.getElementById(objectConfig.elementId + "_vis");
      if (hostEl) {
        hostEl.innerHTML = "";
      }
      this.apps[objectConfig.app].destroySessionObject(objectConfig.objectId);
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
    key: "showHelp",
    value: function showHelp(elementId) {
      var el = document.getElementById(elementId);
      if (el) {
        el.classList.add("active");
      }
    }
  }, {
    key: "hideHelp",
    value: function hideHelp(elementId) {
      var el = document.getElementById(elementId);
      if (el) {
        el.classList.remove("active");
      }
    }
  }, {
    key: "toggleHelp",
    value: function toggleHelp(elementId) {
      var el = document.getElementById(elementId);
      if (el) {
        el.classList.toggle("active");
      }
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
