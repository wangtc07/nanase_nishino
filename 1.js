/* VERSION: Typescript */
(function (){
/**
 * GLOBAL WOVNio OBJECT
 * Dynamically loaded components must call the registerComponent
 * method to be available to Widget for loading
 *
 * Components in the scrip can make themselves available to
 * Widget by assigning themselves to the components object using
 * their component name as the key
 **/
// only run once
if (document.WOVNIO)
  return;

var components = {};


var Widget = function (components, options) {
  if (!options) options = {};
  //var that = this;
  var instance = {};
  var installedComponents = {};
  var cachedData = [];
  var DATA_TIMEOUT = 5000;
  var isDisableLoadTranslation = false;

  document.WOVNIO = function () {
    var obj = {};
    obj.registerComponent = function (componentName, component) {
      components[componentName] = component;
      delete installedComponents[componentName];
      // dispatch load event
      var loadEvent = document.createEvent('Event');
      var eventName = componentName + 'Loaded';
      loadEvent.initEvent(eventName, true, true);
      document.dispatchEvent(loadEvent);
    };
    return obj;
  }();

  var insertedSrcs = [];
  var html = options.scriptTag || document.currentScript || function () {
    var scriptTags = document.getElementsByTagName('script');

    // this should return on the first loop iteration
    for (var i = scriptTags.length - 1; i >= 0; i--) {
      if (scriptTags[i].getAttribute('data-wovnio'))
        return scriptTags[i];
    }
    return scriptTags[scriptTags.length - 1];

  }();
  instance.tag = {
    html: html,
    getAttribute: function (attr) {
      attr = (typeof attr === 'string') ? attr : '';
      var hasAttr = html.hasAttribute ? html.hasAttribute(attr) : (html[attr] !== undefined);
      if (hasAttr) {
        return html.getAttribute(attr);
      }
      else {
        var rx = new RegExp(attr + '=([^&]*)', 'i');
        var fallbackKey = instance.isTest ? 'key=Tok3n': "''"
        var match = (html.getAttribute('data-wovnio') || fallbackKey).match(rx);
        return match ? (match[1] === 'false' ? false : match[1]) : '';
      }
    },
    /**
     * Insert an script tag with the specified src and attributes to the previous of the wovn script.
     * @param {String} srcAttr the src of the script
     * @param {Object} attrs additional attributes for the script
     */
    insertScriptBefore: function (srcAttr, attrs) {
      if (!srcAttr) return;
      var scriptEle   = document.createElement('script');
      scriptEle.type  = 'text/javascript';
      scriptEle.async = true;
      for (var name in attrs) if (attrs.hasOwnProperty(name)) scriptEle[name] = attrs[name];
      scriptEle.src   = srcAttr;

      html.parentNode.insertBefore(scriptEle, html);
      insertedSrcs.push(srcAttr);
      return scriptEle;
    },
    isScriptInserted: function (src) {
      // In tests, cannot call Utils' function because of Widget loading is faster than utils
      for (var i = 0; i < insertedSrcs.length; i++) {
        if (insertedSrcs[i] === src) {
          return true
        }
      }
      return false;
    },
    /**
     * Remove script tags containing the specified src
     * @param {String} src the src of the scripts
     */
    removeScript: function(src) {
      if (!src || !instance.tag.isScriptInserted(src)) return;
      insertedSrcs.splice(instance.c('Utils').indexOf(insertedSrcs, src), 1);
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; ++i) {
        var script = scripts[i];
        if (script.getAttribute('src') === src && script.parentNode) script.parentNode.removeChild(script);
      }
    }
  };

  instance.isBackend = function() {
    return instance.tag.getAttribute('backend');
  };
  instance.hasWAP = function() {
    var token = instance.tag.getAttribute('key');
    var forceDisableTokens = {'nNUR6x': true, '_v4hMP': true}
    if (forceDisableTokens[token]) {
      return false
    }

    var htmlTag = document.getElementsByTagName('html')[0]
    return htmlTag && !htmlTag.hasAttribute('wovn-nowap')
  }

  /**
   * Get component
   * @param componentName {String}
   * @returns component
   */
  var getComponent = function (componentName) {
    // Not use hasOwnProperty to speed up
    var component = installedComponents[componentName];
    if (component)
      return component;
    else if (components[componentName]) {
      installComponent(componentName);
      return installedComponents[componentName];
    }
    else {
      return null;
    }
  };

  var installComponent = function (componentName) {
    if (installedComponents[componentName] || typeof(components[componentName]) === 'undefined')
      return;

    if (typeof components[componentName] === 'function') {
      installedComponents[componentName] = new components[componentName](instance);
    }
    else {
      installedComponents[componentName] = components[componentName];
    }
  };

  instance.c = function (componentName) {
    return getComponent(componentName);
  };

  instance.isComponentLoaded = function (componentName) {
    return installedComponents.hasOwnProperty(componentName) || components.hasOwnProperty(componentName);
  };

  /**
   * Get components src
   *
   * @param {String} componentName
   * @param {Object} options
   * @param {String} options.location alternative of current location
   * @param {Boolean} options.failover if true, return URL for failover
   *
   * @return {String} src
   */
  var componentSrc = function(componentName, options) {
    if (!options) options = {};

    if (!instance.isTest) {
      if (componentName === 'Data') {
        var key = instance.tag.getAttribute('key');
        if (!key) return null;
        if (!instance.c('Utils').isValidURI(options['location'])) return null;
        var encodedLocation = getEncodedLocation(options['location']);
        var path = '/js_data/1/'+ key + '/?u=' + encodedLocation + '&version=1';
        var host_with_scheme = options.failover ? instance.c('RailsBridge')['cdnOriginHost'] : instance.c('RailsBridge')['requestWidgetHost'];
        return host_with_scheme + path;
      }
    }

    var componentPath = instance.c('RailsBridge')['jWovnHost'] + '1/components/'
    return options.failover ? null : (componentPath + componentName);
  };

  /**
   * Get data src
   *
   * @param {Object} options
   * @param {String} options.location alternative of current location
   * @param {Boolean} options.failover if true, return URL for failover
   *
   * @return {String} src
   */
  var dataJsonSrc = function(options) {
    if (!options) options = {};
    var key = instance.tag.getAttribute('key');
    if (!key) return null;
    if (!instance.c('Utils').isValidURI(options['location'])) return null;
    var encodedLocation = getEncodedLocation(options['location']);
    var path = '/js_data/json/1/'+ key + '/?u=' + encodedLocation + '&version=1';
    if (instance.isTest) {
      path += '&test=true';
    }
    var host = options.failover ? instance.c('RailsBridge')['cdnOriginHost'] : instance.c('RailsBridge')['requestWidgetHost'];
    return host + path;
  };

  var savedDataJsonSrc = function() {
    var token = instance.tag.getAttribute('key');
    var session = encodeURIComponent(instance.c('Url').getLiveEditorSession())
    if (!token || !session) {
      return null;
    }

    var encodedLocation = getEncodedLocation(options['location']);
    var host = instance.c('Url').getApiHost();
    var url = host + 'js_saved_data/' + token + '?session_token=' + session + '&u=' + encodedLocation;
    return url;
  }

  var previewDataJsonSrc = function(signature) {
    var token = instance.tag.getAttribute('key');
    var encodedLocation = getEncodedLocation(options['location']);
    var host = instance.c('Url').getApiHost();
    var url = host + 'js_preview_data/' + token + '?signature=' + encodeURIComponent(signature) + '&u=' + encodedLocation;
    return url;
  }

  var addLoadListener = function(componentName, callback) {
    var loadEvent = document.createEvent('Event');
    var eventName = componentName + 'Loaded';
    loadEvent.initEvent(eventName, true, true);
    if (document.addEventListener) {
      var handler = function() {
        document.removeEventListener(eventName, handler, false);
        callback.apply(this, arguments);
      };
      document.addEventListener(eventName, handler, false);
    } else if (document.attachEvent) {
      var handler = function() {
        document.detachEvent(eventName, handler);
        callback.apply(this, arguments);
      };
      document.attachEvent(eventName, handler);
    }
  };

  /**
   * Load a component
   *
   * @param {String} componentName
   * @param {Object} options
   * @param {Boolean} options.force if true, insert a script tag always
   * @param {Function} callback
   */
  instance.loadComponent = function (componentName, options, callback) {
    if (callback === undefined && typeof(options) === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};

    if (typeof(callback) !== 'function') callback = function () {};

    // if this component is already loaded, call callback and return
    if (!options['force'] && instance.isComponentLoaded(componentName)) {
      setTimeout(callback, 0);
      return;
    }

    // setup load event
    var loaded = false;
    addLoadListener(componentName, function() {
      if (loaded) return;
      loaded = true;
      callback.apply(this, arguments);
    });

    var retried = false;
    var load = function() {
      var src = componentSrc(componentName, options);
      if (options['force'] || !instance.tag.isScriptInserted(src)) {
        var retry = function() {
          if (loaded || retried) return;
          retried = true;
          options.failover = true;
          load();
        };
        var attrs = {}
        // retry if the CDN returns an error.
        attrs.onerror = retry;
        attrs.onreadystatechange = function() {
          if (this.readyState === 'loaded' || this.readyState === 'complete') retry();
        };
        // retry if loading is timed out.
        setTimeout(retry, DATA_TIMEOUT);
      }
      instance.tag.insertScriptBefore(src, attrs);
    }
    load();
  };

  /**
   * Load data as JSON
   * @param {Function} callback
   */
  instance.loadDataJson = function(callback) {
    var src = dataJsonSrc();

    instance.c('Utils').sendRequestAsJson('GET', src, callback, errorFailover);

    function errorFailover(reason) {
      // Ignore 204 response (page doesn't exist or isn't published).
      if (reason && reason.status === 204) {
        return;
      }
      var src = dataJsonSrc({failover: true});
      instance.c('Utils').sendRequestAsJson('GET', src, callback, function() {})
    }
  };

  instance.loadSavedData = function(callback, errorCallback) {
    var src = savedDataJsonSrc();
    instance.c('Utils').sendRequestAsJson('GET', src, callback, errorCallback)
  };

  instance.loadPreviewData = function(signature, callback, errorCallback) {
    var src = previewDataJsonSrc(signature);
    instance.c('Utils').sendRequestAsJson('GET', src, callback, errorCallback)
  };

  instance.loadComponents = function(componentNames, callbacks) {
    var newComponentNames = [];
    for (var i = 0; i < componentNames.length; ++i) {
      var componentName = componentNames[i];
      var callback = callbacks[componentName] || function() {};
      if (instance.isComponentLoaded(componentName)) {
        setTimeout(callback, 0);
      } else {
        addLoadListener(componentName, callback);
        newComponentNames.push(componentName);
      }
    }
    if (newComponentNames.length) instance.tag.insertScriptBefore(componentSrc(newComponentNames.join('+')));
  };

  /**
   * Load domain's option
   * @param {Function} callback called when succeed
   * @param {Function} errorCallback called when fail
   */
  instance.loadDomainOption = function(callback, errorCallback) {
    var key = instance.tag.getAttribute('key');
    if (!key) return;
    var retried = false;
    var loaded = false;
    var onsuccess = function(data, headers) {
      if (loaded) return;
      loaded = true;

      // Convert data to another format, only when in dev mode
      data = instance.c('Utils').convertCssStyles(data)

      // In IE9, cannot access custom headers using XDomainRequest...
      var countryCode = null;
      if (headers) {
        // some browser need to access header by lowercase.
        var headerNames = ['Country-Code', 'country-code'];
        for (var i = 0; i < headerNames.length; i++) {
          var headerName = headerNames[i];
          if (headers[headerName]) {
            countryCode = headers[headerName];
            break;
          }
        }
        if (countryCode) {
          data['countryCode'] = countryCode;
        }
      }

      if (!countryCode && instance.c('Data').needsCountryCode(data)) {
        instance.loadCountryCode(function(jsonData) {
          if (jsonData && jsonData['countryCode']) {
            data['countryCode'] = jsonData['countryCode'];
          }
          callback(data);
        }, function() {})
        return
      }

      callback(data);
    };
    var onerror = function() {
      if (loaded) return;
      if (retried) {
        errorCallback.apply(this, arguments);
      } else {
        retried = true;
        load(instance.c('RailsBridge')['cdnOriginHost']);
      }
    };
    var load = function(host) {
        var puny_host = instance.c('PunyCode').toASCII(getRealLocation().hostname)
        var option_url = host + '/domain/options/' + key + '?v=20180414&host=' + puny_host;
        instance.c('Utils').sendRequestAsJson('GET', option_url, onsuccess, onerror);
    };
    load(instance.c('RailsBridge')['requestWidgetHost']);
    setTimeout(onerror, DATA_TIMEOUT);
  };

  instance.loadCountryCode = function(callback, errorCallback) {
    var loaded = false;
    var onsuccess = function() {
      loaded = true;
      callback.apply(this, arguments);
    };
    var onerror = function() {
      if (loaded) return;
      errorCallback.apply(this, arguments);
    };
    // Request must not go to CDN server
    var option_url = instance.c('RailsBridge')['cdnOriginHost'] + '/inspect/country';
    instance.c('Utils').sendRequestAsJson('GET', option_url, onsuccess, onerror);
    setTimeout(onerror, DATA_TIMEOUT);
  };

  /**
   * Get translated values
   * @param values {Array<String>} original values
   * @param callback
   * @param errorCallback
   */
  instance.loadTranslation = function(values, callback, errorCallback) {
    if (isDisableLoadTranslation) { return; }
    var defaultCode = instance.c('Lang').getDefaultCodeIfExists();
    // Must not be called before load page.
    if (!defaultCode) return;

    var key = instance.tag.getAttribute('key');
    if (!key) return;
    var url = instance.c('RailsBridge')['apiHost'] + 'values/translate';
    var data = {
      srcs: values,
      defaultLang: defaultCode,
      token: key,
      host: getRealLocation().hostname
    }
    instance.c('Utils').postJsonRequest(url, data, callback, errorCallback);
  }

  instance.disableLoadTranslation = function() {
    isDisableLoadTranslation = true
  }

  instance.clearCacheData = function() {
    cachedData = []
  }

  instance.reloadData = function(callback) {
    var encodedLocation = getEncodedLocation();
    var cache = null;
    for (var i = 0; i < cachedData.length; ++i) {
      if (cachedData[i].encodedLocation === encodedLocation) {
        cache = cachedData[i];
        break;
      }
    }
    if (cache) {
      callback(cache.data);
    } else {
      instance.c('Interface').loadData(function(data) {
        cachedData.unshift({encodedLocation: encodedLocation, data: data});

        // To not use much memory.
        if (cachedData.length > 50) cachedData.pop();

        callback(data);
      });
    }
  };

  instance.removeComponentScript = function(componentName, options) {
    instance.tag.removeScript(componentSrc(componentName, options));
  };

  var destroyComponent = function(componentName) {
    if (typeof(installedComponents[componentName].destroy) === 'function') {
      installedComponents[componentName].destroy();
    }
  };

  instance.destroy = function () {
    for (componentName in installedComponents){
      if (installedComponents.hasOwnProperty(componentName)) destroyComponent(componentName);
    }
  };

  instance.reinstallComponent = function(componentName) {
    destroyComponent(componentName);
    installedComponents[componentName] = new components[componentName](instance);
  };

  instance.getBackendCurrentLang = function () {
    return instance.tag.getAttribute('currentLang');
  }

  /**
   * Gets the current location of the browser without the backend-inserted lang code
   *
   * @return {string} The unicode-safe location of this browser without the lang code
   */
  function getEncodedLocation (currentLocation) {
    // not all browsers handle unicode characters in the path the same, so we have this long mess to handle it
    // TODO: decodeURIcomponent doesnt handle the case where location has char like this: &submit=%8E%9F%82%D6%90i%82%DE (characters encoded in shift_jis)
    // adding unescape before it makes the error go away but doesnt fix the pb and creates pb for utf8 encode params
    if (!currentLocation)
      currentLocation = location;
    if (typeof(currentLocation) !== 'string') {
      var punyHost = instance.c('PunyCode').toASCII(currentLocation.host);
      currentLocation = currentLocation.protocol + '//' + punyHost + currentLocation.pathname + currentLocation.search;
    }

    var urlFormatter = instance.c('UrlFormatter').createFromUrl(currentLocation);
    currentLocation = urlFormatter.getNormalizedPageUrl(instance.tag.getAttribute('backend'), instance.tag.getAttribute('urlPattern'));
    return encodeURIComponent(currentLocation);
  }
  instance.getEncodedLocation = getEncodedLocation;

  /**
   * Gets the current location Object of the browser without the backend-inserted lang code
   *
   * @return {object} An object imitating the location, without the backend inserted lang code
   */
  function getRealLocation (currentLocation) {
    var fakeLocation = currentLocation || location;
    currentLocation = {}
    currentLocation.protocol = fakeLocation.protocol;
    currentLocation.search = fakeLocation.search;
    currentLocation.href = fakeLocation.href;
    currentLocation.host = fakeLocation.host;
    currentLocation.port = fakeLocation.port;
    currentLocation.hostname = fakeLocation.hostname;
    currentLocation.origin = fakeLocation.origin;
    currentLocation.pathname = fakeLocation.pathname;

    if (instance.tag.getAttribute('backend')) {
      var langIdentifier = instance.c('Lang').getBackendLangIdentifier();
      switch (instance.tag.getAttribute('urlPattern')) {
        case 'query':
          currentLocation.search = currentLocation.search.replace(new RegExp('(\\?|&)wovn=' + langIdentifier + '(&|$)'), '$1').replace(/(\?|&)$/, '');
          currentLocation.href = currentLocation.href.replace(new RegExp('(\\?|&)wovn=' + langIdentifier + '(&|$)'), '$1').replace(/(\?|&)$/, '');
          break;
        case 'subdomain':
          currentLocation.host = currentLocation.host.replace(new RegExp('^' + langIdentifier + '\\.', 'i'), '');
          currentLocation.hostname = currentLocation.hostname.replace(new RegExp('^' + langIdentifier + '\\.', 'i'), '');
          currentLocation.href = currentLocation.href.replace(new RegExp('//' + langIdentifier + '\\.', 'i'), '//');
          currentLocation.origin = currentLocation.origin.replace(new RegExp('//' + langIdentifier + '\\.', 'i'), '//');
          break;
        case 'custom_domain':
          var customDomainLanguages = instance.c('CustomDomainLanguages');
          currentLocation.host = customDomainLanguages.removeLanguageFromUrlHost(currentLocation.host, langIdentifier);
          currentLocation.hostname = customDomainLanguages.removeLanguageFromUrlHost(currentLocation.hostname, langIdentifier);
          currentLocation.href = customDomainLanguages.removeLanguageFromAbsoluteUrl(currentLocation.href, langIdentifier);
          currentLocation.origin = customDomainLanguages.removeLanguageFromAbsoluteUrl(currentLocation.origin, langIdentifier);
          break;
        case 'path':
          currentLocation.href = currentLocation.href.replace(new RegExp('(//[^/]+)/' + langIdentifier + '(/|$)'), '$1/');
          currentLocation.pathname = currentLocation.pathname.replace(new RegExp('/' + langIdentifier + '(/|$)'), '/');
      }
    }
    return currentLocation;
  }
  instance.getRealLocation = getRealLocation;

  /**
   * For some reason, perhaps only during tests, widget is initialize more than
   * once, causing `Widget.ts` to be out of sync with the current widget
   * instance.
   */
  if (window.WOVN && WOVN.io && WOVN.io._private) {
    WOVN.io._private.widget = instance;
  }

  return instance;

};

var widget = Widget(components);

// old widget compatibility
document.appendM17nJs = function (res) {
  var components = {};
  components['Data'] = function (widget) {
    var that = this;
    var data = res;

    this.get = function () {
      return data;
    };

    this.set = function (setData) {
      data = setData;
    };

    this.getLang = function () {
      return data['language'];
    };

    this.getUserId = function () {
      return data['user_id'];
    };

    this.getPageId = function () {
      return data['id'];
    };

    this.getPublishedLangs = function () {
      return data['published_langs'];
    };

    this.getOptions = function () {
      return data['widgetOptions'];
    };

    this.dynamicValues = function () {
      return data['dynamic_values'] || (that.getOptions() || {})['dynamic_values'] || false;
    };

  };

  for (var componentName in components){if(components.hasOwnProperty(componentName)) {
    document.WOVNIO.registerComponent(componentName, components[componentName]);
  }}
};


/**
 * After all components migrated to typescript, this component will be the
 * only place to contain variables from Rails
 */
if (typeof(components) === 'undefined') var components = {};
components['RailsBridge'] = function () {
  return {
    langHash: {"ar":{"name":"العربية","code":"ar","en":"Arabic","use_word_boundary":false,"unit_type":"word"},"eu":{"name":"Euskara","code":"eu","en":"Basque","use_word_boundary":true,"unit_type":"word"},"bn":{"name":"বাংলা ভাষা","code":"bn","en":"Bengali","use_word_boundary":true,"unit_type":"word"},"bg":{"name":"Български","code":"bg","en":"Bulgarian","use_word_boundary":true,"unit_type":"word"},"ca":{"name":"Català","code":"ca","en":"Catalan","use_word_boundary":true,"unit_type":"word"},"zh-CHS":{"name":"简体中文","code":"zh-CHS","en":"Simp Chinese","use_word_boundary":false,"unit_type":"character"},"zh-CHT":{"name":"繁體中文","code":"zh-CHT","en":"Trad Chinese","use_word_boundary":false,"unit_type":"character"},"da":{"name":"Dansk","code":"da","en":"Danish","use_word_boundary":true,"unit_type":"word"},"nl":{"name":"Nederlands","code":"nl","en":"Dutch","use_word_boundary":true,"unit_type":"word"},"en":{"name":"English","code":"en","en":"English","use_word_boundary":true,"unit_type":"word"},"fi":{"name":"Suomi","code":"fi","en":"Finnish","use_word_boundary":true,"unit_type":"word"},"fr":{"name":"Français","code":"fr","en":"French","use_word_boundary":true,"unit_type":"word"},"gl":{"name":"Galego","code":"gl","en":"Galician","use_word_boundary":true,"unit_type":"word"},"de":{"name":"Deutsch","code":"de","en":"German","use_word_boundary":true,"unit_type":"word"},"el":{"name":"Ελληνικά","code":"el","en":"Greek","use_word_boundary":true,"unit_type":"word"},"he":{"name":"עברית","code":"he","en":"Hebrew","use_word_boundary":true,"unit_type":"word"},"hu":{"name":"Magyar","code":"hu","en":"Hungarian","use_word_boundary":true,"unit_type":"word"},"id":{"name":"Bahasa Indonesia","code":"id","en":"Indonesian","use_word_boundary":true,"unit_type":"word"},"it":{"name":"Italiano","code":"it","en":"Italian","use_word_boundary":true,"unit_type":"word"},"ja":{"name":"日本語","code":"ja","en":"Japanese","use_word_boundary":false,"unit_type":"character"},"ko":{"name":"한국어","code":"ko","en":"Korean","use_word_boundary":false,"unit_type":"character"},"lv":{"name":"Latviešu","code":"lv","en":"Latvian","use_word_boundary":true,"unit_type":"word"},"ms":{"name":"Bahasa Melayu","code":"ms","en":"Malay","use_word_boundary":true,"unit_type":"word"},"my":{"name":"ဗမာစာ","code":"my","en":"Burmese","use_word_boundary":true,"unit_type":"word"},"ne":{"name":"नेपाली भाषा","code":"ne","en":"Nepali","use_word_boundary":true,"unit_type":"word"},"no":{"name":"Norsk","code":"no","en":"Norwegian","use_word_boundary":true,"unit_type":"word"},"fa":{"name":"زبان_فارسی","code":"fa","en":"Persian","use_word_boundary":true,"unit_type":"word"},"pl":{"name":"Polski","code":"pl","en":"Polish","use_word_boundary":true,"unit_type":"word"},"pt":{"name":"Português","code":"pt","en":"Portuguese","use_word_boundary":true,"unit_type":"word"},"ru":{"name":"Русский","code":"ru","en":"Russian","use_word_boundary":true,"unit_type":"word"},"es":{"name":"Español","code":"es","en":"Spanish","use_word_boundary":true,"unit_type":"word"},"sw":{"name":"Kiswahili","code":"sw","en":"Swahili","use_word_boundary":true,"unit_type":"word"},"sv":{"name":"Svensk","code":"sv","en":"Swedish","use_word_boundary":true,"unit_type":"word"},"tl":{"name":"Tagalog","code":"tl","en":"Tagalog","use_word_boundary":true,"unit_type":"word"},"th":{"name":"ภาษาไทย","code":"th","en":"Thai","use_word_boundary":false,"unit_type":"character"},"hi":{"name":"हिन्दी","code":"hi","en":"Hindi","use_word_boundary":true,"unit_type":"word"},"tr":{"name":"Türkçe","code":"tr","en":"Turkish","use_word_boundary":true,"unit_type":"word"},"uk":{"name":"Українська","code":"uk","en":"Ukrainian","use_word_boundary":true,"unit_type":"word"},"ur":{"name":"اردو","code":"ur","en":"Urdu","use_word_boundary":false,"unit_type":"word"},"vi":{"name":"Tiếng Việt","code":"vi","en":"Vietnamese","use_word_boundary":true,"unit_type":"word"}},
    domainCssStyles: {"style":{"default":{"position":{"bottom_left":"#wovn-translate-widget[wovn] {\n  bottom: 20px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border-radius: 0 5px 5px 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  bottom: 34px;\n  left: 8px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  bottom: 44px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container {\n  bottom: 46px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container.is-open {\n  bottom: 56px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  width: 100%;\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 12px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open {\n  bottom: 44px;\n}","bottom_right":"#wovn-translate-widget[wovn] {\n  bottom: 20px;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border-radius: 5px 0 0 5px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  bottom: 34px;\n  left: 8px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  bottom: 44px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container {\n  bottom: 46px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container.is-open {\n  bottom: 56px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  width: 100%;\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 12px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open {\n  bottom: 44px;\n}","top_left":"#wovn-translate-widget[wovn] {\n  top: 20px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border-radius: 0 5px 5px 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  top: 34px;\n  left: 8px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  top: 44px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  width: 100%;\n  bottom: 0;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 12px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open {\n  bottom: 44px;\n}","top_right":"#wovn-translate-widget[wovn] {\n  top: 20px;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border-radius: 5px 0 0 5px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  top: 34px;\n  left: 8px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  top: 44px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  width: 100%;\n  bottom: 0;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 12px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open {\n  bottom: 44px;\n}"},"form":"#wovn-translate-widget[wovn] {\n  box-sizing: border-box;\n  z-index: 9999999999;\n  border-radius: 5px;\n  text-align: left;\n  position: fixed;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-sizing: border-box;\n  position: relative;\n  cursor: pointer;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  box-sizing: border-box;\n  position: relative;\n  cursor: pointer;\n  line-height: 0;\n  display: block;\n  padding: 8px;\n  width: 100%;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  box-sizing: border-box;\n  vertical-align: middle;\n  display: inline-block;\n  position: relative;\n  border-radius: 3px;\n  font-weight: 500;\n  padding: 6px 8px;\n  min-width: 146px;\n  min-height: 32px;\n  cursor: pointer;\n  font-size: 12px;\n  z-index: 1;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  vertical-align: middle;\n  display: inline-block;\n  position: absolute;\n  margin: -4px 0 0;\n  line-height: 0;\n  height: 8px;\n  width: 12px;\n  right: 8px;\n  top: 50%;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  vertical-align: middle;\n  display: inline-block;\n  text-align: center;\n  position: relative;\n  cursor: pointer;\n  line-height: 0;\n  height: 9px;\n  width: auto;\n  z-index: 2;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small #wovn-logo--default {\n  margin: 0 0 0 8px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small #wovn-logo--floating {\n  display: none;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector #translated-by-machine {\n  border-radius: 0 0 5px 5px;\n  box-sizing: border-box;\n  position: relative;\n  text-align: left;\n  line-height: 3px;\n  font-weight: 500;\n  cursor: pointer;\n  font-size: 9px;\n  padding: 0 8px;\n  display: none;\n  height: 12px;\n  width: 100%;\n  z-index: 3;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  -webkit-transition: all .25s linear;\n  -moz-transition: all .25s linear;\n  -o-transition: all .25s linear;\n  transition: all .25s linear;\n\n  pointer-events: none;\n  border-radius: 5px;\n  position: absolute;\n  overflow: hidden;\n  opacity: 0;\n  z-index: 9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list {\n  box-sizing: border-box;\n  max-height: 300px;\n  min-width: 146px;\n  overflow: hidden;\n  overflow-y: scroll;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  -webkit-transition: all 0.2s linear;\n  -moz-transition: all 0.2s linear;\n  -o-transition: all 0.2s linear;\n  transition: all 0.2s linear;\n\n  padding: 16px 16px 16px 28px;\n  position: relative;\n  font-weight: 500;\n  font-size: 12px;\n  cursor: pointer;\n  line-height: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  top: calc(50% - 4px);\n  border-radius: 50%;\n  position: absolute;\n  content: '';\n  height: 8px;\n  width: 8px;\n  left: 12px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  display: none;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg {\n  height: 8px;\n  width: 56px;\n}\n\n","colors":{"default_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #f6f8fa;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid #dee5ec;\n  background-color: #ffffff;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjNTQ1RjY2IiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMjMuMDc4IDE4LjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDEyNiAyMS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyMCAtMTcpIi8+Cjwvc3ZnPgo=');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(84, 95, 102, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #f6f8fa;\n  color: #82959f;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","default":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #f6f8fa;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid #dee5ec;\n  background-color: #ffffff;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjNTQ1RjY2IiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMjMuMDc4IDE4LjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDEyNiAyMS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyMCAtMTcpIi8+Cjwvc3ZnPgo=');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(84, 95, 102, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #f6f8fa;\n  color: #82959f;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","gray_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid #545f66;\n  background-color: #394045;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICAgIDxwYXRoIGZpbGw9IiM3NjdGODUiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTExNS4wNzggMTIuMTg1YS42MzIuNjMyIDAgMSAwLS44OTMuODkzbDMuMzY5IDMuMzY5YS42MzIuNjMyIDAgMCAwIC44OTMgMGwzLjM2OC0zLjM2OWEuNjMyLjYzMiAwIDEgMC0uODkzLS44OTNMMTE4IDE1LjEwN2wtMi45MjItMi45MjJ6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEyIC0xMSkiLz4KPC9zdmc+');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #394045;\n  color: #bdc4c8;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","gray":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid #545f66;\n  background-color: #394045;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICAgIDxwYXRoIGZpbGw9IiM3NjdGODUiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTExNS4wNzggMTIuMTg1YS42MzIuNjMyIDAgMSAwLS44OTMuODkzbDMuMzY5IDMuMzY5YS42MzIuNjMyIDAgMCAwIC44OTMgMGwzLjM2OC0zLjM2OWEuNjMyLjYzMiAwIDEgMC0uODkzLS44OTNMMTE4IDE1LjEwN2wtMi45MjItMi45MjJ6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEyIC0xMSkiLz4KPC9zdmc+');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #394045;\n  color: #bdc4c8;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","red_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #ed8076;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ed8076;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","red":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #ed8076;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ed8076;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","orange_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #ffad60;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ffad60;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","orange":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #ffad60;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ffad60;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","green_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #40b87c;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #40b87c;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","green":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #40b87c;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #40b87c;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","blue_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #52b0e9;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #52b0e9;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","blue":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #52b0e9;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #52b0e9;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","deepblue_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #6b82e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #6b82e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","deepblue":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #6b82e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #6b82e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","purple_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #ae84e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ae84e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","purple":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  background-color: #ae84e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.1);\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ae84e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}"}},"floating":{"position":{"bottom_right":"#wovn-translate-widget[wovn] {\n  bottom: 16px;\n  right: 16px;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  transform-origin: right bottom;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  bottom: 0;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: 8px;\n  right: 8px;\n  opacity: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 8px;\n  right: 8px;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: 4px;\n  right: 4px;\n  opacity: 0;\n}\n","bottom_left":"#wovn-translate-widget[wovn] {\n  bottom: 16px;\n  left: 16px;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  transform-origin: left bottom;\n  bottom: 0;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: 8px;\n  right: 8px;\n  opacity: 0;\n  left: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  transform-origin: right bottom;\n  left: auto;\n  bottom: 0;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 8px;\n  right: 8px;\n  opacity: 1;\n  left: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: 4px;\n  right: 4px;\n  opacity: 0;\n  left: auto;\n}","top_left":"#wovn-translate-widget[wovn] {\n  top: 16px;\n  left: 16px;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  transform-origin: left top;\n  left: 0;\n  top: 0;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: 8px;\n  right: 8px;\n  opacity: 0;\n  left: auto;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  transform-origin: right bottom;\n  left: auto;\n  top: auto;\n  bottom: 0;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 8px;\n  right: 8px;\n  opacity: 1;\n  left: auto;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: 4px;\n  right: 4px;\n  opacity: 0;\n  left: auto;\n  top: auto;\n}","top_right":"#wovn-translate-widget[wovn] {\n  top: 16px;\n  right: 16px;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  transform-origin: right top;\n  right: 0;\n  top: 0;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: 8px;\n  right: 8px;\n  opacity: 0;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  transform-origin: right bottom;\n  bottom: 0;\n  top: auto;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 300ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  bottom: 8px;\n  right: 8px;\n  opacity: 1;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 300ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  bottom: 4px;\n  right: 4px;\n  opacity: 0;\n  top: auto;\n}\n"},"form":"#wovn-translate-widget[wovn] {\n  box-sizing: border-box;\n  z-index: 9999999999;\n  border-radius: 5px;\n  text-align: left;\n  position: fixed;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector {\n  -webkit-transition: all 0.25s ease-out 0.2s;\n  -moz-transition: all 0.25s ease-out 0.2s;\n  -o-transition: all 0.25s ease-out 0.2s;\n  transition: all 0.25s ease-out 0.2s;\n\n  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.1);\n  box-sizing: border-box;\n  border-radius: 5px;\n  position: relative;\n  cursor: pointer;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  padding: 8px 32px 8px 8px;\n  box-sizing: border-box;\n  position: relative;\n  cursor: pointer;\n  line-height: 0;\n  display: block;\n  width: 100%;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  display: inline-block;\n  position: relative;\n  font-weight: 600;\n  cursor: pointer;\n  font-size: 12px;\n  z-index: 1;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  pointer-events: none;\n  text-align: center;\n  position: absolute;\n  margin-top: -5px;\n  cursor: pointer;\n  line-height: 0;\n  display: block;\n  height: 9px;\n  width: auto;\n  z-index: 2;\n  opacity: 1;\n  right: 8px;\n  top: 50%;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small #wovn-logo--floating {\n  height: 10px;\n  width: 21px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small #wovn-logo--default {\n  display: none;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector #translated-by-machine {\n  border-radius: 0 0 5px 5px;\n  box-sizing: border-box;\n  text-align: center;\n  position: relative;\n  line-height: 16px;\n  font-weight: 500;\n  cursor: pointer;\n  font-size: 9px;\n  padding: 0 8px;\n  display: none;\n  height: 16px;\n  width: 100%;\n  z-index: 3;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  -webkit-transition: all 0.25s cubic-bezier(0.030, 0.630, 0.355, 1);\n  -moz-transition: all 0.25s cubic-bezier(0.030, 0.630, 0.355, 1);\n  -o-transition: all 0.25s cubic-bezier(0.030, 0.630, 0.355, 1);\n  transition: all 0.25s cubic-bezier(0.030, 0.630, 0.355, 1);\n  -webkit-transform: scale(0);\n  -moz-transform: scale(0);\n  -o-transform: scale(0);\n  transform: scale(0);\n\n  pointer-events: none;\n  border-radius: 5px;\n  position: absolute;\n  overflow: hidden;\n  opacity: 0;\n  z-index: 9;\n\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list {\n  max-height: 300px;\n  min-width: 108px;\n  overflow: hidden;\n  overflow-y: scroll;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  -webkit-transition: all 0.2s linear;\n  -moz-transition: all 0.2s linear;\n  -o-transition: all 0.2s linear;\n  transition: all 0.2s linear;\n\n  position: relative;\n  padding: 10px 28px;\n  font-weight: 600;\n  font-size: 12px;\n  cursor: pointer;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  top: calc(50% - 4px);\n  border-radius: 50%;\n  position: absolute;\n  content: '';\n  height: 8px;\n  width: 8px;\n  left: 12px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  box-sizing: border-box;\n  display: inline-block;\n  text-align: center;\n  padding-top: 12px;\n  cursor: pointer;\n  line-height: 1;\n  height: 36px;\n  width: 100%;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  -webkit-animation: bounced 0.25s forwards;\n  -moz-animation: bounced 0.25s forwards;\n  -o-animation: bounced 0.25s forwards;\n  animation: bounced 0.25s forwards;\n\n  pointer-events: auto;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open + .wovn-lang-selector {\n  -webkit-transition: all 0.25s ease-in-out;\n  -moz-transition: all 0.25s ease-in-out;\n  -o-transition: all 0.25s ease-in-out;\n  transition: all 0.25s ease-in-out;\n\n  pointer-events: none;\n  opacity: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg {\n  height: 10px;\n  width: 61px;\n}\n\n@keyframes bounced {\n  0% {\n    transform: scale(0);\n  }\n  85% {\n    transform: scale(1.02);\n  }\n  100% {\n    transform: scale(1);\n  }\n}\n\n@-webkit-keyframes bounced {\n  0% {\n    -webkit-transform: scale(0);\n  }\n  85% {\n    -webkit-transform: scale(1.02);\n  }\n  100% {\n    -webkit-transform: scale(1);\n  }\n}\n\n@-moz-keyframes bounced {\n  0% {\n    -moz-transform: scale(0);\n  }\n  85% {\n    -moz-transform: scale(1.02);\n  }\n  100% {\n    -moz-transform: scale(1);\n  }\n}\n\n@-o-keyframes bounced {\n  0% {\n    -o-transform: scale(0);\n  }\n  85% {\n    -o-transform: scale(1.02);\n  }\n  100% {\n    -o-transform: scale(1);\n  }\n}","colors":{"default_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #82959f;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #eef3f7;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid #eef3f7;\n}\n","default":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #82959f;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #eef3f7;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid #eef3f7;\n}\n","gray_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #8f9aa0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #282c30;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #282c30;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #545f66;\n  color: #bdc4c8;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(246, 248, 250, 0.1);\n}","gray":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #8f9aa0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #282c30;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #282c30;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #545f66;\n  color: #bdc4c8;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(246, 248, 250, 0.1);\n}","red_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #e96f66;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","red":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #e96f66;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","orange_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ff9f50;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","orange":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ffad60;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #ff9f50;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","green_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #32a862;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","green":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #32a862;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","blue_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #44a2e3;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","blue":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #44a2e3;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","deepblue_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #5e75e1;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}\n","deepblue":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #5e75e1;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}\n","purple_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #a073e0;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","purple":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #a073e0;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}","custom_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #812990;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #812990;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #6D227A;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #6D227A;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #6D227A;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small.wovn-logo--custom {\n  display: block!important;\n  height: 21px;\n  top: 10px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small.wovn-logo--custom #wovn-logo--floating.wovn-logo--floating--custom {\n  cursor: normal;\n  height: 21px;\n  width: 21px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  padding: 8px 32px 8px 8px!important;\n}\n","custom":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  background-color: #812990;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\n  background-color: #812990;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #6D227A;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #6D227A;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #6D227A;\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small.wovn-logo--custom {\n  display: block!important;\n  height: 21px;\n  top: 10px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small.wovn-logo--custom #wovn-logo--floating.wovn-logo--floating--custom {\n  cursor: normal;\n  height: 21px;\n  width: 21px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  padding: 8px 32px 8px 8px!important;\n}\n"}},"slate":{"position":{"bottom_left":"#wovn-translate-widget[wovn] {\n  bottom: 20px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border-bottom: none!important;\n  bottom: 46px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container {\n  bottom: 26px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container {\n  bottom: 42px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container {\n  bottom: 65px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  bottom: 56px;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container.is-open {\n  bottom: 36px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container.is-open {\n  bottom: 52px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container.is-open {\n  bottom: 75px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  left: -100%;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  left: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  left: -100%;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  width: 100%;\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 11px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open {\n  bottom: 42px;\n}\n\n#wovn-translate-widget[wovn].mobile.hide-logo .wovn-lang-container.is-open {\n  bottom: 42px;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-container.is-open {\n  bottom: 42px;\n}\n\n#wovn-translate-widget[wovn].mobile.hide-logo.show-tbm .wovn-lang-container.is-open {\n  bottom: 42px;\n}","bottom_right":"#wovn-translate-widget[wovn] {\n  bottom: 20px;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border-bottom: none!important;\n  bottom: 46px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container {\n  bottom: 26px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container {\n  bottom: 42px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container {\n  bottom: 65px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  bottom: 56px;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container.is-open {\n  bottom: 36px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container.is-open {\n  bottom: 52px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container.is-open {\n  bottom: 77px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  width: 100%;\n  bottom: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 11px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.hide-logo .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.hide-logo.show-tbm .wovn-lang-container.is-open {\n  bottom: 42px;\n}","top_left":"#wovn-translate-widget[wovn] {\n  top: 20px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border-top: none!important;\n  top: 46px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 23px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  position: absolute!important;\n  top: -23px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  top: 59px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container {\n  top: 65px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 42px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  position: absolute;\n  top: -42px;\n  margin: 0;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-selector #translated-by-machine {\n  position: absolute;\n  top: 19px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container.is-open {\n  top: 75px;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container.is-open {\n  top: 36px;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 0;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container {\n  border-top: none;\n  top: 26px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container {\n  top: 42px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container.is-open {\n  top: 52px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 16px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-selector #translated-by-machine {\n  position: absolute;\n  top: 0;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n\n  bottom: 0;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n\n  bottom: -48px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  margin-top: 0;\n  width: 100%;\n  bottom: 0;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  top: auto!important;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 11px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.hide-logo .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.hide-logo.show-tbm .wovn-lang-container.is-open {\n  border-bottom: none;\n  bottom: 42px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links,\n#wovn-translate-widget[wovn].mobile.hide-logo .wovn-lang-selector .wovn-lang-selector-links,\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links,\n#wovn-translate-widget[wovn].mobile.hide-logo.show-tbm .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 0;\n}","top_right":"#wovn-translate-widget[wovn] {\n  top: 20px;\n  right: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border-top: none!important;\n  top: 46px;\n  left: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 23px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  position: absolute!important;\n  top: -23px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  top: 59px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container {\n  top: 65px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 42px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  position: absolute;\n  top: -42px;\n  margin: 0;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-selector #translated-by-machine {\n  position: absolute;\n  top: 19px;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-container.is-open {\n  top: 75px;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container.is-open {\n  top: 36px;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 0;\n}\n\n#wovn-translate-widget[wovn].hide-logo .wovn-lang-container {\n  border-top: none;\n  top: 26px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container {\n  top: 42px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-container.is-open {\n  top: 52px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 16px;\n}\n\n#wovn-translate-widget[wovn].hide-logo.show-tbm .wovn-lang-selector #translated-by-machine {\n  position: absolute;\n  top: 0;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  bottom: -48px;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-in {\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1);\n  -webkit-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -moz-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  -o-transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n  transition: all 400ms cubic-bezier(0.085, 0.415, 0.285, 1.060);\n\n  bottom: 0;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.slide-out {\n  -webkit-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -moz-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  -o-transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n  transition: all 400ms cubic-bezier(0.125, 0.540, 0.450, 0.940);\n\n  bottom: -48px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile {\n  margin-top: 0;\n  width: 100%;\n  bottom: 0;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector {\n  border-radius: 0;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: calc(50% - 4px);\n  position: absolute;\n  line-height: 0;\n  height: 8px;\n  right: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  background-color: transparent;\n  top: auto!important;\n  position: absolute;\n  text-align: right;\n  line-height: 1;\n  bottom: 8px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container {\n  bottom: 34px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  top: 11px;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.hide-logo .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-container.is-open,\n#wovn-translate-widget[wovn].mobile.hide-logo.show-tbm .wovn-lang-container.is-open {\n  border-bottom: none;\n  bottom: 42px;\n  top: auto;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links,\n#wovn-translate-widget[wovn].mobile.hide-logo .wovn-lang-selector .wovn-lang-selector-links,\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links,\n#wovn-translate-widget[wovn].mobile.hide-logo.show-tbm .wovn-lang-selector .wovn-lang-selector-links {\n  margin-top: 0;\n}\n"},"form":"#wovn-translate-widget[wovn] {\n  box-sizing: border-box;\n  z-index: 9999999999;\n  text-align: left;\n  position: fixed;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector {\n  box-sizing: border-box;\n  position: relative;\n  cursor: pointer;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  box-sizing: border-box;\n  padding: 0!important;\n  position: relative;\n  cursor: pointer;\n  line-height: 0;\n  display: block;\n  width: 100%;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  box-sizing: border-box;\n  position: relative;\n  min-width: 144px;\n  min-height: 34px;\n  font-weight: 500;\n  line-height: 1.5;\n  cursor: pointer;\n  font-size: 12px;\n  display: block;\n  padding: 8px;\n  z-index: 1;\n  outline: 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  display: inline-block;\n  padding: 14px 8px;\n  line-height: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  vertical-align: middle;\n  display: inline-block;\n  position: absolute;\n  margin: -4px 0 0;\n  line-height: 0;\n  height: 8px;\n  width: 12px;\n  right: 8px;\n  top: 50%;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  vertical-align: middle;\n  box-sizing: border-box;\n  display: inline-block;\n  text-align: center;\n  position: relative;\n  padding: 6px 0 0;\n  cursor: pointer;\n  line-height: 0;\n  height: 20px;\n  width: 100%;\n  z-index: 2;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn].show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  padding: 10px 0 0;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  height: auto;\n  width: auto;\n  padding: 0;\n  margin: 0;\n}\n\n#wovn-translate-widget[wovn].mobile.show-tbm .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  padding: 0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small #wovn-logo--floating {\n  display: none;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector #translated-by-machine {\n  box-sizing: border-box;\n  position: relative;\n  text-align: center;\n  font-weight: 500;\n  padding: 4px 8px;\n  cursor: pointer;\n  font-size: 9px;\n  display: none;\n  width: 100%;\n  z-index: 3;\n}\n\n#wovn-translate-widget[wovn].mobile .wovn-lang-selector #translated-by-machine {\n  padding: 4px 8px 0;\n  bottom: 6px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  -webkit-transition: all .25s linear;\n  -moz-transition: all .25s linear;\n  -o-transition: all .25s linear;\n  transition: all .25s linear;\n\n  pointer-events: none;\n  position: absolute;\n  max-width: 144px;\n  overflow: hidden;\n  opacity: 0;\n  z-index: 9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list {\n  box-sizing: border-box;\n  min-width: 144px;\n  max-height: 300px;\n  overflow: hidden;\n  overflow-y: scroll;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  -webkit-transition: all 0.2s linear;\n  -moz-transition: all 0.2s linear;\n  -o-transition: all 0.2s linear;\n  transition: all 0.2s linear;\n\n  padding: 14px 16px 14px 28px;\n  position: relative;\n  font-weight: 500;\n  font-size: 12px;\n  cursor: pointer;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  top: calc(50% - 4px);\n  border-radius: 50%;\n  position: absolute;\n  content: '';\n  height: 8px;\n  width: 8px;\n  left: 12px;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo {\n  display: none;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container.is-open {\n  pointer-events: auto;\n  opacity: 1;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg {\n  height: 8px;\n  width: 56px;\n}","colors":{"default_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #dee5ec;\n  background-color: #f6f8fa;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #ffffff;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjNTQ1RjY2IiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMjMuMDc4IDE4LjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDEyNiAyMS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyMCAtMTcpIi8+Cjwvc3ZnPgo=');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #dee5ec;\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(84, 95, 102, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #f6f8fa;\n  color: #82959f;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","default":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #dee5ec;\n  background-color: #f6f8fa;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #ffffff;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjNTQ1RjY2IiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMjMuMDc4IDE4LjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDEyNiAyMS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyMCAtMTcpIi8+Cjwvc3ZnPgo=');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #dee5ec;\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(84, 95, 102, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #f6f8fa;\n  color: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  background-color: #f6f8fa;\n  color: #82959f;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #545f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","gray_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #2b2f32;\n  background-color: #2b2f32;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #394045;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICAgIDxwYXRoIGZpbGw9IiM3NjdGODUiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTExNS4wNzggMTIuMTg1YS42MzIuNjMyIDAgMSAwLS44OTMuODkzbDMuMzY5IDMuMzY5YS42MzIuNjMyIDAgMCAwIC44OTMgMGwzLjM2OC0zLjM2OWEuNjMyLjYzMiAwIDEgMC0uODkzLS44OTNMMTE4IDE1LjEwN2wtMi45MjItMi45MjJ6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEyIC0xMSkiLz4KPC9zdmc+');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #2b2f32;\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #2b2f32;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","gray":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #2b2f32;\n  background-color: #2b2f32;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #394045;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICAgIDxwYXRoIGZpbGw9IiM3NjdGODUiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTExNS4wNzggMTIuMTg1YS42MzIuNjMyIDAgMSAwLS44OTMuODkzbDMuMzY5IDMuMzY5YS42MzIuNjMyIDAgMCAwIC44OTMgMGwzLjM2OC0zLjM2OWEuNjMyLjYzMiAwIDEgMC0uODkzLS44OTNMMTE4IDE1LjEwN2wtMi45MjItMi45MjJ6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEyIC0xMSkiLz4KPC9zdmc+');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #2b2f32;\n  background-color: #394045;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #2b2f32;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #2b2f32;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #38b171;\n}","red_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #e96f66;\n  background-color: #e96f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #ed8076;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #e96f66;\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #e96f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","red":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #e96f66;\n  background-color: #e96f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #ed8076;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #e96f66;\n  background-color: #ed8076;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #e96f66;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #e96f66;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","orange_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #ff9f50;\n  background-color: #ff9f50;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #f9b65b;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #ff9f50;\n  background-color: #f9b65b;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #ff9f50;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","orange":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #ff9f50;\n  background-color: #ff9f50;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #f9b65b;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #ff9f50;\n  background-color: #f9b65b;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #ff9f50;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #ff9f50;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","green_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #32a862;\n  background-color: #32a862;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #40b87c;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #32a862;\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #32a862;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","green":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #32a862;\n  background-color: #32a862;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #40b87c;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #32a862;\n  background-color: #40b87c;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #32a862;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #32a862;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","blue_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #44a2e3;\n  background-color: #44a2e3;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #52b0e9;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #44a2e3;\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #44a2e3;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","blue":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #44a2e3;\n  background-color: #44a2e3;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #52b0e9;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #44a2e3;\n  background-color: #52b0e9;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #44a2e3;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #44a2e3;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","deepblue_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #5e75e1;\n  background-color: #5e75e1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #6b82e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #5e75e1;\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #5e75e1;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","deepblue":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #5e75e1;\n  background-color: #5e75e1;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #6b82e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #5e75e1;\n  background-color: #6b82e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #5e75e1;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #5e75e1;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","purple_transparent":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #a073e0;\n  background-color: #a073e0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #ae84e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #a073e0;\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #a073e0;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}","purple":"#wovn-translate-widget[wovn] .wovn-lang-selector {\n  border: solid 1px #a073e0;\n  background-color: #a073e0;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang {\n  background-color: #ae84e6;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-current-lang:after {\n  content: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA5Ij4KICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMTUuMDc4IDEyLjE4NWEuNjMyLjYzMiAwIDEgMC0uODkzLjg5M2wzLjM2OSAzLjM2OWEuNjMyLjYzMiAwIDAgMCAuODkzIDBsMy4zNjgtMy4zNjlhLjYzMi42MzIgMCAxIDAtLjg5My0uODkzTDExOCAxNS4xMDdsLTIuOTIyLTIuOTIyeiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExMiAtMTEpIi8+Cjwvc3ZnPg==');\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container {\n  border: solid 1px #a073e0;\n  background-color: #ae84e6;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li {\n  color: rgba(255, 255, 255, 0.7);\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li:hover {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected {\n  background-color: #a073e0;\n  color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.selected:before {\n  background-color: #ffffff;\n}\n\n#wovn-translate-widget[wovn] #translated-by-machine {\n  color: rgba(255, 255, 255, 0.7);\n  background-color: #a073e0;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-letter {\n  fill: #ffffff;\n}\n\n#wovn-translate-widget[wovn] .wovn-logo svg .color-dot {\n  fill: #ffffff;\n}"}}},"hide_logo":{"true":"#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links .wovn-logo--small {\n  display: none!important;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-container .wovn-logo--big {\n  display: none!important;\n}\n\n#wovn-translate-widget[wovn] .wovn-lang-selector .wovn-lang-selector-links {\n  padding: 8px!important;\n}\n\n"},"show_tbm":{"true":"#wovn-translate-widget[wovn] #translated-by-machine {\n  display: block!important;\n}"}},
    widgetStyles: "#wovn-translate-widget[wovn],\n#wovn-translate-widget[wovn] a,\n#wovn-translate-widget[wovn] div,\n#wovn-translate-widget[wovn] ul,\n#wovn-translate-widget[wovn] li,\n#wovn-translate-widget[wovn] span,\n#wovn-translate-widget[wovn] svg {\n  -webkit-tap-highlight-color: transparent;\n  -webkit-font-smoothing: antialiased;\n\n  animation : none;\n  animation-delay : 0;\n  animation-direction : normal;\n  animation-duration : 0;\n  animation-fill-mode : none;\n  animation-iteration-count : 1;\n  animation-name : none;\n  animation-play-state : running;\n  animation-timing-function : ease;\n  backface-visibility : visible;\n  background : 0;\n  background-attachment : scroll;\n  background-clip : border-box;\n  background-color : transparent;\n  background-image : none;\n  background-origin : padding-box;\n  background-position : 0 0;\n  background-position-x : 0;\n  background-position-y : 0;\n  background-repeat : repeat;\n  background-size : auto auto;\n  border : 0;\n  border-style : none;\n  border-width : medium;\n  border-color : inherit;\n  border-bottom : 0;\n  border-bottom-color : inherit;\n  border-bottom-left-radius : 0;\n  border-bottom-right-radius : 0;\n  border-bottom-style : none;\n  border-bottom-width : medium;\n  border-collapse : separate;\n  border-image : none;\n  border-left : 0;\n  border-left-color : inherit;\n  border-left-style : none;\n  border-left-width : medium;\n  border-radius : 0;\n  border-right : 0;\n  border-right-color : inherit;\n  border-right-style : none;\n  border-right-width : medium;\n  border-spacing : 0;\n  border-top : 0;\n  border-top-color : inherit;\n  border-top-left-radius : 0;\n  border-top-right-radius : 0;\n  border-top-style : none;\n  border-top-width : medium;\n  bottom : auto;\n  box-shadow : none;\n  box-sizing : content-box;\n  caption-side : top;\n  clear : none;\n  clip : auto;\n  color : inherit;\n  columns : auto;\n  column-count : auto;\n  column-fill : balance;\n  column-gap : normal;\n  column-rule : medium none currentColor;\n  column-rule-color : currentColor;\n  column-rule-style : none;\n  column-rule-width : none;\n  column-span : 1;\n  column-width : auto;\n  content : normal;\n  counter-increment : none;\n  counter-reset : none;\n  cursor : auto;\n  direction : ltr;\n  display : inline;\n  empty-cells : show;\n  float : none;\n  font : normal;\n  font-family: -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Oxygen-Sans,Ubuntu,Cantarell, \"Helvetica Neue\", \"ヒラギノ角ゴ Pro W3\", \"Hiragino Kaku Gothic Pro\", Osaka, \"メイリオ\", Meiryo, \"ＭＳ Ｐゴシック\", \"MS PGothic\", Padauk, sans-serif;\n  font-size : medium;\n  font-style : normal;\n  font-variant : normal;\n  font-weight : normal;\n  height : auto;\n  hyphens : none;\n  left : auto;\n  letter-spacing : normal;\n  line-height : normal;\n  list-style: none;\n  list-style-image : none;\n  list-style-position : inside;\n  list-style-type : none;\n  margin : 0;\n  margin-bottom : 0;\n  margin-left : 0;\n  margin-right : 0;\n  margin-top : 0;\n  max-height : none;\n  max-width : none;\n  min-height : 0;\n  min-width : 0;\n  opacity : 1;\n  orphans : 0;\n  outline : 0;\n  outline-color : invert;\n  outline-style : none;\n  outline-width : medium;\n  overflow : visible;\n  overflow-x : visible;\n  overflow-y : visible;\n  padding : 0;\n  padding-bottom : 0;\n  padding-left : 0;\n  padding-right : 0;\n  padding-top : 0;\n  page-break-after : auto;\n  page-break-before : auto;\n  page-break-inside : auto;\n  perspective : none;\n  perspective-origin : 50% 50%;\n  position : static;\n  quotes : \'\\201C\' \'\\201D\' \'\\2018\' \'\\2019\';\n  right : auto;\n  tab-size : 8;\n  table-layout : auto;\n  text-align : inherit;\n  text-align-last : auto;\n  text-decoration : none;\n  text-decoration-color : inherit;\n  text-decoration-line : none;\n  text-decoration-style : solid;\n  text-indent : 0;\n  text-shadow : none;\n  text-transform : none;\n  top : auto;\n  transform : none;\n  transform-style : flat;\n  transition : none;\n  transition-delay : 0s;\n  transition-duration : 0s;\n  transition-property : none;\n  transition-timing-function : ease;\n  unicode-bidi : normal;\n  vertical-align : baseline;\n  visibility : visible;\n  white-space: nowrap;\n  widows : 0;\n  width : auto;\n  word-spacing : normal;\n  z-index : auto;\n}\n#wovn-translate-widget[wovn] {\n  max-height : fit-content;\n  pointer-events: auto;\n}\n\n#wovn-translate-widget[wovn] div {\n  display: block;\n}\n\n#wovn-translate-widget[wovn] ul {\n  margin-bottom: 0;\n  margin-right: 0;\n  padding-left: 0;\n  display: block;\n  margin-left: 0;\n  margin-top: 0;\n  padding: 0;\n  margin: 0;\n}\n\n#wovn-translate-widget[wovn] ul::-webkit-scrollbar {\n  display: none;\n}\n\n#wovn-translate-widget[wovn] li {\n  text-align: -webkit-match-parent;\n  display: list-item;\n}\n\n#wovn-translate-widget[wovn]:focus {\n  outline: 0;\n}\n",
    unifiedValues: {
      inlineElements: ["a", "abbr", "b", "bdi", "bdo", "button", "cite", "code", "data", "dfn", "em", "i", "kbd", "label", "legend", "mark", "meter", "option", "q", "rb", "rp", "rt", "rtc", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var"],
      emptyElements: ["br", "input", "param", "source", "track", "wbr"],
      skipElements: ["base", "link", "noscript", "script", "style", "template"],
      skipElementsWithoutAttributes: ["textarea"],
    },
    tenso: {
      style: "div#wovn-tenso-modal {\n  display: none;\n  z-index: 99999999999;\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  text-align: center;\n  background: rgba(84,95,102, 0.8);\n  overflow-y: auto;\n  font-family: helvetica, arial, \'hiragino kaku gothic pro\', meiryo, \'ms pgothic\', sans-serif;\n}\n.tenso-img {\n  display: inline-block;\n}\n.raku-ichiban-img {\n  display: none;\n}\n.raku-ichiban .tenso-img {\n  display: none;\n}\n.raku-ichiban .raku-ichiban-img {\n  display: inline-block;\n}\ndiv#wovn-tenso-modal.opened {\n  display: block;\n}\ndiv.wovn-tenso-dialog {\n  width: 652px;\n  height: 396px;\n  position: relative;\n  margin: 7% auto;\n  padding: 24px 25px 16px;\n  display: inline-block;\n  border-radius: 3px;\n  opacity: 1;\n  background-color: #ffffff;\n  box-shadow: 0 19px 38px 0 rgba(0, 0, 0, 0.3), 0 15px 12px 0 rgba(0, 0, 0, 0.22);\n}\ndiv.wovn-tenso-close {\n  position: absolute;\n  width: 32px;\n  top: 16px;\n  right: 0;\n  margin: 9px;\n  line-height: 14px;\n  font-size: 30px;\n  color: #bdc4c8;\n  cursor: pointer;\n}\ndiv.wovn-tenso-header {\n  text-align: center;\n}\ndiv.wovn-tenso-logo {\n  position: absolute;\n  top: 71px;\n  left: 69px;\n}\ndiv.wovn-tenso-title {\n  text-align: center;\n  color: #545f66;\n  font-size: 20px;\n  margin-top: 27px;\n  margin-bottom: 25px;\n  height: 30px;\n}\ndiv.wovn-tenso-lang-selector {\n  display: inline-block;\n  padding: 0 5px;\n}\ndiv.wovn-tenso-lang-selector:after {\n  content: \'|\';\n  color: #8f9aa0;\n  font-size: 16px;\n}\ndiv.wovn-tenso-lang-selector:last-child:after {\n  content: \'\';\n}\nspan.wovn-tenso-lang-selector-name {\n  font-size: 14px;\n  color: #469fd6;\n  cursor: pointer;\n}\nspan.wovn-tenso-lang-selector-name.active {\n  color: #545f66;\n}\ndiv.wovn-tenso-subtitle {\n  text-align: center;\n  font-size: 14px;\n  color: #8f9aa0;\n  margin-bottom: 16px;\n  height: 42px;\n}\ndiv.wovn-tenso-subtitle span {\n  display: block;\n}\ndiv.wovn-tenso-steps {\n  height: 170px;\n  position: relative;\n}\ndiv.wovn-tenso-step {\n  text-align:center;\n  display:inline-block;\n  vertical-align: bottom;\n  width: 160px;\n  height: 140px;\n  margin: 5px 17px;\n  border-radius: 3px;\n  background-color: #ffffff;\n  border: solid 1px #e6e6e6;\n}\ndiv.wovn-tenso-step-content {\n  padding: 5px 10px;\n}\ndiv.wovn-tenso-step-title {\n  padding: 15px 0;\n  font-size: 20px;\n  color: #ff4d09;\n}\n.raku-ichiban div.wovn-tenso-step-title {\n  color: #ab263b;\n}\ndiv.wovn-tenso-step-text {\n  font-size: 14px;\n  color: #545f66;\n}\ndiv.wovn-tenso-step-separator {\n  display: inline-block;\n  color: #ff4d09;\n  position: relative;\n  margin-bottom: 70px;\n}\n.raku-ichiban div.wovn-tenso-step-separator {\n  color: #ab263b;\n}\ndiv.wovn-tenso-footer-border {\n  border-top: 1px solid rgba(0,0,0, 0.12);\n  margin: 2px -25px 0 -25px;\n}\ndiv.wovn-tenso-footer {\n}\ndiv.wovn-tenso-footer-buttons {\n  margin-top: 16px;\n}\ndiv.wovn-tenso-cancel-button {\n  display: inline-block;\n  font-size: 12px;\n  padding: 12px 30px;\n  color: #545f66;\n}\ndiv.wovn-tenso-cancel-button:hover {\n  cursor: pointer;\n}\ndiv.wovn-tenso-ok-button {\n  display: inline-block;\n  font-size: 12px;\n  padding: 12px 30px;\n  color: #ffffff;\n  background-color: #FF4D09;\n  border-radius: 3px;\n}\n.raku-ichiban div.wovn-tenso-ok-button {\n  background-color: #ab263b;\n}\ndiv.wovn-tenso-ok-button:hover {\n  background-color: #FF703A;\n}\n.raku-ichiban div.wovn-tenso-ok-button:hover {\n  background-color: #C55062;\n}\ndiv.wovn-tenso-ok-button:active {\n  background-color: #E54508;\n}\n@media(max-width: 600px) {\n  div.wovn-tenso-step-separator {\n    display:none;\n  }\n  div.wovn-tenso-logo {\n    position: relative;\n    padding-top: 20px;\n    top: initial;\n    left: initial;\n  }\n  div.wovn-tenso-dialog {\n    width: 80%;\n    height: 472px;\n  }\n  div.wovn-tenso-step {\n    width: 100%;\n    height: 61px;\n    margin: 5px auto;\n  }\n  div.wovn-tenso-step-title {\n    margin-top: 5px;\n    padding: 0;\n    font-size: 16px;\n    color: #ff4d09;\n  }\n  div.wovn-tenso-step-text {\n    margin-top: -5px;\n    padding: 8px 0 16px 0;\n    font-size: 11px;\n  }\n  div.wovn-tenso-footer-border {\n    margin: 62px -25px 0 -25px;\n  }\n  div.wovn-tenso-title {\n    margin: 20px 0 0 0;\n    font-size: 16px;\n  }\n  div.wovn-tenso-subtitle {\n    font-size: 12px;\n  }\n  div.wovn-tenso-footer-buttons {\n    margin: 16px 0;\n  }\n}\n@media(max-width: 320px) {\n  div.wovn-tenso-dialog {\n    width: 85%;;\n    height: 478px;\n    padding: 24px 16px 16px;\n  }\n  div.wovn-tenso-subtitle {\n    margin-bottom: 22px;\n  }\n}\n\n/* BANNER */\nbody[wovn-tenso-banner-on] {\n  padding-top: 60px;\n}\ndiv#wovn-tenso-banner {\n  display: none;\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 60px;\n  color: #3991c9;\n  background-color: #b7e2fd;\n  font-family: helvetica, arial, \'hiragino kaku gothic pro\', meiryo, \'ms pgothic\', sans-serif;\n  text-align: center;\n  box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0);\n}\ndiv#wovn-tenso-banner.raku-ichiban {\n  color: white;\n  background-color: #ab263b;\n}\ndiv#wovn-tenso-banner.opened {\n  display: block;\n}\na.wovn-tenso-banner-content {\n  display: block;\n  width: 100%;\n  height: 100%;\n  text-decoration: none;\n}\ndiv.wovn-tenso-banner-logo {\n  display: inline-block;\n  top: 14px;\n  position: relative;\n}\n.raku-ichiban div.wovn-tenso-banner-logo {\n  top: 12px;\n  width: 72px;\n  height: 33.9px;\n}\ndiv.wovn-tenso-banner-text {\n  display: inline-block;\n  font-size: 14px;\n  top: 7px;\n  position: relative;\n  padding-left: 10px;\n}\n.raku-ichiban div.wovn-tenso-banner-text {\n  color: #ffffff;\n}\ndiv.wovn-tenso-banner-link {\n  display: inline-block;\n  color: #f95c29;\n  font-size: 16px;\n  top: 7px;\n  position: relative;\n  padding-left: 10px;\n}\n\n.raku-ichiban div.wovn-tenso-banner-link {\n  color: #ffffff;\n}\n\n@media (max-width: 440px) {\n  a.wovn-tenso-banner-content {\n    text-decoration: none;\n  }\n  div.wovn-tenso-banner-logo, .raku-ichiban div.wovn-tenso-banner-logo {\n    display: block;\n    top:9px;\n  }\n  .raku-ichiban div.wovn-tenso-banner-logo {\n    width: auto;\n  }\n  div.wovn-tenso-banner-logo img {\n    width: 90px;\n  }\n  .raku-ichiban div.wovn-tenso-banner-logo img {\n    width: 70px;\n  }\n  div.wovn-tenso-banner-text {\n    top: 8px;\n    font-size: 10px;\n  }\n  div.wovn-tenso-banner-link {\n    top: 8px;\n    padding-left: 0;\n    font-size: 12px;\n  }\n}\n",
      modal: "<div class=\"wovn-tenso-dialog\" @click.stop>\n  <div class=\"wovn-tenso-content\">\n    <div class=\"wovn-tenso-close\" @click=\"close\">&times;<\/div>\n    <div class=\"wovn-tenso-header\">\n      <div class=\"wovn-tenso-lang-selector\" v-for=\"lang in languages\">\n        <span v-text=\"http://j.wovn.io/lang.name\" @click=\"changeLang(lang)\" :class=\"{ active: lang.code === currentLangCode }\" class=\"wovn-tenso-lang-selector-name\"><\/span>\n      <\/div>\n    <\/div>\n    <div class=\"wovn-tenso-logo\">\n        <img src=\"tenso_logo_modal-1.png\"/*tpa=http://wovn.io/assets/tenso_logo_modal.png*/ class=\"tenso-img\" alt=\"Tenso\">\n        <img src=\"raku_ichiban_logo_color-1.png\"/*tpa=http://wovn.io/assets/raku_ichiban_logo_color.png*/ class=\"raku-ichiban-img\" alt=\"Tenso\">\n    <\/div>\n    <div class=\"wovn-tenso-title\">\n      <span v-text=\"textContents[currentLangCode].title\"><\/span>\n    <\/div>\n    <div class=\"wovn-tenso-subtitle\">\n      <span v-text=\"textContents[currentLangCode].subtitle1\"><\/span>\n      <span v-text=\"textContents[currentLangCode].subtitle2\"><\/span>\n    <\/div>\n    <div class=\"wovn-tenso-steps\">\n      <div class=\"wovn-tenso-step\">\n        <div class=\"wovn-tenso-step-content\">\n          <div class=\"wovn-tenso-step-title\">STEP 1<\/div>\n          <div class=\"wovn-tenso-step-text\" v-text=\"textContents[currentLangCode].step1\"><\/div>\n        <\/div>\n      <\/div>\n      <div class=\"wovn-tenso-step-separator\">\n        <img src=\"tenso_next_step-1.png\"/*tpa=http://wovn.io/assets/tenso_next_step.png*/ class=\"tenso-img\" alt=\">\">\n        <img src=\"raku_ichiban_next_step-1.png\"/*tpa=http://wovn.io/assets/raku_ichiban_next_step.png*/ class=\"raku-ichiban-img\" alt=\">\">\n      <\/div>\n      <div class=\"wovn-tenso-step\">\n        <div class=\"wovn-tenso-step-content\">\n          <div class=\"wovn-tenso-step-title\">STEP 2<\/div>\n          <div class=\"wovn-tenso-step-text\" v-text=\"textContents[currentLangCode].step2\"><\/div>\n        <\/div>\n      <\/div>\n      <div class=\"wovn-tenso-step-separator\">\n        <img src=\"tenso_next_step-1.png\"/*tpa=http://wovn.io/assets/tenso_next_step.png*/ class=\"tenso-img\" alt=\">\">\n        <img src=\"raku_ichiban_next_step-1.png\"/*tpa=http://wovn.io/assets/raku_ichiban_next_step.png*/ class=\"raku-ichiban-img\" alt=\">\">\n      <\/div>\n      <div class=\"wovn-tenso-step\">\n        <div class=\"wovn-tenso-step-content\">\n          <div class=\"wovn-tenso-step-title\">STEP 3<\/div>\n          <div class=\"wovn-tenso-step-text\" v-text=\"textContents[currentLangCode].step3\"><\/div>\n        <\/div>\n      <\/div>\n    <\/div>\n    <div class=\"wovn-tenso-footer-border\"><\/div>\n    <div class=\"wovn-tenso-footer\">\n      <div class=\"wovn-tenso-footer-buttons\">\n        <div class=\"wovn-tenso-cancel-button\" v-text=\"textContents[currentLangCode].cancel\" @click=\"close\"><\/div>\n        <a v-bind:href=\"langLink\" target=\"_blank\"><div class=\"wovn-tenso-ok-button\" v-text=\"http://j.wovn.io/textContents[currentLangCode].ok\"><\/div><\/a>\n      <\/div>\n    <\/div>\n  <\/div>\n<\/div>\n",
      banner: "<a class=\"wovn-tenso-banner-content\" v-bind:href=\"langLink\" target=\"_blank\">\n  <div class=\"wovn-tenso-banner-logo\">\n      <img src=\"tenso_logo_banner-1.png\"/*tpa=http://wovn.io/assets/tenso_logo_banner.png*/ class=\"tenso-img\" alt=\"Tenso\">\n      <img src=\"raku_ichiban_logo_white-1.png\"/*tpa=http://wovn.io/assets/raku_ichiban_logo_white.png*/ class=\"raku-ichiban-img\" alt=\"Tenso\" id=\"banner-image\">\n  <\/div>\n  <div class=\"wovn-tenso-banner-text\" v-text=\"textContents[currentLangCode].bannerText\"><\/div>\n  <div class=\"wovn-tenso-banner-link\" v-text=\"http://j.wovn.io/textContents[currentLangCode].link\"><\/div>\n<\/a>\n"
    },
    modal: {
      style: "#wovn-machine-translated-modal .wovn-modal {\n  visibility: hidden;\n  opacity: 0;\n  z-index: 99999;\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  text-align: center;\n  background: rgba(100, 110, 117, 0.9);\n  overflow-y: auto;\n  transition: opacity 300ms, background 300ms, visibility 300ms;\n  font-family: helvetica, arial, \'hiragino kaku gothic pro\', meiryo, \'ms pgothic\', sans-serif;\n}\n#wovn-machine-translated-modal .wovn-modal.opened {\n  display: block;\n  visibility: visible;\n  opacity: 1;\n  cursor: auto;\n}\n \n#wovn-machine-translated-modal .wovn-modal .wovn-modal-container {\n  position: relative;\n  display: inline-block;\n  margin: 200px 200px;\n  padding: 32px 32px 16px;\n  background: white;\n  border-radius: 3px;\n  transform: translateY(0); transition: transform 0ms;\n  box-shadow: 0 12px 12px 0 rgba(0, 0, 0, 0.24), 0 0 12px 0 rgba(0, 0, 0, 0.12);\n}\n@media (max-width: 600px) {\n  #wovn-machine-translated-modal .wovn-modal .wovn-modal-container {\n    margin: 24px 24px;\n  }\n}\n@media (min-width: 601px) and (max-width: 800px) {\n  #wovn-machine-translated-modal .wovn-modal .wovn-modal-container {\n    margin: 100px 100px;\n  }\n}\n#wovn-machine-translated-modal .wovn-modal .wovn-modal-content {\n  text-align: left;\n}\n#wovn-machine-translated-modal .wovn-modal .wovn-modal-content h3 {\n  font-size: 20px;\n  font-weight: normal;\n  color: #27313b;\n  margin-top: 0;\n}\n#wovn-machine-translated-modal .wovn-modal .wovn-modal-content p {\n  font-size: 14px;\n  color: #27313b;\n  margin-bottom: 32px;\n}\n#wovn-machine-translated-modal .wovn-modal .wovn-modal-footer {\n  background-color: #f6f8fa;\n  border-top: solid 1px #eef3f7;\n  margin: 0 -32px -16px -32px;\n  border-radius: 0 0 3px 3px;\n  padding: 16px 30px;\n  position: relative;\n  text-align: right;\n}\n#wovn-machine-translated-modal .wovn-modal button {\n  border-radius: 2px;\n  width: 96px;\n  height: 32px;\n  box-sizing: border-box;\n  text-transform: uppercase;\n  font-size: 12px;\n  font-weight: 600;\n}\n#wovn-machine-translated-modal .wovn-modal button.wovn-modal-back-button {\n  border: solid 1px #eef3f7;\n  background-color: #ffffff;\n  color: #82959f;\n}\n#wovn-machine-translated-modal .wovn-modal button.wovn-modal-ok-button {\n  border: none;\n  background-color: #545f66;\n  border: solid 1px #545f66;\n  cursor: pointer;\n  color: #ffffff;\n}\n#wovn-machine-translated-modal .wovn-modal button.wovn-modal-ok-button:hover {\n  background-color: #6e7c89;\n  border: solid 1px #6e7c89;\n}\n",
      modal: "<div class=\"wovn-modal\" :class=\"{ opened: opened }\" @click.stop=\"close\">\n  <div class=\"wovn-modal-container\" @click.stop>\n    <div class=\"wovn-modal-content\">\n      <h3 v-text=\"title\"><\/h3>\n      <p v-html=\"body\"><\/p>\n    <\/div>\n    <div class=\"wovn-modal-footer\">\n      <button class=\"wovn-modal-ok-button\" @click=\"close\">ok<\/button>\n    <\/div>\n  <\/div>\n<\/div>\n",
    },
    wovnHost: 'https://wovn.io/',
    apiHost: 'https://ee.wovn.io/',
    jWovnHost: 'https://j.wovn.io/',
    cdnOriginHost: 'https://cdn.wovn.io',
    requestWidgetHost: 'https://wovn.global.ssl.fastly.net'
  };
};

if (typeof(components) === 'undefined') var components = {};
components['Url'] = function(widget) {
  var that = this;

  var originalHref = null;

  var isOptionLoaded = false;
  this.reset = function () {
    isOptionLoaded = false;
  }

  var _currentOptions = {
    urlPattern: null
  };

  var imageFilePattern = /^(https?:\/\/)?.*(\.((?!jp$)jpe?g?|bmp|gif|png|btif|tiff?|psd|djvu?|xif|wbmp|webp|p(n|b|g|p)m|rgb|tga|x(b|p)m|xwd|pic|ico|fh(c|4|5|7)?|xif|f(bs|px|st)))(?=([\?#&].*$|$))/i
  var audioFilePattern = /^(https?:\/\/)?.*(\.(mp(3|2)|m(p?2|3|p?4|pg)a|midi?|kar|rmi|web(m|a)|aif(f?|c)|w(ma|av|ax)|m(ka|3u)|sil|s3m|og(a|g)|uvv?a))(?=([\?#&].*$|$))/i
  var videoFilePattern = /^(https?:\/\/)?.*(\.(m(x|4)u|fl(i|v)|3g(p|2)|jp(gv|g?m)|mp(4v?|g4|e?g)|m(1|2)v|ogv|m(ov|ng)|qt|uvv?(h|m|p|s|v)|dvb|mk(v|3d|s)|f4v|as(x|f)|w(m(v|x)|vx)))(?=([\?#&].*$|$))/i
  var docFilePattern = /^(https?:\/\/)?.*(\.(zip|tar|ez|aw|atom(cat|svc)?|(cc)?xa?ml|cdmi(a|c|d|o|q)?|epub|g(ml|px|xf)|jar|js|ser|class|json(ml)?|do(c|t)m?|xps|pp(a|tx?|s)m?|potm?|sldm|mp(p|t)|bin|dms|lrf|mar|so|dist|distz|m?pkg|bpk|dump|rtf|tfi|pdf|pgp|apk|o(t|d)(b|c|ft?|g|h|i|p|s|t)))(?=([\?#&].*$|$))/i

  this.saveOriginalHrefIfNeeded = function () {
    if (this.isLiveEditor()) {
      originalHref = location.href;
    }
  }

  this.getOriginalHref = function () {
    return originalHref;
  }

  /**
   * Get current options
   * @returns {{}}
   */
  function getCurrentOptions() {
    if (isOptionLoaded) {
      return _currentOptions;
    }
    if (widget.tag.getAttribute('urlPattern')) {
      _currentOptions.urlPattern = widget.tag.getAttribute('urlPattern');
      isOptionLoaded = true;
    } else {
      var options = widget.c('Data').getOptions();
      if (options && options.lang_path) {
        switch (options.lang_path) {
          case 'query':
            _currentOptions.urlPattern = 'query';
            break;
          case 'path':
            _currentOptions.urlPattern = 'path';
            break;
          case 'subdomain':
            _currentOptions.urlPattern = 'subdomain';
            break;
          case 'custom_domain':
            _currentOptions.urlPattern = 'custom_domain';
            break;
        }
        isOptionLoaded = true;
      }
    }
    return _currentOptions;
  }

  /**
   * Get current option
   * @returns {{}}
   */
  this.getOptions = function () {
    return getCurrentOptions();
  };

  /**
   * Replace current option
   * @param {{}} options
   */
  this.setOptions = function(options) {
    var currentOptions = getCurrentOptions();
    for (var key in options) if (currentOptions.hasOwnProperty(key)) currentOptions[key] = options[key];
  };

  /**
   * Get current language code
   * @param {string} url
   * @returns {string}
   */
  this.getLangCode = function(url) {
    url = this.getLocation(url || location.href).href;
    var match = null;
    var rx;
    var currentOptions = getCurrentOptions();

    switch (currentOptions.urlPattern) {
      case 'query':
        rx = new RegExp('((\\?.*&)|\\?)wovn=([^#&]+)(#|&|$)');
        match = url.match(rx);
        match = match ? match[3] : null;
        break;
      case 'hash':
        rx = new RegExp('((\\#.*&)|\\#)wovn=([^&]+)(&|$)');
        match = url.match(rx);
        match = match ? match[3] : null;
        break;
      case 'subdomain':
        rx = new RegExp('://([^.]+)\.');
        match = url.match(rx);
        match = match && (widget.c('Lang').isCaseInsensitiveCode(match[1]) || widget.c('Lang').isCaseInsensitiveAlias(match[1])) ? match[1] : null;
        break;
      case 'custom_domain':
        match = widget.c('CustomDomainLanguages').findCustomDomainLanguage(url);
        break;
      case 'path':
        var sitePrefix = widget.c('Config').getSitePrefixPath();
        if (sitePrefix) {
          rx = new RegExp('(://[^/]+|^)/' + sitePrefix + '/([^/#?]+)');
        } else {
          rx = new RegExp('(://[^/]+|^)/([^/#?]+)');
        }

        match = url.match(rx);
        match = match && (widget.c('Lang').isCode(match[2]) || widget.c('Lang').isAlias(match[2])) ? match[2] : null;
        break;
    }
    if (match) {
      var langCode = widget.c('Lang').getCode(match);
      if (langCode) {
        if (!widget.c('Lang').hasAlias(langCode) || (match === widget.c('Lang').getLangIdentifier(langCode))) {
          return langCode;
        }
      }
    }
    return widget.c('Lang').getDefaultCodeIfExists();
  };

  /**
   * Detects the protocol used for a given URL.
   *
   * @param {String} url The URL to process.
   *
   * @return {String} The protocol of the given URL.
   */
  this.getProtocol = function(url) {
    var protocolMatching = /^([a-zA-Z]+):/.exec(url);

    if (protocolMatching && protocolMatching[1]) {
      return protocolMatching[1].toLowerCase();
    }

    return location.protocol.replace(/:$/, '').toLowerCase();
  }

  this.getDomainPort = function(url) {
    var match = /:\/\/(.[^\/]+)\/?/.exec(url);
    if (match) {
      return match[1];
    } else {
      return '';
    }
  };

  this.getFlags = function (url) {
    url = url || location.href;
    var hash = url.match(/#[^?]*$/);
    hash = hash ? hash[0] : '#';

    var match = hash.match(/(^|#|&)wovn=([^#&]*)(&|#|$)/);
    if (!match || match.length < 3) return [];
    // remove empty flags in the middle or beginning/ending of string
    var match = match[2].replace(/,(,+)/g, ',').replace(/^,|,$/g, '');
    if (match === '') return [];

    return match.split(',');
  };

  this.hasFlag = function (flag, url) {
    url = url || location.href;

    var flags = that.getFlags(url);

    return widget.c('Utils').indexOf(flags, flag) !== -1;
  };

  this.isFilePathURI = function (url) {
    if (url) var parsed_url = url.split('?')[0]
    return url && (parsed_url.match(imageFilePattern) ||
      parsed_url.match(audioFilePattern) ||
      parsed_url.match(videoFilePattern) ||
      parsed_url.match(docFilePattern))
  }

  this.getUrl = function(lang, url, bypassFilepathCheck) {
    url = url || location.href;
    var protocol = this.getProtocol(url);

    if (protocol !== 'http' && protocol !== 'https') {
      return url;
    }

    if (!bypassFilepathCheck && this.isFilePathURI(url)) {
      return url;
    }

    var oldLangCode = this.getLangCode(url);
    var newLangCode = widget.c('Lang').getCode(lang);
    var urlPattern = getCurrentOptions().urlPattern;

    var urlFormatter = widget.c('UrlFormatter').createFromUrl(url);

    return urlFormatter.getConvertedLangUrl(oldLangCode, newLangCode, urlPattern)
  }

  this.isAbsoluteUrl = function (url) {
    var isAbsolute = new RegExp('^([a-z]+://|//)', 'i');
    return isAbsolute.test(url);
  }

  /**
   * Get url for specific language
   * @param {string} lang
   * @param {Element} node
   * @returns {string|null}
   */
  this.langUrl = function(lang, node) {
    var url = node.getAttribute('href');
    var currentOptions = getCurrentOptions();

    if (!currentOptions.urlPattern) {
      return null;
    }

    var data = widget.c('Data');

    var protocol = this.getProtocol(url);
    if (protocol !== 'http' && protocol !== 'https') {
      return null;
    }

    var urlLocation = this.getLocation(url);
    var urlLocationWithoutLanguage = this.getLocation(removeBackendLanguageFromLocation(urlLocation));

    if (url && this._isExcludedUrl(urlLocationWithoutLanguage, data.getExcludedPaths(), data.getExcludedUrls())) {
      if (!this.isAbsoluteUrl(url)) {
        // relative urls may be appended to a translated browser URL, so even if the path was excluded we need to remove the language from the full URL
        var urlWithLanguageRemoved = widget.c('UrlFormatter').createFromUrl(urlLocationWithoutLanguage).getNormalizedPageUrl(widget.isBackend(), currentOptions.urlPattern);
        return urlWithLanguageRemoved;
      }
      
      return null;
    }

    if (url && node.host && (node.host.toLowerCase() === location.host.toLowerCase() || currentOptions.urlPattern === 'subdomain' || currentOptions.urlPattern === 'custom_domain')) {
      if (url === '' || url.match(/^[#?]/)) {
        return null;
      }

      url = node.protocol + '//' + node.host + node.pathname + node.search + node.hash;

      // case when urlPattern is subdomain and url absolute
      if (currentOptions.urlPattern === 'subdomain') {
        if (node.host.toLowerCase() !== location.host.toLowerCase()) {
          url = url.replace(new RegExp('://' + widget.c('Lang').getLangIdentifier(this.getLangCode(url)) + '\\.', 'i'), '://');
          node.href = url;
          // we need to check if the hosts actually match again because if the host never contained a language
          var parser = document.createElement('a');
          parser.href = location.href.replace(new RegExp('://' + widget.c('Lang').getLangIdentifier(this.getLangCode(location.href)) + '\\.', 'i'), '://');
          if (node.host.toLowerCase() !== parser.host) {
            return null;
          }
        }
      } else if (currentOptions.urlPattern === 'custom_domain') {
        var hasCustomDomainLanguage = widget.c('CustomDomainLanguages').findCustomDomainLanguage(url);
        if (!hasCustomDomainLanguage) {
          return null;
        }
      }
      return this.getUrl(lang, url);
    }

    return null;
  };

  this._isExcludedUrl = function (urlLocationWithoutLanguage, excludedPaths, excludedUrls) {
    return excludedPaths.some(function (p) { return widget.c('StringUtils').startsWith(urlLocationWithoutLanguage.pathname, p); }, this)
      || excludedUrls.some(function (u) { return this._matchesExcludedUrl(u, urlLocationWithoutLanguage); }, this);
  }

  this._matchesExcludedUrl = function (excludedUrl, parsedUrl) {
    var parsedExcludedUrl = this.getLocation(excludedUrl);
    
    return parsedUrl.protocol === parsedExcludedUrl.protocol
      && parsedUrl.hostname === parsedExcludedUrl.hostname
      && parsedUrl.pathname === parsedExcludedUrl.pathname;
  }

  this.changeUrl = function(langCode) {
    if (this.isLiveEditor())
      return;
    var newLocation = this.getUrl(langCode);
    // If a browser doesn't support history.replaceState, the location will be changed
    // ALSO, if the host(subdomain) changes, the location wil also be changed
    try {
      if (widget.c('Data').getOptions().force_reload)
        throw('dummy exception');
      else {
        var newState = window.history.state || {};
        newState['wovn'] = langCode;
        window.history.replaceState(newState, null, newLocation);
      }
    }
    catch (e) {
      location.href = newLocation;
    }
  }

  this.getLiveEditorSession = function () {
    var tokenRegex = /wovn\.editing=([A-Za-z0-9-_?=]+)/;
    var match = location.href.match(tokenRegex);

    if (!match && originalHref) {
      match = originalHref.match(tokenRegex);
    }

    return match && match[1] ? match[1] : '';
  }

  this.getLiveEditorTargetLangCode = function () {
    var langRegex = /wovn\.targetLang=([^&]*)/;
    var match = location.hash.match(langRegex);

    if (!match && originalHref) {
      match = originalHref.match(langRegex);
    }

    return match && match[1] ? match[1] : '';
  }

  this.getLiveEditorWidgetLangCode = function () {
    var langRegex = /wovn\.widgetLang=([^&]*)/;
    var match = location.hash.match(langRegex);

    if (!match && originalHref) {
      match = originalHref.match(langRegex);
    }

    return match && match[1] ? match[1] : 'en';
  }

  this.isLiveEditor = function () {
    var liveEditorRegex = /wovn\.editing/i;

    if (liveEditorRegex.test(location.href)) return true;
    if (originalHref) {
      return liveEditorRegex.test(originalHref);
    }
    return false;
  }

  this.isIframeLiveEditor = function () {
    return /wovn\.iframeEditing/i.test(location.href);
  }

  this.removeIframeLiveEditorMarkFromHash = function () {
    location.hash = location.hash.replace(/wovn\.iframeEditing(?=1)?/i, '')
  }

  this.getEncodedLocation = function (customLocation) {
    return encodeURIComponent(removeBackendLanguageFromLocation(customLocation));
  };

  this.removeHash = function(url) {
    var index = url.indexOf('#');
    return index === -1 ? url : url.substr(0, index);
  };

  /**
   * Gets the current location of the browser without the backend-inserted lang code
   *
   * @return {string} The unicode-safe location of this browser without the lang code
   */
  function removeBackendLanguageFromLocation (currentLocation) {
    // not all browsers handle unicode characters in the path the same, so we have this long mess to handle it
    // TODO: decodeURIcomponent doesnt handle the case where location has char like this: &submit=%8E%9F%82%D6%90i    %82%DE (characters encoded in shift_jis)
    // adding unescape before it makes the error go away but doesnt fix the pb and creates pb for utf8 encode params
    if (!currentLocation)
      currentLocation = location;
    if (typeof(currentLocation) !== 'string')
      currentLocation = currentLocation.protocol + '//' + currentLocation.host + currentLocation.pathname + currentLocation.search;

    if (widget.tag.getAttribute('backend')) {
      var currentLangIdentifier = widget.c('Lang').getBackendLangIdentifier();
      switch (widget.tag.getAttribute('urlPattern')) {
        case 'query':
          currentLocation = currentLocation.replace(new RegExp('(\\?|&)wovn=' + currentLangIdentifier + '(&|$)'), '$1').replace(/(\?|&)$/, '');
          break;
        case 'subdomain':
          currentLocation = currentLocation.replace(new RegExp('//' + currentLangIdentifier + '.', 'i'), '//');
          break;
        case 'custom_domain':
          currentLocation = widget.c('CustomDomainLanguages').removeLanguageFromAbsoluteUrl(currentLocation, currentLangIdentifier);
          break;
        case 'path':
          var defaultLangAlias = widget.c('Lang').defaultLangAlias()
          if (defaultLangAlias) {
            currentLocation = currentLocation.replace(new RegExp('(//[^/]+)/' + currentLangIdentifier + '(/|$)'), '$1/' + defaultLangAlias + '/');
          } else {
            currentLocation = currentLocation.replace(new RegExp('(//[^/]+)/' + currentLangIdentifier + '(/|$)'), '$1/');
          }
      }
    }
    return currentLocation;
  }

  this.apiHostBase = widget.c('RailsBridge')['apiHost'];
  this.getApiHost = function () {
    var host = this.apiHostBase;
    return host.replace(/^.*\/\//, '//');
  }

  this.getLocation = function (url) {
    var newLocation = document.createElement('a');
    newLocation.href = url;

    // IE dont load the attributes "protocol" and "host" in case the source URL
    // is just a pathname, that is, "/example" and not "http://domain.com/example".
    newLocation.href = newLocation.href;

    // IE 7 and 6 won't load "protocol" and "host" even with the above workaround,
    // so we take the protocol/host from window.location and place them manually
    if (newLocation.host === "") {
      var newProtocolAndHost = window.location.protocol + "//" + window.location.host;
      if (url.charAt(1) === "/") {
        newLocation.href = newProtocolAndHost + url;
      } else {
        // the regex gets everything up to the last "/"
        // /path/takesEverythingUpToAndIncludingTheLastForwardSlash/thisIsIgnored
        // "/" is inserted before because IE takes it of from pathname
        var currentFolder = ("/"+newLocation.pathname).match(/.*\//)[0];
        newLocation.href = newProtocolAndHost + currentFolder + url;
      }
    }

    if (newLocation.pathname[0] !== '/') {
      // There is a bug in IE11 where pathname will not start with a / until children is evaluated
      newLocation.children;
    }

    return newLocation;
  }

  this.getNormalizedHost = function (location) {
    var host = location.host;

    if (location.protocol === 'http:' && /:80$/.test(host)) {
      host = host.replace(/:80$/, '')
    } else if (location.protocol === 'https:' && /:443$/.test(host)) {
      host = host.replace(/:443$/, '')
    }

    return host;
  }

  /**
   * Say true if url is third-party's link
   */
  this.shouldIgnoreLink = function (url) {
    // get url's location and host
    var urlFormatter = widget.c('UrlFormatter').createFromUrl(url);
    var urlHost = urlFormatter.extractHost();

    // get current location and host
    var curLocationFormatter = widget.c('UrlFormatter').createFromUrl("/");
    var currentHost = curLocationFormatter.extractHost();

    var host_aliases = widget.c('Data').createNormalizedHostAliases();
    host_aliases.push(currentHost);

    return host_aliases.indexOf(urlHost) == -1;
  }
};

if (typeof(components) === 'undefined') var components = {};
components['AuditTrigger'] = function(widget) {
  var that = this;
  var timeout;
  var editMode = false;
  var inspectingMode = false;

  this.auditor = function () {};

  this.auditWorker = widget.c('SingleWorker').createSingleWorker();

  widget.c('Utils').onDomReady(function () {
    var touchEnabled = 'ontouchstart' in document;
    var clickNodes = [document.body];
    clickNodes = clickNodes.concat(widget.c('Utils').toArrayFromDomList(document.getElementsByTagName('a')));
    clickNodes = clickNodes.concat(widget.c('Utils').toArrayFromDomList(document.getElementsByTagName('button')));
    clickNodes = clickNodes.concat(widget.c('Utils').toArrayFromDomList(document.getElementsByTagName('input')));
    for (var i = 0; i < clickNodes.length; i++) {
      // add touch listener and click if the device is touch enabled
      // some devices can have both click and touch (surface)
      processEvent(clickNodes, i, 'click');
      if (touchEnabled){
        processEvent(clickNodes, i, 'touchend');
      }
    }
  }, true);

  /**
   * At each event trigger, renews the timer of the audit or decorates the page
   * @param {object} clickNodes html nodes on the page being tracked for events
   * @param {number} i the node index
   * @param {string} eventName the event name
   */
  function processEvent(clickNodes, i, eventName) {
    widget.c('Utils').onEvent(clickNodes[i], eventName, function () {
      if (!editMode) {
        renewTimeout();
      }
      else {
        if (widget.c('Url').isLiveEditor() && !inspectingMode) {
          widget.c('LiveEditor').decoratePage();
        }
      }
    });
  }

  this.start = function() {
    renewTimeout();
  };

  this.getEditMode = function() {
    return editMode
  };

  this.getInspectingMode = function() {
    return inspectingMode
  };

  this.setInspectingMode = function(isInspectedMode) {
    if (typeof(isInspectedMode) !== 'boolean') {
      throw 'Invalid type for isInspectedMode. Value should be a boolean'
    }
    inspectingMode = isInspectedMode
  };

  this.editStop = function() {
    editMode = true;
    clearTimeout(timeout);
  };

  this.stop = function() {
    clearTimeout(timeout);
  };

  this.destroy = function() {
    that.stop();
  };

  /**
   * reset Audit's count and execute audit
   * @param maxInterval
   */
  function renewTimeout(maxInterval) {
    if (!maxInterval) maxInterval = 25000;

    var totalAuditCount = 5;
    var currentAuditCount = 0;
    var callAudit = function() {
      // When current language is same as default, almost values are properly swapped (includes new values).
      // so reduce opportunity of swapVals()
      if (widget.c('DomAuditor').getInternalCurrentLang() === widget.c('Lang').getDefaultCodeIfExists()) {
        if (currentAuditCount % 2 === 0) {
          return
        }
      }
      // First SwapVals() is slower than later, (maybe because of JIT or DOM's cache?)
      // For faster rendering (e.g. scroll), ignore everyBlock's swap (everyBlock is for swap css' image)
      var swapsProperty = currentAuditCount !== 0;
      that.auditor(null, swapsProperty);
    };

    var bookNext = function() {
      if (currentAuditCount >= totalAuditCount || editMode) return;
      currentAuditCount++;
      var interval = maxInterval * Math.pow(currentAuditCount, 2) / Math.pow(totalAuditCount, 2);
      timeout = that.auditWorker.setTimeout(callAudit, bookNext, interval);
    }
    that.auditWorker.setTimeout(callAudit, bookNext, 0);
  }
};

if (typeof(components) === 'undefined') var components = {};
components['Interface'] = function(widget) {
  var that = this;

  this.WIDGET_ID = 'wovn-translate-widget';
  this.BUILT_IN_ID = 'wovn-languages';
  var appendedChildren = [];
  var attachedHandlers = [];
  var widgetElement;

  this.addClass = function (ele, targetClass) {
    var trimmedClass = widget.c('Utils').trimString(targetClass);
    var rx = new RegExp('(^| )' + trimmedClass + '( |$)');
    // if class list already contains className
    if (rx.test(ele.className)) return;
    ele.className = ele.className.length == 0 ? targetClass : ele.className + ' ' + targetClass;
  }

  this.removeClass = function (ele, targetClass) {
    var trimmedClass = widget.c('Utils').trimString(targetClass);
    var rx = new RegExp('(^| )' + trimmedClass + '( |$)', 'g');
    var className = ele.className.replace(rx, '').replace(/\s+/g, ' ');
    ele.className = widget.c('Utils').trimString(className);
  }

  this.hasClass = function (ele, targetClass) {
    return (' ' + ele.className + ' ').indexOf(' ' + targetClass + ' ') > -1;
  }

  function wovnGetElementsByClassName(node, classname) {
    if (typeof document.getElementsByClassName === 'function')
      return node.getElementsByClassName(classname);
    else {
      var a = [];
      var re = new RegExp('(^| )' + classname + '( |$)');
      var els = node.getElementsByTagName("*");
      for (var i = 0, j = els.length; i < j; i++)
        if (re.test(els[i].className) || re.test(els[i].getAttribute('class')))
          a.push(els[i]);
      return a;
    }
  }

  function setInnerHTMLByClass(ancestor, className, value) {
    var targets = wovnGetElementsByClassName(ancestor, className);
    for (var i = 0; i < targets.length; i++)
      targets[i].innerHTML = value;
  }

  function onEvent (target, eventName, handler) {
    widget.c('Utils').onEvent(target, eventName, handler);
    attachedHandlers.push({'target': target, 'eventName': eventName, 'handler': handler});
  }

  this.insertStyles  = function (styles) {
    if (!styles) return;
    if (styles.constructor === Array)
      styles = styles.join('\n');
    var styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.className = 'wovn-style';
    try {
      styleElement.innerHTML = styles;
    }
    catch (e) {
      styleElement.styleSheet.cssText = styles;
    }
    document.getElementsByTagName('head')[0].appendChild(styleElement);
    appendedChildren.push(styleElement);
  }

  function disableBrowserTranslation () {
    if (widget.c('Utils').getMetaElement('google', {value: 'notranslate'})) return;
    var chrome = document.createElement('meta');
    chrome.setAttribute('name', 'google');
    chrome.setAttribute('value', 'notranslate');
    document.getElementsByTagName('head')[0].appendChild(chrome);
    appendedChildren.push(chrome);
  }

  function getQueryVal(param, href) {
    var link = !href ? window.location : function () {
      var l = document.createElement('a');
      l.setAttribute('href', href);
      return l;
    }();
    param = encodeURIComponent(param);
    var match = link.search.match(new RegExp(param + '=([^&#?]*)'));
    return (match && match[1]) || '';
  }

  var scrollTop = 0;
  var scrollTopBefore = 0;
  var documentScrollTop = 0;
  var onHoldAnim = null;

  /**
   * set animation to hide the widget
   */
  function animHideWidget(widget) {
    if (!widget) return;
    widget.className = widget.className.replace(/slide-in/, 'slide-out');
  }

  /**
   * set animation to show the widget
   */
  function animShowWidget(widget) {
    if (!widget) return;
    widget.className = widget.className.replace(/slid-out/, '').replace(/slide-out/, 'slide-in');
  }

  /**
   * check scroll action DOWN/UP
   */
  function scrollWidgetAction() {
    documentScrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
    var widget = document.getElementById('wovn-translate-widget');
    var langListContainer = document.getElementsByClassName('wovn-lang-container')[0];

    if (documentScrollTop <= scrollTop) {
      animScrollUp(widget, langListContainer);
    }
    else {
      animScrollDown(widget, langListContainer);
    }
    scrollTop = documentScrollTop;
  }

  /**
   * check scroll action DOWN/UP then STOP
   */
  function scrollStopWidgetAction() {
    documentScrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
    var widget = document.getElementById('wovn-translate-widget');
    var langListContainer = document.getElementsByClassName('wovn-lang-container')[0];

    if (documentScrollTop <= scrollTopBefore) {
      animScrollUpThenStop(widget, langListContainer);
    }
    else {
      animScrollDownThenStop(widget, langListContainer);
    }
    scrollTopBefore = scrollTop;
    scrollTop = documentScrollTop;
  }

  /**
   * animation behaviour on scrollTop
   */
  function animScrollUp(widget, langListContainer) {
    if(onHoldAnim !== null) clearTimeout(onHoldAnim);
    if (!widget) return;
    if (that.hasClass(langListContainer, 'is-open')) return;

    animShowWidget(widget);
    onHoldAnim = setTimeout(function() {
      animHideWidget(widget);
    }, 1000);
  }

  /**
   * animation behaviour on scrollDown
   */
  function animScrollDown(widget, langListContainer) {
    if(onHoldAnim !== null) clearTimeout(onHoldAnim);
    if (!widget) return;
    if (that.hasClass(langListContainer, 'is-open')) return;

    onHoldAnim = setTimeout(function() {
      animHideWidget(widget);
    }, 1000);
  }

  /**
   * animation behaviour on scrollTop then STOP
   */
  function animScrollUpThenStop(widget, langListContainer) {
    if(onHoldAnim !== null) clearTimeout(onHoldAnim);
    if (!widget) return;
    if (that.hasClass(langListContainer, 'is-open')) return;

    animShowWidget(widget);
    onHoldAnim = setTimeout(function() {
      animHideWidget(widget);
    }, 4000);
  }

  /**
   * animation behaviour on scrollDown then STOP
   */
  function animScrollDownThenStop(widget, langListContainer) {
    if(onHoldAnim !== null) clearTimeout(onHoldAnim);
    if (!widget) return;
    if (that.hasClass(langListContainer, 'is-open')) return;

    animShowWidget(widget);
    onHoldAnim = setTimeout(function() {
      animHideWidget(widget);
    }, 4000);
  }


  this.scrollStop = function (callback) {

    if (!callback || Object.prototype.toString.call(callback) !== '[object Function]') return;

    var isScrolling;

    window.addEventListener('scroll', function (event) {
      window.clearTimeout(isScrolling);

      isScrolling = setTimeout(function() {
        callback();
      }, 300);
    }, false);
  };

  function ensureDefaultLangInList (langs) {
    var defaultLangCode = widget.c('Data').getLang()

    if (defaultLangCode) {
      var defaultLang = widget.c('Lang').get(defaultLangCode)
      if (!langs.some(function (lang) { return lang.code === defaultLang.code; })) {
        langs.unshift(defaultLang)
      }
    }

    return langs
  }

  /**
   * Build Widget's Language List
   *
   * @param langs to use
   */
  function buildWidgetLangList (langs) {
    var widgetElem = document.getElementById(that.WIDGET_ID);
    if (!widgetElem) return;
    var widgetList = widgetElem.className.match(/\bwovn-lang-list\b/) ? widgetElem : wovnGetElementsByClassName(widgetElem, 'wovn-lang-list')[0];
    if (!widgetList) return;

    langs = ensureDefaultLangInList(langs || [])

    // c('Url').getLangCode will return the path lang if using backend or wovnDefaultLang otherwise
    var selectedLang = widget.c('Url').getLangCode();
    if (selectedLang != widget.c('Lang').getDocLang()) {
      selectedLang = widget.c('Lang').getDocLang();
    }
    if (widget.c('Utils').findIndex(langs, selectedLang, function (ele, val) { return ele.code === val;}) === -1) {
      selectedLang = widget.c('Lang').getDefaultCodeIfExists();
    }
    var listItem, selectedLangName;
    for (var i = 0; i < langs.length; i++) {
      var lang = langs[i];
      listItem = document.createElement('li');
      listItem.setAttribute('class', 'wovn-switch');
      listItem.innerHTML = lang.name;
      listItem.setAttribute('data-value', lang.code);
      if (lang.code == selectedLang) {
        listItem.setAttribute('class', 'wovn-switch selected');
        selectedLangName = lang.name;
      }

      widgetList.appendChild(listItem);
    }

    setInnerHTMLByClass(widgetElem, 'wovn-current-lang', selectedLangName || '');
  }

  function getWovnLangQuery(lang_code) {
    var query = window.location.search;
    // change wovn parameter
    if (query.replace(/\?/, '').length == 0) {
      return 'wovn=' + lang_code;
    }
    else if (query.match(/wovn=/)) {
      return query.replace(/wovn=[^&]*/, 'wovn=' + lang_code);
    }
    else {
      return query + '&wovn=' + lang_code;
    }
  }

  /**
   * Flag of changeLang() is working or not
   * @type {boolean}
   */
  var changingLang = false;

  /**
   * Change Language
   * If argument is string, convert to appropriate element.
   * If 'ed' is argued, LiveEditor starts.
   *
   * @param ele element or language's code
   */
  this.changeLang = function (ele, changedCallback) {
    // Do nothing when page is not ready
    var defaultCode = widget.c('Lang').getDefaultCodeIfExists();
    if (!defaultCode) return;

    // Know if lang change comes from human manual change or automatic change (API, Cookie)
    var manualLangChange = !!ele.parentElement

    if (changingLang) {
      setTimeout(function(){that.changeLang(ele, changedCallback);}, 100);
      return;
    }
    changingLang = true;
    var oldLang = defaultCode;
    var isEd = false;
    if (typeof(ele) === 'string') {
      isEd = (ele === 'ed');
      var lis = document.getElementById(that.WIDGET_ID);
      if (lis) {
        lis = wovnGetElementsByClassName(lis, 'wovn-switch');
        for (var i = 0; i < lis.length; i++) {
          if (lis[i].getAttribute('data-value') === ele) {
            ele = lis[i];
            break;
          }
        }
      }
    }
    if (isEd) {
      var loadedOne = false;
      function kickoffEditor () {
        if (loadedOne) {
          widget.c('LiveEditor').start();
        }
        else {
          loadedOne = true;
        }
      }

      widget.loadComponents(['Vue', 'LiveEditor'], {'Vue': kickoffEditor, 'LiveEditor': kickoffEditor});
    }
    // if we got the element (it's not a string)
    if (ele.parentElement) {
      var listItems = wovnGetElementsByClassName(ele.parentElement, 'wovn-switch');
      for (var i = 0; i < listItems.length; i ++) {
        if (listItems[i].className.indexOf('selected') != -1)
          oldLang = listItems[i].getAttribute('data-value');
        that.removeClass(listItems[i], 'selected');
      }
      that.addClass(ele, 'selected');
      var currentLangEle = ele.parentElement.parentElement.parentElement;

      setInnerHTMLByClass(currentLangEle, 'wovn-current-lang', ele.textContent || ele.innerText);
      var newLang = ele.getAttribute('data-value');
    } else {
      var newLang = ele;
    }
    widget.c('Lang').setDocLang(newLang);
    if (changedCallback) {
      changedCallback(newLang);
    }

    if (widget.c('Data').useMachineTranslatedModal()) {
      widget.c('MachineTranslatedModal').start(manualLangChange);
    }
    if (widget.c('ParcelForwarding').banner) {
      widget.c('ParcelForwarding').banner.changeLang();
    }
    widget.c('TagCustomization').load()

    changingLang = false;
  };

  function attachLangClickHandlers () {
    var widgetElem = document.getElementById(that.WIDGET_ID);
    if (!widgetElem) return;
    var clickTargets = wovnGetElementsByClassName(widgetElem, 'wovn-switch');
    if (clickTargets.length === 0) clickTargets = widgetElem.getElementsByTagName('a');
    if (clickTargets.length === 0) clickTargets = widgetElem.getElementsByTagName('li');
    if (clickTargets.length === 0) return;

    for (var i = 0; i < clickTargets.length; i++) {
      onEvent(clickTargets[i], 'click', function(ele) {
        return function () {that.changeLang(ele);};
      }(clickTargets[i]), false);
    }
  }

  var widgetOptionShori = (function () {
    var shoris = {};
    shoris.type = function (opts, opt) {
      var type = opts[opt];
      if (type === 'widget' || (type === 'auto' && !document.getElementById(that.BUILT_IN_ID)) || (type !== 'built_in' && type !== 'auto' && type !== 'widget')) {
        buildWidgetLangList(widget.c('Data').getConvertedLangs());
        attachLangClickHandlers();
        return;
      }
      if (type === 'built_in' && !document.getElementById(that.BUILT_IN_ID)) {
        that.insertStyles('#wovn-translate-widget {display: none !important;}');
        return;
      }
      var dataAttribute = '';
      if (document.getElementById(that.WIDGET_ID)) {
        var oldWidget = document.getElementById(that.WIDGET_ID);
        dataAttribute = oldWidget.getAttribute('data-ready');
        oldWidget.parentNode.removeChild(oldWidget);
      }
      that.WIDGET_ID = that.BUILT_IN_ID;
      var container = document.getElementById(that.WIDGET_ID);
      container.setAttribute('data-ready', dataAttribute);
      container.setAttribute('data-theme', 'built-in');
      // if there is a template
      if (wovnGetElementsByClassName(container, 'wovn-switch-template').length !== 0) {
        var original = wovnGetElementsByClassName(container, 'wovn-switch-template')[0];
        var hasSwitch = original.className.match(/(^| )wovn-switch( |$)/i) || function () {
          for (var i = 0; i < original.children.length; i++) {
            if (original.children[i].className.match(/(^| )wovn-switch( |$)/i))
              return true;
          }
          return false;
        }();
        // if there's no switch class we will put it on the template element
        if (!hasSwitch) that.addClass(original, 'wovn-switch');
        var template = document.createElement('div');
        template.appendChild(original.cloneNode(true));
        var newSwitch;
        var convertedLangs = ensureDefaultLangInList(widget.c('Data').getConvertedLangs());
        for (var i = 0; i < convertedLangs.length; i++) {
          newSwitch = document.createElement('div');
          newSwitch.innerHTML = template.innerHTML.replace(/wovn-lang-name/g, convertedLangs[i].name);
          wovnGetElementsByClassName(newSwitch, 'wovn-switch')[0].setAttribute('data-value', convertedLangs[i].code);
          original.parentNode.insertBefore(newSwitch.children[0], original);
        }
        original.parentNode.removeChild(original);
      }
      // if there are no switches in the container, we may have to build them
      else if (wovnGetElementsByClassName(container, 'wovn-switch').length === 0) {
        // if there are no anchors (and no switches), we have to build the inner structure
        if (container.getElementsByTagName('a').length === 0) {
          container.innerHTML = '';
          if (container.nodeName.toLowerCase() === 'ul' || container.nodeName.toLowerCase() === 'ol') {
            var list = container;
            that.addClass(list, 'wovn-lang-list');
          }
          else {
            var list = document.createElement('ul');
            list.className = 'wovn-lang-list';
            container.appendChild(list);
          }
          buildWidgetLangList(widget.c('Data').getConvertedLangs());
        }
        // if there are no switches, but there are anchor tags, make the anchor tags switches
        else {
          var switches = container.getElementsByTagName('a');
          for (var i = 0; i < switches.length; i++)
            switches[i].className = switches[i].className + (switches[i].className.length > 0 ? switches[i].className + ' ' : '') + 'wovn-switch';
        }
      }
      attachLangClickHandlers();
    };

    shoris.position = function (opts, opt) {
      if (!opts[opt] || opts[opt] === 'default') return;
      var widgetElem = document.getElementById(that.WIDGET_ID);
      if (widgetElem) that.addClass(widgetElem, 'position-' + opts[opt].replace(/[ _]/g, '-'));
    };

    /**
      * Hide widget by setting and browser language.
      *
      * @param opts {Object} widget.c('Data').getOptions()
      * @param opt {String} always returns 'auto_hide_widget'
      */
    shoris.auto_hide_widget = function (opts, opt) {
      if (!opts[opt] || (typeof opts[opt] === 'string' && !opts[opt].match(/true/i))) return;
      var browserLang = widget.c('Lang').getBrowserLang();
      var rx = new RegExp('^' + widget.c('Data').getLang(), 'i');
      if (widget.c('Data').getLang() === browserLang || rx.test(browserLang)) {
        var widgetElem = document.getElementById(that.WIDGET_ID);
        if (widgetElem) widgetElem.parentNode.removeChild(widgetElem);

        var builtIn = document.getElementById(that.BUILT_IN_ID);
        if (builtIn) builtIn.parentNode.removeChild(builtIn);
      }
    };

    /**
     * Hide WOVN.io logo.
     * @param opts {Object} widget.c('Data').getOptions()
     * @param opt {String} always returns 'hide_logo'
     */
    shoris.hide_logo = function (opts, opt) {
      if (!opts[opt]) return;
      var widgetElem = document.getElementById(that.WIDGET_ID);
      if (widgetElem) {
        that.addClass(widgetElem, 'hide-logo');
      }
    };

    /**
     * Show translated by machine image
     * @param opts {Object} widget.c('Data').getOptions()
     */
    shoris.show_tbm = function (opts) {
      if (opts["show_tbm"] !== true) return;
      var widgetElem = document.getElementById(that.WIDGET_ID);
      if (widgetElem) {
        that.addClass(widgetElem, 'show-tbm');
      }
    };

    return function (options, opt) {
      if (typeof shoris[opt] === 'object') {
        if (arguments.length === 3 && typeof arguments[2] === 'string' && typeof shoris[opt][arguments[2]] === 'function')
          return shoris[opt][arguments[2]](options, opt);
      }
      else if (typeof shoris[opt] === 'function')
        return shoris[opt](options, opt);
    };
  })();

  function applyWidgetOptions(options) {
    if (options) var opts = options;
    else if (widget.c('Data').getOptions()) var opts = widget.c('Data').getOptions();
    else return;
    var widgetOptionStyles = (widget.c('Data').get().widgetOptions && widget.c('Data').get().widgetOptions.css) || {};
    var styles = [];
    for (var opt in opts){if(opts.hasOwnProperty(opt)) {
      if (widgetOptionStyles.hasOwnProperty(opt)) {
        if (typeof opts[opt] === 'boolean') {
          if (opts[opt]) styles.push(widgetOptionStyles[opt]);
        }
        else {
          styles.push(widgetOptionStyles[opt]);
        }
      }
      var shoriResult = widgetOptionShori(opts, opt);
      // if shori result is an array
      if (typeof shoriResult === 'object' && shoriResult.constructor === Array) styles = styles.concat(shoriResult);
    }}
    that.insertStyles(styles);

    // user must have parcel_forwarding feature and viewer must be outside Japan
    if (!!opts.parcel_forwarding && widget.c('Data').getCountryCode() !== 'JP') {
      var loadedOne = false;
      function kickoffParcelForwarding () {
        if (loadedOne)
          widget.c('ParcelForwarding').start();
        else
          loadedOne = true;
      }
      widget.loadComponents(['Vue', 'ParcelForwarding'], {'Vue': kickoffParcelForwarding, 'ParcelForwarding': kickoffParcelForwarding});
    }
    // 404 unpublish feature
    if (opts.not_found_unpublish && widget.c('Data').getPublishedLangs().length > 0) {
      widget.c('PageChecker').notifyWovnIfNotFound();
    }

    if (widget.c('Data').getOptions().style === "floating custom animated" ||
      widget.c('Data').getOptions().style === "floating custom_transparent animated" ||
      widget.c('Data').getOptions().style === "floating custom fixed" ||
      widget.c('Data').getOptions().style === "floating custom_transparent fixed" ||
      widget.c('Data').getOptions().style === "floating custom" ||
      widget.c('Data').getOptions().style === "floating custom_transparent") {
      var logo = widget.c('Utils').getElementsByClassName(widgetElement, 'wovn-logo wovn-logo--small')
      var newLogo = document.createElement('a');
      newLogo.setAttribute('class', 'wovn-logo wovn-logo--small wovn-logo--custom');

      var newLogoHTML = '<svg id="wovn-logo--floating" class="wovn-logo--floating--custom" viewBox="0 0 246 246" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="custom"><g id="Group" fill="#FFFFFF"><polygon id="shape" points="246 0 246 246 0 246"></polygon></g><g id="Group" transform="translate(140.629997, 160) scale(0.7)" fill="#812990" fill-rule="nonzero" stroke="#FFFFFF"><path d="M46.2906707,1.92067992 L0.529407432,59.8165151 L37.782713,59.8165151 L37.782713,74.6036803 L46.2891308,74.6036803 L46.2891308,59.8165151 L55.9335361,59.8165151 L55.9335361,57.8307932 L46.2891308,57.8307932 L46.2891308,1.92067992 L46.2906707,1.92067992 Z M37.767314,57.8307932 L5.9945191,57.8307932 L37.767314,17.7902986 L37.767314,57.8307932 Z" id="Shape" stroke-width="4"></path><path d="M89.0922427,26.9316689 C76.5790002,26.4117388 70.8844432,32.0413777 69.4030576,34.0638178 C69.2844852,34.2268467 69.0488802,34.1592852 69.0504201,33.905195 C69.082758,31.2923259 69.5247099,16.4537551 75.7320542,10.0970952 C84.7651185,0.83969525 101.888827,1.92067992 107.606483,19.7304898 C107.745074,20.1637649 109.619134,20.1211718 109.560618,19.6761469 C109.012413,15.5078935 107.588004,12.0519737 104.097046,8.41246285 C90.4781543,-5.77252347 60.6625747,-1.92592178 60.6625747,40.5174138 C60.6625747,67.2820654 72.1179046,74.3569338 86.2249454,75.1441727 C99.1139239,75.8653187 111.787316,65.321312 111.787316,52.4185262 C111.785776,36.2610366 100.690783,27.4119434 89.0922427,26.9316689 Z M86.3019405,72.8588301 C76.7653284,72.8588301 69.0304014,63.0888436 69.0304014,51.0291084 C69.0304014,38.9767169 76.7637885,29.2023242 86.3019405,29.2023242 C95.8400926,29.2023242 103.57194,38.9767169 103.57194,51.0291084 C103.57194,63.0873749 95.8400926,72.8588301 86.3019405,72.8588301 Z" id="Shape" stroke-width="2"></path></g></g></g></svg>';
      newLogoHTML += '<svg id="wovn-logo--default" xmlns="http://www.w3.org/2000/svg" viewBox="http://j.wovn.io/0 0 396.36 64.73"><circle class="color-dot" cx="http://j.wovn.io/322.58" cy="http://j.wovn.io/53.99" r="10"/><path class="color-letter" id="letter-small-i" d="http://j.wovn.io/M343.84,30.31h9.42a1.16,1.16,0,0,1,1.18,1.18V61.79A1.16,1.16,0,0,1,353.26,63h-9.42a1.16,1.16,0,0,1-1.18-1.18V31.48C342.52,30.89,343.11,30.31,343.84,30.31Z"/><path id="letter-small-o" class="color-letter" d="http://j.wovn.io/M379,29.28a17.36,17.36,0,1,0,17.36,17.36A17.39,17.39,0,0,0,379,29.28Zm0,24.57a7.21,7.21,0,1,1,7.21-7.21A7.22,7.22,0,0,1,379,53.84Z"/><path id="letter-big-W" class="color-letter" d="http://j.wovn.io/M93.48,1.18H78.18a2,2,0,0,0-1.91,1.47L66.7,34.42,56.11,2.35A2.06,2.06,0,0,0,54.34,1H41.4a1.9,1.9,0,0,0-1.77,1.32L29,34.42,19.48,2.65a2,2,0,0,0-1.91-1.47H1.68a1.54,1.54,0,0,0-1.32.74A1.81,1.81,0,0,0,.06,3.38L19.77,62.67A2.06,2.06,0,0,0,21.54,64H34.63a1.85,1.85,0,0,0,1.77-1.32L47.58,30.6,58.76,62.67A2.06,2.06,0,0,0,60.52,64H73.61a1.9,1.9,0,0,0,1.77-1.32L95.09,3.38a1.4,1.4,0,0,0-.29-1.47A1.54,1.54,0,0,0,93.48,1.18Z"/><path id="letter-big-O" class="color-letter" d="http://j.wovn.io/M132,0C113.19,0,98.48,14.27,98.48,32.51s14.71,32.22,33.39,32.22,33.54-14.27,33.54-32.51S150.7,0,132,0Zm14.56,32.51C146.58,41.34,140.26,48,132,48s-14.71-6.77-14.71-15.74,6.18-15.45,14.56-15.45S146.58,23.54,146.58,32.51Z"/><path id="letter-big-V" class="color-letter" d="http://j.wovn.io/M232.06,1.18H215.73a2.09,2.09,0,0,0-1.91,1.32L201,38,188.22,2.5a2.09,2.09,0,0,0-1.91-1.32H169.53a1.54,1.54,0,0,0-1.32.74,1.58,1.58,0,0,0-.15,1.62L191.9,62.82A1.91,1.91,0,0,0,193.66,64h14.12a1.91,1.91,0,0,0,1.77-1.18L233.38,3.53a1.74,1.74,0,0,0-.15-1.47C233,1.44,232.65,1.18,232.06,1.18Z"/><path id="letter-big-N" class="color-letter" d="http://j.wovn.io/M301.05,1.18h-15.3a1.47,1.47,0,0,0-1.47,1.47V32.37L261,1.91a1.81,1.81,0,0,0-1.47-.74H245a1.47,1.47,0,0,0-1.47,1.47V62.52A1.47,1.47,0,0,0,245,64h15.45a1.47,1.47,0,0,0,1.47-1.47V31.63L286,63.26a1.81,1.81,0,0,0,1.47.74h13.53a1.47,1.47,0,0,0,1.47-1.47V2.65A1.47,1.47,0,0,0,301.05,1.18Z"/></svg>';
      newLogo.innerHTML = newLogoHTML;

      var objParent = logo[0].parentNode;
      objParent.removeChild(logo[0]);
      objParent.appendChild(newLogo);
    }
  }

  this.build = function() {
    if (!document || !document.body) setTimeout(function () {that.body(options)}, 100);
    var oldWidget = document.getElementById('wovn-translate-widget');
    if (oldWidget) oldWidget.parentNode.removeChild(oldWidget);

    while (true) {
      var oldStyles = document.getElementsByClassName('wovn-style')
      if (oldStyles.length == 0) {
        break;
      }
      // oldStyles' elements is removed when node is removed
      oldStyles[0].parentNode.removeChild(oldStyles[0])
    }
    var styles = widget.c('RailsBridge')['widgetStyles']
    that.insertStyles(styles);
    widgetElement = document.createElement('div');
    widgetElement.id = 'wovn-translate-widget'
    widgetElement.setAttribute('wovn', '');
    var _HTML = '<div class="wovn-lang-container">';
        _HTML += '<ul class="wovn-lang-list"></ul>';
        _HTML += '<a class="wovn-logo wovn-logo--big" class="wovn-logo-big" href="http://wovn.io/" target="_blank">';
        _HTML += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="http://j.wovn.io/0 0 396.36 64.73"><circle class="color-dot" cx="http://j.wovn.io/322.58" cy="http://j.wovn.io/53.99" r="10"/><path class="color-letter" id="letter-small-i" d="http://j.wovn.io/M343.84,30.31h9.42a1.16,1.16,0,0,1,1.18,1.18V61.79A1.16,1.16,0,0,1,353.26,63h-9.42a1.16,1.16,0,0,1-1.18-1.18V31.48C342.52,30.89,343.11,30.31,343.84,30.31Z"/><path id="letter-small-o" class="color-letter" d="http://j.wovn.io/M379,29.28a17.36,17.36,0,1,0,17.36,17.36A17.39,17.39,0,0,0,379,29.28Zm0,24.57a7.21,7.21,0,1,1,7.21-7.21A7.22,7.22,0,0,1,379,53.84Z"/><path id="letter-big-W" class="color-letter" d="http://j.wovn.io/M93.48,1.18H78.18a2,2,0,0,0-1.91,1.47L66.7,34.42,56.11,2.35A2.06,2.06,0,0,0,54.34,1H41.4a1.9,1.9,0,0,0-1.77,1.32L29,34.42,19.48,2.65a2,2,0,0,0-1.91-1.47H1.68a1.54,1.54,0,0,0-1.32.74A1.81,1.81,0,0,0,.06,3.38L19.77,62.67A2.06,2.06,0,0,0,21.54,64H34.63a1.85,1.85,0,0,0,1.77-1.32L47.58,30.6,58.76,62.67A2.06,2.06,0,0,0,60.52,64H73.61a1.9,1.9,0,0,0,1.77-1.32L95.09,3.38a1.4,1.4,0,0,0-.29-1.47A1.54,1.54,0,0,0,93.48,1.18Z"/><path id="letter-big-O" class="color-letter" d="http://j.wovn.io/M132,0C113.19,0,98.48,14.27,98.48,32.51s14.71,32.22,33.39,32.22,33.54-14.27,33.54-32.51S150.7,0,132,0Zm14.56,32.51C146.58,41.34,140.26,48,132,48s-14.71-6.77-14.71-15.74,6.18-15.45,14.56-15.45S146.58,23.54,146.58,32.51Z"/><path id="letter-big-V" class="color-letter" d="http://j.wovn.io/M232.06,1.18H215.73a2.09,2.09,0,0,0-1.91,1.32L201,38,188.22,2.5a2.09,2.09,0,0,0-1.91-1.32H169.53a1.54,1.54,0,0,0-1.32.74,1.58,1.58,0,0,0-.15,1.62L191.9,62.82A1.91,1.91,0,0,0,193.66,64h14.12a1.91,1.91,0,0,0,1.77-1.18L233.38,3.53a1.74,1.74,0,0,0-.15-1.47C233,1.44,232.65,1.18,232.06,1.18Z"/><path id="letter-big-N" class="color-letter" d="http://j.wovn.io/M301.05,1.18h-15.3a1.47,1.47,0,0,0-1.47,1.47V32.37L261,1.91a1.81,1.81,0,0,0-1.47-.74H245a1.47,1.47,0,0,0-1.47,1.47V62.52A1.47,1.47,0,0,0,245,64h15.45a1.47,1.47,0,0,0,1.47-1.47V31.63L286,63.26a1.81,1.81,0,0,0,1.47.74h13.53a1.47,1.47,0,0,0,1.47-1.47V2.65A1.47,1.47,0,0,0,301.05,1.18Z"/></svg>';
        _HTML += '</a>';
        _HTML += '</div>';
        _HTML += '<div class="wovn-lang-selector">';
        _HTML += '<div class="wovn-lang-selector-links">'
        _HTML += '<span class="wovn-current-lang">Loading...</span>';
        _HTML += '<a class="wovn-logo wovn-logo--small" href="http://wovn.io/" target="_blank">';
        _HTML += '<svg id="wovn-logo--floating" xmlns="http://www.w3.org/2000/svg" viewBox="http://j.wovn.io/0 0 66.96 39.35"><circle class="color-dot" cx="http://j.wovn.io/60.71" cy="33.1" r="http://j.wovn.io/6.25"/><path class="color-letter" d="http://j.wovn.io/M58.42.09H48.86a1.27,1.27,0,0,0-1.2.92l-6,19.86L35.06.83A1.29,1.29,0,0,0,34,0H25.87a1.19,1.19,0,0,0-1.1.83l-6.62,20L12.17,1A1.27,1.27,0,0,0,11,.09H1A1,1,0,0,0,.22.55,1.13,1.13,0,0,0,0,1.47L12.36,38.52a1.29,1.29,0,0,0,1.1.83h8.18a1.16,1.16,0,0,0,1.1-.83l7-20,7,20a1.29,1.29,0,0,0,1.1.83H46a1.19,1.19,0,0,0,1.1-.83L59.43,1.47a.88.88,0,0,0-.18-.92A1,1,0,0,0,58.42.09Z"/></svg>';
        _HTML += '<svg id="wovn-logo--default" xmlns="http://www.w3.org/2000/svg" viewBox="http://j.wovn.io/0 0 396.36 64.73"><circle class="color-dot" cx="http://j.wovn.io/322.58" cy="http://j.wovn.io/53.99" r="10"/><path class="color-letter" id="letter-small-i" d="http://j.wovn.io/M343.84,30.31h9.42a1.16,1.16,0,0,1,1.18,1.18V61.79A1.16,1.16,0,0,1,353.26,63h-9.42a1.16,1.16,0,0,1-1.18-1.18V31.48C342.52,30.89,343.11,30.31,343.84,30.31Z"/><path id="letter-small-o" class="color-letter" d="http://j.wovn.io/M379,29.28a17.36,17.36,0,1,0,17.36,17.36A17.39,17.39,0,0,0,379,29.28Zm0,24.57a7.21,7.21,0,1,1,7.21-7.21A7.22,7.22,0,0,1,379,53.84Z"/><path id="letter-big-W" class="color-letter" d="http://j.wovn.io/M93.48,1.18H78.18a2,2,0,0,0-1.91,1.47L66.7,34.42,56.11,2.35A2.06,2.06,0,0,0,54.34,1H41.4a1.9,1.9,0,0,0-1.77,1.32L29,34.42,19.48,2.65a2,2,0,0,0-1.91-1.47H1.68a1.54,1.54,0,0,0-1.32.74A1.81,1.81,0,0,0,.06,3.38L19.77,62.67A2.06,2.06,0,0,0,21.54,64H34.63a1.85,1.85,0,0,0,1.77-1.32L47.58,30.6,58.76,62.67A2.06,2.06,0,0,0,60.52,64H73.61a1.9,1.9,0,0,0,1.77-1.32L95.09,3.38a1.4,1.4,0,0,0-.29-1.47A1.54,1.54,0,0,0,93.48,1.18Z"/><path id="letter-big-O" class="color-letter" d="http://j.wovn.io/M132,0C113.19,0,98.48,14.27,98.48,32.51s14.71,32.22,33.39,32.22,33.54-14.27,33.54-32.51S150.7,0,132,0Zm14.56,32.51C146.58,41.34,140.26,48,132,48s-14.71-6.77-14.71-15.74,6.18-15.45,14.56-15.45S146.58,23.54,146.58,32.51Z"/><path id="letter-big-V" class="color-letter" d="http://j.wovn.io/M232.06,1.18H215.73a2.09,2.09,0,0,0-1.91,1.32L201,38,188.22,2.5a2.09,2.09,0,0,0-1.91-1.32H169.53a1.54,1.54,0,0,0-1.32.74,1.58,1.58,0,0,0-.15,1.62L191.9,62.82A1.91,1.91,0,0,0,193.66,64h14.12a1.91,1.91,0,0,0,1.77-1.18L233.38,3.53a1.74,1.74,0,0,0-.15-1.47C233,1.44,232.65,1.18,232.06,1.18Z"/><path id="letter-big-N" class="color-letter" d="http://j.wovn.io/M301.05,1.18h-15.3a1.47,1.47,0,0,0-1.47,1.47V32.37L261,1.91a1.81,1.81,0,0,0-1.47-.74H245a1.47,1.47,0,0,0-1.47,1.47V62.52A1.47,1.47,0,0,0,245,64h15.45a1.47,1.47,0,0,0,1.47-1.47V31.63L286,63.26a1.81,1.81,0,0,0,1.47.74h13.53a1.47,1.47,0,0,0,1.47-1.47V2.65A1.47,1.47,0,0,0,301.05,1.18Z"/></svg>';
        _HTML += '</a>';
        _HTML += '</div>';
        _HTML += '<span id="translated-by-machine">Translated by machine</span>';
        _HTML += '</div>';

    widgetElement.innerHTML = _HTML;
    document.body.appendChild(widgetElement);
    appendedChildren.push(widgetElement);

    var clickCatcher = document.createElement('div');
    clickCatcher.setAttribute('style', 'z-index:9999999999;position:fixed;display:none;top:0;right:0;bottom:0;left:0;background:transparent;pointer-events: auto;');
    clickCatcher.setAttribute('class', 'wovn-click-catcher');
    onEvent(clickCatcher, 'click', closeDropDown);
    widgetElement.parentNode.insertBefore(clickCatcher, widgetElement);

    var dropDownButton = widgetElement.getElementsByClassName('wovn-lang-selector')[0];
    var langListContainer = widgetElement.getElementsByClassName('wovn-lang-container')[0];

    setTimeout(function() {
      animShowWidget(widgetElement);
    }, 1000);

    if (widget.c('Agent').isMobile()) {
      widgetElement.className += ' mobile slide-out';

      onEvent(window, 'scroll', scrollWidgetAction);
      this.scrollStop(scrollStopWidgetAction);

      if (!widget.c('Utils').pageIsWidgetPreview()) {
        onHoldAnim = setTimeout(function() {
          animHideWidget(widgetElement);
        }, 5000);
      }
    }

    onEvent(dropDownButton, 'click', openDropDown);
    onEvent(langListContainer, 'click', closeDropDown);

    function openDropDown () {
      if(onHoldAnim !== null) clearTimeout(onHoldAnim);
      var e = arguments[0] || window.event;
      if (e.stopPropagation)
        e.stopPropagation();
      else
        e.returnValue = false;
      if (that.hasClass(langListContainer, 'is-open')) {
        that.removeClass(langListContainer, 'is-open');
        clickCatcher.style.display = 'none';
      }
      else {
        that.addClass(langListContainer, 'is-open');
        clickCatcher.style.display = 'block';
      }
    }

    function closeDropDown () {
      onHoldAnim = setTimeout(function() {
        animHideWidget(widgetElement);
      }, 4000);

      var e = arguments[0] || window.event;
      if (e.stopPropagation)
        e.stopPropagation();
      else
        e.returnValue = false;
      that.removeClass(langListContainer, 'is-open');
      clickCatcher.style.display = 'none';
    }

    widgetElement.setAttribute('data-ready', widget.tag.getAttribute('data-wovnio') + '&ready=true');
    applyWidgetOptions();
    that.refresh(widgetElement);
  };

  this.getWidgetElement = function () {
    return document.getElementById(that.WIDGET_ID);
  };

  var clearWidgetLangList = function() {
    var widgetElement = that.getWidgetElement();
    if (!widgetElement) return;
    var listItems = widget.c('Utils').toArrayFromDomList(widgetElement.getElementsByTagName('li'));
    for (var i = 0; i < listItems.length; ++i) listItems[i].parentNode.removeChild(listItems[i]);
  };

  this.refresh = function () {
    var widgetElement = that.getWidgetElement();
    if (!widgetElement) return;
    // TODO: reset the lang list and/or remove unused/duplicate languages
    if (wovnGetElementsByClassName(widgetElement, 'wovn-switch').length === 0) {
      buildWidgetLangList(widget.c('Data').getConvertedLangs());
      attachLangClickHandlers();
    }

    if (that.shouldShowWidget(widgetElement)) {
      // TODO: THIS SEEMS LIKE THE WRONG WAY TO DO THIS?
      if (!widget.c('Url').isLiveEditor()) {
        widgetElement.style.display = 'block';
      }
      disableBrowserTranslation();
    }
    else {
      widgetElement.style.display = 'none';
    }
  };

  this.shouldShowWidget = function(widgetElement) {
    return wovnGetElementsByClassName(widgetElement, 'wovn-switch').length > 1 &&
      !widget.c('ValueStore').empty() &&
      !widget.c('Data').hasDomainPrecacheFeature() &&
      !widget.c('Data').hasEmptyOriginalOptions();
  }
  /**
   * start wovn's main function
   * @param {Function} callback called when succeed
   */
  this.start = function(callback) {
    // if the browser is a web crawler, do nothing
    if (widget.c('Agent').isCrawler()) return;
    // shims
    widget.c('Utils');
    // loads API
    widget.c('Api');
    // load data
    loadData(init);
    widget.c('PerformanceMonitor').mark('data_load_script_insert');

    function init () {
      if (!widget.c('Data').getImageValues) widget.c('Data').getImageValues = function() {return {}};
      if (!widget.c('Data').getTextValues) widget.c('Data').getTextValues = function() {return {}};

      widget.c('PerformanceMonitor').mark('data_load_end');

      if (widget.c('Data').useImmediateWidget() || widget.c('DomAuditor').mustEnsureOneReport()) {
        widget.c('Utils').onDomReady(widgetOnLoadedDocument, true);
      } else {
        widget.c('Utils').onLoadingComplete(widgetOnLoadedDocument);
      }

      // waits for the page to be loaded before creating the widget
      function widgetOnLoadedDocument() {
        if (widget.c('Data').hasNoAutomaticRedirection()) {
          // hide unpublished translation texts for change swapLangs to replace links and whatever
          var langs = widget.c('Data').getPublishedLangs()
          widget.c('TranslationDataBridge').onlyShowLangs(langs)
          // stop dymanic loading for only replace links
          widget.disableLoadTranslation()
        }
        _widgetOnLoadedDocument()
      }

      function _widgetOnLoadedDocument() {
        insertHreflangLinks();
        // lang will set doc lang
        if (!widget.c('Data').useWidgetManualStartFeature()) {
          widget.c('Interface').build();
          if (widget.c('Url').isLiveEditor()) {
            // Use original language for LiveEditor's initialization.
            widget.c('Lang').setDocLang(widget.c('Data').getLang());
          }
          else {
            widget.c('Lang').setDocLang();
          }
          widget.c('AuditTrigger').start();
        }

        widget.c('SPA').listen();
        widget.c('Api').makeReady();
        widget.c('TagCustomization').load();
        if (widget.c('Data').useMachineTranslatedModal()) {
          var loadedOne = false;
          function kickoffModal () {
            if (loadedOne) {
              var manualLangChange = false
              widget.c('MachineTranslatedModal').start(manualLangChange);
            }
            else {
              loadedOne = true;
            }
          }
          widget.loadComponents(['Vue', 'MachineTranslatedModal'], {'Vue': kickoffModal, 'MachineTranslatedModal': kickoffModal});
        }

        if (callback) callback();

        widget.c('PerformanceMonitor').mark('first_translation_finish');

        if (widget.c('Url').isLiveEditor()) {
          widget.c('Interface').changeLang('ed');
        } else if (widget.c('Data').hasWidgetSessionFeature()) {
          var sessionListener = { 'target': document, 'eventName': 'wovnSessionReady', 'handler': addSessionTools }

          widget.c('Utils').onEvent(sessionListener.target, sessionListener.eventName, sessionListener.handler)
          attachedHandlers.push(sessionListener);
          widget.c('SessionProxy').start()
        }
      }
    }
  };

  /**
   * Add the hreflang tags to the page
   */
  function insertHreflangLinks() {
    var prerender_io = widget.c('Data').getOptions().prerender_io;
    if (prerender_io) {
      widget.c('Data').updateOptions({lang_path: 'query'})
    }
    var langPath = widget.c('Data').getOptions().lang_path;
    if (!widget.isBackend() && (langPath === 'query' || langPath === 'path' || langPath === 'subdomain' || langPath === 'custom_domain')) {
      var defaultCode = widget.c('Lang').getDefaultCodeIfExists();
      // Must not be called before load page.
      if (!defaultCode) return;

      var availableLanguages = widget.c('Data').getPublishedLangs();
      availableLanguages.push(defaultCode);
      var insertionLocation = document.getElementsByTagName('head').length > 0 ? document.getElementsByTagName('head')[0] : null;

      if (insertionLocation) {
        for(var i = 0; i < availableLanguages.length; i++) {
          if (availableLanguages[i]) {
            var langUrl = widget.c('Url').getUrl(availableLanguages[i], document.location.href);
            var link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = widget.c('Lang').iso6391Normalization(availableLanguages[i]);
            link.href = langUrl;
            insertionLocation.appendChild(link);
          }
        }
      }
    }
  }

  /**
   * get Data-related data and callback when all information collected
   * @param {Function} callback called when all information collected
   */
  function loadData(callback) {
    var remainCount = 2;

    var optionData = {};

    that.loadData(function(data) {
      widget.c('Data').set(data);
      successCallback();
    })

    widget.loadDomainOption(function(option) {
      optionData = option;
      successCallback();
    }, function() {});

    // if error occured, callback won't executed.
    function successCallback() {
      remainCount--;

      if (remainCount == 0) {
        widget.c('Data').setOptions(optionData);
        callback();
      }
    }
  }

  this.loadData = function (callback) {
    var isLiveEditor = widget.c('Url').isLiveEditor();
    if (isLiveEditor) {
      widget.loadSavedData(function(data) {
        callback(data);
      }, function() {
        alert("Failed to load wovn's data. please reload.")
      });
    } else {
      setPreviewCookieIfExist();
      var signature = getPreviewSignature();
      if (signature) {
        widget.loadPreviewData(signature, callback, function() {
          widget.loadDataJson(callback)
        });
      } else {
        widget.loadDataJson(function(data) {
          callback(data);
        });
      }
    }
  }

  /**
   * Reload Data component for SPA
   */
  this.reload = function() {
    var options = widget.c('Data').getOptions();
    widget.c('DomAuditor').stop();
    widget.c('AuditTrigger').stop();
    widget.c('SPA').stop();
    widget.reloadData(function(data) {
      // Set options simultaneously to avoid race condition.
      data['widgetOptions'] = options;
      widget.c('Data').set(data);
      widget.reinstallComponent('ValueStore');
      widget.reinstallComponent('AuditTrigger');
      widget.reinstallComponent('DomAuditor');
      if (!widget.c('Data').hasSpaStopClearingWidgetLanguages()) {
        clearWidgetLangList();
      }

      // single page application frameworks like Turbolinks might remove the
      // widget, so we must rebuild it if it must be displayed (widgetElement is
      // set) and if it was removed from the DOM
      if (widgetElement && !document.getElementById(that.WIDGET_ID)) {
        widget.c('Interface').build()
      }

      widget.c('Interface').refresh();
      widget.c('AuditTrigger').start();
      widget.c('TagCustomization').load();
      widget.c('SPA').listen();
    });
  };

  this.destroy = function () {
    for (var i = 0; i < attachedHandlers.length; i++) {
      widget.c('Utils').removeHandler(attachedHandlers[i].target, attachedHandlers[i].eventName, attachedHandlers[i].handler);
    }
    for (var i = 0; i < appendedChildren.length; i++) {
      if (appendedChildren[i].parentNode) appendedChildren[i].parentNode.removeChild(appendedChildren[i]);
    }
  };

  // for preview mode
  var preview_cookie_name = 'wovn_preview_signature';

  function setPreviewCookieIfExist() {
    var cookie = widget.c('Cookie');
    var match = location.search.match(/wovn_preview_signature=([^&]+)/);
    if (match) {
      var signature = match[1];
      cookie.set(preview_cookie_name, signature, null, '');
    }
  }

  function getPreviewSignature() {
    return widget.c('Cookie').get(preview_cookie_name);
  }

  function addSessionTools() {
    var wovnHost = widget.c('RailsBridge').wovnHost.replace(/\/$/, '')
    var translatePageUrl = wovnHost + '/pages/translate?page=' + widget.c('Data').getPageId()

    setWovnLink(translatePageUrl)
    addEditButton(function () {
      widget.c('SessionProxy').sendRequest('POST', '/in_page/sessions', null, function (response) {
        var liveEditorHash = '&wovn.targetLang=' + widget.c('Lang').getCurrentLang() + '&wovn.editing=' + response.token

        location.hash += liveEditorHash
        location.reload()
      })
    })
  }

  function setWovnLink(href) {
    var widgetElement = document.getElementById(that.WIDGET_ID);

    if (widgetElement) {
      var wovnLinkElements = widgetElement.querySelectorAll('a.wovn-logo')

      for (var i = 0; i < wovnLinkElements.length; ++i) {
        wovnLinkElements[i].href = href
      }
    }
  }

  function addEditButton(action) {
    var widgetElement = document.getElementById(that.WIDGET_ID);

    if (widgetElement) {
      var languageListElement = widgetElement.querySelector('.wovn-lang-list')
      var editButtonElement = document.createElement('LI')

      editButtonElement.className = 'wovn-live-edit-switch'
      editButtonElement.innerHTML = 'LIVE EDIT'
      editButtonElement.onclick = action

      that.insertStyles([
        '#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.wovn-live-edit-switch { background-color: #966acc; color: #ffffff; }',
        '#wovn-translate-widget[wovn] .wovn-lang-container .wovn-lang-list li.wovn-live-edit-switch:hover { background-color: rgba(150, 106, 204, 0.8); }'
      ])
      languageListElement.appendChild(editButtonElement)
    }
  }
};

if (typeof(components) === 'undefined') var components = {};
components['Api'] = function (widget) {
  var that = this;
  var apiReady = false;

  // dispatched when language is changed
  var langChangedEvent = widget.c('Utils').createInitEvent('wovnLangChanged', true, true);

  // dispatched when WOVN API is ready
  var wovnApiReadyEvent = widget.c('Utils').createInitEvent('wovnApiReady', true, true);

  // Create WOVN.io object
  WOVN = {};
  WOVN.io = {};

  WOVN.io.changeLang = function (lang) {
    if (!apiReady) return false;

    var langCode = widget.c('Lang').getCode(lang);

    // invalid lang
    if (!langCode) return false;

    widget.c('Interface').changeLang(langCode, function(newLang) {
      widget.c('Url').changeUrl(newLang)
    });
    return true;
  };

  WOVN.io.getCurrentLang = function () {
    return getCurrentLang();
  };

  WOVN.io.getWovnUrl = function (url) {
    if (!apiReady) return widget.c('Url').getLocation(url).href;

    var lang = widget.c('Lang').getActualLang()
    return widget.c('Url').getUrl(lang, url)
  }

  WOVN.io.swap = function(element) {
    if (!apiReady) return;

    var lang = getCurrentLang()
    if (!lang) return

    var langCode = lang.code
    if (element) {
      widget.c('DomAuditor').swapVals(langCode, {head: element}, true)
    } else {
      widget.c('DomAuditor').swapVals(langCode, {}, true)
    }
  }

  WOVN.io.manualStart = function () {
    if (apiReady) {
      widget.c('Interface').build();
      widget.c('Lang').setDocLang();
      widget.c('AuditTrigger').start();
    }
    else {
      window.addEventListener('wovnApiReady', function(evt) {
        widget.c('Interface').build();
        widget.c('Lang').setDocLang();
        widget.c('AuditTrigger').start();
      })
    }
  }

  WOVN.io.translateTexts = function(fromLang, toLang, texts) {
    if (!apiReady) {
      var defaultTexts = {};
      for (var i = 0; i < texts.length; i++) {
        defaultTexts[texts[i]] = texts[i];
      }
      return defaultTexts;
    }

    return widget.c('ValueStore').translateTexts(fromLang, toLang, texts);
  }

  WOVN.io.search = function (query, language, callback, errorCallback) {
    if (!errorCallback) {
      throw new Error('errorCallback is required')
    }

    if (!callback) {
      errorCallback('callback is required')
      return
    }

    if (!language) {
      errorCallback('language is required')
      return
    }
    if (!query) {
      errorCallback('query is required')
      return
    }

    if (!language) errorCallback('language is required')
    widget.c('InSiteSearcher').search(query, language, callback, errorCallback)
  }

  function isApiReady() {
    return apiReady
  }

  WOVN.io._private = {
    widget: widget,
    isApiReady: isApiReady
  }

  this.dispatchLangChangedEvent = function () {
    widget.c('Utils').dispatchEvent(langChangedEvent);
  };

  function getCurrentLang() {
    if (!apiReady) return widget.c('Lang').get('en');

    return widget.c('Lang').get(widget.c('Lang').getActualLang());
  }

  // Create Wovnio object for backwards compatibility
  Wovnio = WOVN.io;

  this.makeReady = function () {
    apiReady = true;
    this.dispatchWovnApiReadyEvent();
  }

  // Dispatch API loaded event
  this.dispatchWovnApiReadyEvent = function () {
    if (!widget.c('Url').isLiveEditor()) {
      widget.c('Utils').dispatchEvent(wovnApiReadyEvent);
    }
    // only allow this event to be called once
    that.dispatchWovnApiReadyEvent = function () {
    };
  };
};

if (typeof(components) === 'undefined') var components = {};
components['SPA'] = function(widget) {
  var that = this;
  var lastHref = null;
  var timer = undefined;

  widget.c('Utils').onEvent(window, 'popstate', function () {
    var langPath = widget.c('Data').getOptions().lang_path;
    var docLang = widget.c('Lang').getDocLang()
    // do nothing if Data is not loaded
    if (!docLang) return;

    if ((langPath === 'query' || langPath === 'path' || (widget.isBackend() && widget.tag.getAttribute('urlPattern'))) && docLang !== widget.c('Url').getLangCode()) {
      widget.c('Interface').changeLang(widget.c('Url').getLangCode());
    }
  });

  var fixHref = function(href) {
    return widget.c('Url').removeHash(href);
  };

  this.getCurrentFixedHref = function () {
    return fixHref(location.href);
  }

  this.withTurbolinks = function () {
    return lastHref && !timer && window.Turbolinks
  }

  function refreshWidget() {
    if (window.Turbolinks && timer) {
      clearInterval(timer);
      timer = null
      widget.c('Utils').onEvent(document, 'turbolinks:load', refreshWidget)
    }

    var currentHref = that.getCurrentFixedHref();

    // if url hasn't changed OR new url is the result of a lang change(from the old url)
    if (lastHref === currentHref ||
        currentHref === widget.c('Url').getUrl(widget.c('Url').getLangCode(currentHref), lastHref)) {
      return;
    }

    lastHref = currentHref;
    widget.c('Interface').reload();
  }

  this.listen = function() {
    if (!lastHref) {
      lastHref = that.getCurrentFixedHref();
    }

    timer = setInterval(refreshWidget, 100);
  };

  this.stop = function() {
    if (timer) {
      clearInterval(timer);
    } else if (window.Turbolinks) {
      widget.c('Utils').removeHandler(document, 'turbolinks:load', refreshWidget)
    }
  };

  this.destroy = function() {
    that.stop();
  };
};

if (typeof(components) === 'undefined') var components = {}
components['ParcelForwarding'] = function(widget) {
  var that = this
  var Vue = widget.c('Vue')
  this.banner = null
  this.start = function () {
    widget.c('Interface').insertStyles(widget.c('RailsBridge')['tenso']['style'])

    var PARCEL_FORWARDING_LANG_COOKIE = "wovn_parcel_forwarding_lang"
    var provider = widget.c('Data').get()["widgetOptions"]["parcel_forwarding"]
    var providerName = {};
    if (provider === 'raku-ichiban') {
      providerName['ja'] = '楽一番';
      providerName['en'] = 'Leyifan';
      providerName['cht'] = '楽一番';
      providerName['chs'] = '楽一番';
    }
    else {
      providerName['ja'] = '転送コム';
      providerName['en'] = 'Tenso';
      providerName['ko'] = 'http://j.wovn.io/tenso.com';
      providerName['cht'] = 'tenso';
      providerName['chs'] = 'tenso';
    }
    var parcelForwardingLangs = [
      {name: '日本', code: 'jp'},
      {name: 'EN', code: 'en'},
      {name: '繁體', code: 'cht'},
      {name: '简体', code: 'chs'},
    ]
    if (provider !== 'raku-ichiban') {
      parcelForwardingLangs.push({name: '한글', code: 'kr'})
    }
    function getParcelForwardingLang(force) {
      var currLang = widget.c('Cookie').get(PARCEL_FORWARDING_LANG_COOKIE)

      if (currLang === null || force) {
        var docLang = widget.c('Lang').getDocLang()

        if (provider === 'raku-ichiban') {
          currLang = 'chs'
        }
        else { //provider == tenso
          currLang = 'en'
        }

        switch (docLang) {
          case 'ja':
            currLang = 'jp'
            break
          case 'zh-CHS':
            currLang = 'chs'
            break
          case 'zh-CHT':
            currLang = 'cht'
            break
          case 'ko':
            if (provider !== 'raku-ichiban') {
              currLang = 'kr'
            }
            break
          case 'en':
            currLang = 'en'
        }

        widget.c('Cookie').set(PARCEL_FORWARDING_LANG_COOKIE, currLang, 365)
      }

      return currLang
    }

    // do not create tenso modal if already shown to user
    if (widget.c('Cookie').get(PARCEL_FORWARDING_LANG_COOKIE) === null) {
      var tensoModal = document.createElement('div')
      tensoModal.id = 'wovn-tenso-modal';
      if (provider == "raku-ichiban") {
        tensoModal.className = 'raku-ichiban';
      }
      tensoModal.setAttribute('wovn-ignore', '')
      tensoModal.innerHTML = widget.c('RailsBridge')['tenso']['modal'];
      tensoModal.setAttribute('v-bind:class', '{opened: opened}')
      tensoModal.setAttribute('v-on:click', 'close')
      document.body.appendChild(tensoModal)
      var tensoModalVue = new Vue({
        el: '#wovn-tenso-modal',
        data: {
          opened: false,
          currentLangCode: getParcelForwardingLang(),
          languages: parcelForwardingLangs,
          textContents: {
            'jp': {
              'title': '簡単に海外発送することができます！',
              'subtitle1': providerName['ja'] + 'を使えば、簡単に海外配送が可能になります。',
              'subtitle2': '日本の通販サイトの商品を、あなたの国へお届けします。登録は無料！',
              'step1': providerName['ja'] + 'に登録して日本の住所をゲット！登録は無料！',
              'step2': '日本の通販サイトでお好きなアイテムを購入',
              'step3': '日本国外へ商品を転送！',
              'cancel': '閉じる',
              'ok': '登録はこちら'
            },
            'en': {
              'title': 'Easily shop in Japan and ship overseas!',
              'subtitle1': 'With ' + providerName['en'] + ', you can easily order products from Japan and have them shipped to your home address in your country.',
              'subtitle2': 'Registration is free!',
              'step1': 'Get a ' + providerName['en'] + ' Japanese mailing address. Registration is free!',
              'step2': 'Purchase your items from any Japanese e-commerce site.',
              'step3': 'Your items will be forwarded from your Japanese address to your overseas address.',
              'cancel': 'Close',
              'ok': 'Register now'
            },
            'cht': {
              'title': '將您購買的商品快速便捷地送往海外！',
              'subtitle1': '利用' + providerName['cht'] + '，將原本困難的海外配送瞬間化為可能',
              'subtitle2': '免費註冊！讓您在日本網站購買的商品被直接送到您家！',
              'step1': '在' + providerName['cht'] + '註冊後即獲得日本地址！註冊免費！',
              'step2': '在日本的網站選購您喜愛的商品',
              'step3': '商品將會從日本國內被送往您所在的國家！',
              'cancel': '關閉',
              'ok': '點擊這裡註冊'
            },
            'chs': {
              'title': '将您购买的商品快速便捷地送往海外！',
              'subtitle1': '利用' + providerName['chs'] + '，将原本困难的海外配送瞬间化为可能',
              'subtitle2': '免费注册！让您在日本网站购买的商品被直接送到家！',
              'step1': '在' + providerName['chs'] + '注册后即获得日本地址！注册免费！',
              'step2': '在日本的网站选购您喜爱的商品',
              'step3': '商品将会从日本国内被送往您所在的国家！',
              'cancel': '关闭',
              'ok': '点击这里注册'
            },
            'kr': {
              'title': '쉽게 해외 배송 수 있습니다!',
              'subtitle1': '전송 컴을 사용하면 쉽게 해외 배송이 가능합니다.',
              'subtitle2': '일본 인터넷 쇼핑몰의 상품을 당신의 국가에 제공합니다. 가입은 무료!',
              'step1': '전송 컴에 가입하고 일본 주소를 겟트! 가입은 무료!',
              'step2': '일본 인터넷 쇼핑몰에서 원하는 상품을 구입',
              'step3': '일본 국외에 상품을 전송!',
              'cancel': '닫기',
              'ok': '등록은 이쪽'
            }
          }
        },
        computed: {
          langLink: function () {
            if (provider == "raku-ichiban") {
              return 'http://www.leyifan.com/' + (this.currentLangCode === 'chs' ? '' : this.currentLangCode)
            }
            else { // provider == tenso
              return 'http://www.tenso.com/' + this.currentLangCode + '/static/lp_shop_index'
            }
          }
        },
        methods: {
          changeLang: function (langObj) {
            this.currentLangCode = langObj.code
            widget.c('Cookie').set(PARCEL_FORWARDING_LANG_COOKIE, this.currentLangCode, 365)
          },
          open: function () {
            this.opened = true
          },
          close: function () {
            this.opened = false
          }
        },
        watch: {
          currentLangCode: function () {
            tensoBannerVue.currentLangCode = this.currentLangCode
          }
        }
      })
      tensoModalVue.open()
    }

    //==========================================================================
    var tensoBanner = document.createElement('div')
    tensoBanner.id = 'wovn-tenso-banner'
    if (provider == "raku-ichiban") {
      tensoBanner.className = 'raku-ichiban';
    }
    tensoBanner.setAttribute('wovn-ignore', '')
    tensoBanner.innerHTML = widget.c('RailsBridge')['tenso']['banner']
    tensoBanner.setAttribute('v-bind:class', '{opened: opened}')
    document.body.appendChild(tensoBanner)
    var tensoBannerVue = new Vue({
      el: '#wovn-tenso-banner',
      data: {
        opened: false,
        imageSrc:'',
        currentLangCode: tensoModalVue ? tensoModalVue.currentLangCode : getParcelForwardingLang(),
        languages: parcelForwardingLangs,
        textContents: {
          'jp': {
            'bannerText': '海外の顧客、商品を購入するにはこちらをクリック！',
            'link' : 'ここをクリック'
          },
          'en': {
            'bannerText': 'Overseas customers, click here to buy this item!',
            'link' : 'Click Here'
          },
          'cht': {
            'bannerText': '海外客戶，點擊這裡買這個商品！',
            'link' : '點擊這裡'
          },
          'chs': {
            'bannerText': '海外客户，点击这里买这个商品！',
            'link' : '点击这里'
          },
          'kr': {
            'bannerText': '해외 고객이 상품을 구입하려면 여기를 클릭!',
            'link' : '여기를 클릭하세요'
          }
        }
      },
      computed: {
        langLink: function () {
          if (provider == "raku-ichiban") {
            return 'http://www.leyifan.com/' + (this.currentLangCode === 'chs' ? '' : this.currentLangCode)
          }
          else { // provider == "tenso"
            return 'http://www.tenso.com/' + this.currentLangCode + '/static/lp_shop_index'
          }
        }
      },
      methods: {
        changeLang: function () {
          this.currentLangCode = getParcelForwardingLang(true)
          widget.c('Cookie').set(PARCEL_FORWARDING_LANG_COOKIE, this.currentLangCode, 365)
        },
        open: function () {
          document.body.setAttribute('wovn-tenso-banner-on', '')
          this.opened = true
        },
        close: function () {
          this.opened = false
          document.body.removeAttribute('wovn-tenso-banner-on')
        }
      }
    })
    tensoBannerVue.open()
    this.banner = tensoBannerVue
  }
}


// expose components so that can be used by the webpack side
document.WOVNIO.components = components;
!function(t){var e={};function r(a){if(e[a])return e[a].exports;var n=e[a]={i:a,l:!1,exports:{}};return t[a].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=t,r.c=e,r.d=function(t,e,a){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:a})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var a=Object.create(null);if(r.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)r.d(a,n,function(e){return t[e]}.bind(null,n));return a},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=86)}({0:function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var a=function(){function t(){}return t.prototype.c=function(t){return this.instance().c(t)},Object.defineProperty(t.prototype,"tag",{get:function(){return this.instance()?this.instance().tag:{getAttribute:function(){}}},enumerable:!0,configurable:!0}),t.prototype.instance=function(){return window.WOVN&&window.WOVN.io&&window.WOVN.io._private?window.WOVN.io._private.widget:null},t.prototype.isBackend=function(){return this.tag.getAttribute("backend")},t.prototype.getBackendCurrentLang=function(){return this.tag.getAttribute("currentLang")},t.prototype.getBackendDefaultLang=function(){return this.tag.getAttribute("defaultLang")},t.prototype.isComponentLoaded=function(t){return!!this.instance()&&this.instance().isComponentLoaded()},t.prototype.isTest=function(){return this.instance().isTest||!1},t.prototype.loadTranslation=function(t,e,r){this.instance()&&this.instance().loadTranslation(t,e,r)},t.prototype.reloadData=function(t){this.instance()&&this.instance().reloadData(t)},t.prototype.loadPreviewData=function(t,e,r){this.instance().loadPreviewData(t,e,r)},t.prototype.loadDataJson=function(t){this.instance().loadDataJson(t)},t.prototype.reinstallComponent=function(t){this.instance().reinstallComponent(t)},t.prototype.loadDomainOption=function(t,e){this.instance().loadDomainOption(t,e)},t.prototype.loadComponents=function(t,e){this.instance().loadComponents(t,e)},t.prototype.loadSavedData=function(t,e){this.instance().loadSavedData(t,e)},t}();e.default=new a},130:function(t,e,r){"use strict";r.r(e);var a=r(20),n=r.n(a),i=r(0),o=r.n(i),s=r(2),c=r.n(s);function u(t){return(u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}document.WOVNIO=document.WOVNIO||{},document.WOVNIO.components=document.WOVNIO.components||[],document.WOVNIO.components.DomAuditor=function(){var t,e,r,a,i=["div","p","pre","blockquote","figcaption","address","h1","h2","h3","h4","h5","h6","li","dt","dd","th","td"],s=["span","a","em","strong","small","tt","s","cite","q","dfn","abbr","time","code","var","samp","sub","sup","i","b","kdd","mark","u","rb","rt","rtc","rp","bdi","bdo","wbr","nobr"],u=["br","img","ruby","ul","ol"],l=this;a=o.a.isTest()?100:c.a.IS_DEV?1e3:o.a.c("Url").hasFlag("instantReport")?1e3:5e3;var d,f,g,h=0,p=!1,m=!1,v=!1,b=void 0,y=void 0,w={"og:description":!0,"twitter:description":!0,"og:title":!0,"twitter:title":!0},x={"og:image":!0,"og:image:url":!0,"og:image:secure_url":!0,"twitter:image":!0};function N(){t={},e={},r=!1,clearTimeout(d),d=void 0,f=0,g=0,h=0}function A(t){try{encodeURIComponent(o.a.c("Utils").toJSON(t))}catch(t){return!1}var e=o.a.c("Utils").trimString(t);return""!==e&&!/^(%([a-f]|[0-9]){2})+$/i.test(e)&&function(t){var e=o.a.c("Lang");return"ko"===e.getDefaultCodeIfExists()||!e.isKoreanText(t)}(e)}function S(t,e,r,a,n,i){return{src:t,xpath:e,complex:r,unified:Boolean(n),is_third_party:a,exists:!0,dsts:i}}function T(t){return/meta/.test(t.xpath)||t.is_third_party}function O(r,a,n,i,s,c,u){var d=o.a.c("Lang").getDefaultCodeIfExists();if(d&&o.a.c("Lang").getActualLang()===d){var f=S(r,a,n,i,s,c);if(l.needsUVMigrationReportForUnreportableDomain()&&!u)return;(function(e){if(!e.complex&&o.a.c("Data").useFragmentedValue()&&e.xpath.match(/text\(\)$/))for(var r in t)if(t.hasOwnProperty(r)){var a=t[r];if(a.complex&&o.a.c("StringUtils").startsWith(e.xpath,a.xpath))return!0}return!1})(f)||(t.hasOwnProperty(r)||e.hasOwnProperty(r)&&!T(e[r])||(e[r]=f),t.hasOwnProperty(r)&&!T(t[r])||(t[r]=f))}}this.isSwappedMoreThanOnce=!1,o.a.c("Url").isIframeLiveEditor()||(o.a.c("AuditTrigger").auditor=U),this.getInternalCurrentLang=function(){return b},this.getnewSrcs=function(){return e},this.getForceReporting=function(){return v},this.setReportTime=function(t){a=t},this.markHasNewMissedSrcIfFirstSeen=function(e){t.hasOwnProperty(e)||(r=!0)},N(),this.isAddableSrc=A,this.addSrc=O,this.supervisedSwapVals=function(t,e,r){if(o.a.c("PageChecker").isSupervisedPage())for(var a=document.querySelectorAll("[wovn-enable]"),n=0;n<a.length;n++){var i=a[n].firstChild||a[n];o.a.c("Data").useUnifiedValue()&&(i=a[n]),o.a.c("DomAuditor").swapVals(t,{head:i},r||!0)}else o.a.c("DomAuditor").swapVals(t,null,r||!0)},this.swapVals=function(e,a,c){if(o.a.c("Data").useUnifiedValuesMigrating()&&o.a.c("UnifiedValue").migrateReportedValueWithFragmentValue(b,e),a||(a={}),o.a.c("Data").useUnifiedValue())return o.a.c("PerformanceMonitor").mark("swap_start"),o.a.c("UnifiedValue").swapUnifiedValue(a.head||document.head.parentNode,b,e),o.a.c("PerformanceMonitor").mark("swap_end"),b=e,this.isSwappedMoreThanOnce=!0,void(o.a.c("Data").dynamicLoading()&&o.a.c("ValueStore").loadNewDetectedValue());var l=["#text","img","meta","a","area","form","input","textarea","option","source"],d=null;o.a.c("Data").useAriaLabel()&&((d=d||{})["aria-label"]=function(t,r){var a=o.a.c("NodeContainer").create(t);a.data=t.getAttribute("aria-label");var n=o.a.c("ValueStore").getByValue(a,r,e);n&&o.a.c("ValueStore").replaceAttribute(a,"aria-label",n.data,e)});for(var f=o.a.c("ValueStore").propertyIndexTags(),g=0;g<f.length;g++)l.push(f[g]);o.a.c("Data").useFragmentedValue()&&(l=(l=l.concat(i)).concat(s)),o.a.c("PerformanceMonitor").mark("swap_start"),!1!==c&&(c=!0);var h=c?function(t,r,a){if(o.a.c("Utils").canStyleChange(t)){var n=function(t){var r=[];e!==b&&o.a.c("ValueStore").revertImage(t);var a=T(t);e!==b&&""===t.style.backgroundImage&&(r=a);var n=a.map(function(t){return o.a.c("ValueStore").getDstImage(t,e)||t});return n.length>0&&n.toString()!==a.toString()&&(o.a.c("ValueStore").revertImage(t),r=T(t),o.a.c("ValueStore").replaceCssImageData(t,n)),r}(t);n.length>0&&n.forEach(function(t){O(t,r+"[@background-image]",!1,a)})}}:function(){},p=o.a.c("Data").getIgnoredPatterns();function m(t,e){return"#text"===t.nodeName.toLowerCase()&&""!==t.nodeValue.replace(/^[`~!@#\$%\^&\*\(\)\-_=\+\[\{\]\}\|;:'",\/\\?]+$/,"")}function v(t){if(y(t)||w(t)){if(t.childNodes.length>0)for(var e=0;e<t.childNodes.length;++e)if(!N(t.childNodes[e]))return!1;return!0}return!1}function y(t){return o.a.c("Utils").indexOf(i,t.nodeName.toLowerCase())>-1}function w(t){return o.a.c("Utils").indexOf(s,t.nodeName.toLowerCase())>-1}function N(t){if(!y(t)&&(-1!=o.a.c("Utils").indexOf(u,t.nodeName.toLowerCase())||w(t))){if(t.childNodes.length>0)for(var e=0;e<t.childNodes.length;++e)if(!N(t.childNodes[e]))return!1;return!0}return"#text"===t.nodeName.toLowerCase()}function T(t){var e=window.getComputedStyle(t).getPropertyValue("background-image");return o.a.c("Parser").getUrlsFromCss(e)}o.a.c("DomIterator").go({target:l,attributes:d,filter:this.createFilterCallback(p),head:a.head},function a(i,s,c,u){if(u&&u.head&&o.a.c("PageChecker").isSupervisedPage()){var l=i.nodeType===Node.ELEMENT_NODE?i:i.parentElement||i.ownerElement;if(!l||l!==u.head&&l.parentElement===u.head.parentElement)return}s&&s.match(/\[@srcset]$/)&&function(r,a,n){var i=o.a.c("ValueStore").replaceSrcsetNode(r,a,e),s=r.value;for(var c in i)if(i.hasOwnProperty(c)){var u=i[c],l=S(c,a,!0);!t.hasOwnProperty(l)&&s.indexOf(u),O(c,a,!1,n)}}(i,s,c);var d,f=!1,g=i.tagName;if("FORM"===g){if(!o.a.c("Config").urlPattern("query")||i.getAttribute("method")&&"GET"!==i.getAttribute("method").toUpperCase()){if(o.a.c("Config").backend()){var h=i.getAttribute("action")&&0!==i.getAttribute("action").length?i.getAttribute("action"):location.href;if(!o.a.c("Url").shouldIgnoreLink(h)){var p=o.a.c("Url").getUrl(e,h);i.setAttribute("action",p)}}}else{for(var y=i.children,w=y.length-1;w>=0;w--)if("INPUT"===y[w].tagName&&"wovn"===y[w].getAttribute("name")&&"hidden"===y[w].getAttribute("type"))return y[w].setAttribute("value",e),!1;var N=document.createElement("input");N.setAttribute("type","hidden"),N.setAttribute("name","wovn"),N.setAttribute("value",e),i.appendChild(N)}return!1}if("META"===g)return x[i.getAttribute("property")]?s+="[@image]":s+=i.getAttribute("name")?"[@name='"+i.getAttribute("name")+"']":"[@property='"+i.getAttribute("property")+"']",(d=i.getAttributeNode("content"))&&""!==d.value&&a(d,s,c,u),!1;if("OPTION"===g)return i.hasAttribute("label")&&(s+="[@label]",(d=i.getAttributeNode("label"))&&""!==d.value&&a(d,s,c,u)),!1;if("IMG"===g&&i.hasAttribute("alt")&&""!==i.getAttribute("alt")&&a(i.getAttributeNode("alt"),s+"[@alt]",c,u),"A"===g&&i.hasAttribute("title")&&""!==i.getAttribute("title")&&a(i.getAttributeNode("title"),s+"[@title]",c,u),("IMG"===g||"INPUT"===g&&"image"===i.getAttribute("type"))&&c)return!0;"INPUT"===g&&(i.hasAttribute("value")&&""!==i.getAttribute("value")&&i.hasAttribute("type")&&"text"!==i.getAttribute("type")&&"search"!==i.getAttribute("type")&&"password"!==i.getAttribute("type")&&"number"!==i.getAttribute("type")&&a(i.getAttributeNode("value"),s+"[@value]",c,u),i.hasAttribute("alt")&&""!==i.getAttribute("alt")&&a(i.getAttributeNode("alt"),s+"[@alt]",c,u),i.hasAttribute("data-confirm")&&""!==i.getAttribute("data-confirm")&&a(i.getAttributeNode("data-confirm"),s+"[@data-confirm]",c,u),i.hasAttribute("data-disable-with")&&""!==i.getAttribute("data-disable-with")&&a(i.getAttributeNode("data-disable-with"),s+"[@data-disable-with]",c,u)),"INPUT"!==g&&"TEXTAREA"!==g||i.hasAttribute("placeholder")&&""!==i.getAttribute("placeholder")&&a(i.getAttributeNode("placeholder"),s+"[@placeholder]",c,u),"IMG"!==g&&"SOURCE"!==g||i.hasAttribute("srcset")&&""!==i.getAttribute("srcset")&&(s=/picture/.test(s)?s.replace("picture/source","picture/img"):s,a(i.getAttributeNode("srcset"),s+"[@srcset]",c,u));var T,D=o.a.c("NodeContainer").create(i);if(("A"===g||"AREA"===g)&&function(t){var r,a="wovnLinkSrcHref"in t.dataset;if(a)r=t.dataset.wovnLinkSrcHref;else try{r=(r=new n.a(t.getAttribute("href"),location.origin).href).replace(new RegExp("/"+e+"(/|$)"),"$1")}catch(t){r=null}var i=r+"-lang="+e,s=o.a.c("Data").getLinkTranslations()[i];if(s)"disabled"===s?(t.href="javascript:void(0)",t.setAttribute("disabled","disabled")):(t.setAttribute("href",s),t.removeAttribute("disabled")),t.dataset.wovnLinkSrcHref=r;else if(a)t.setAttribute("href",r),t.removeAttribute("data-wovn-link-src-href"),t.removeAttribute("disabled");else{var c=o.a.c("Url").langUrl(e,t);c&&!o.a.c("Url").isLiveEditor()&&t.setAttribute("href",c)}}(i),o.a.c("Data").useFragmentedValue()&&function(t,e){return!!m(t)||!function(t,e){var r=function(t){var e=[];if(t.childNodes){for(var r=[],a=0;a<t.childNodes.length;a++)r.push(t.childNodes[a]);e=r.filter(function(t){var e=!0;return"#text"===t.nodeName.toLowerCase()&&o.a.c("Utils").normalizeText(t.nodeValue)&&(e=t),e})}return e}(t);return 0===r.length||!(1!==r.length||!m(r[0]))||!(1!==r.length||!v(r[0]))}(t)&&!function(t,e){return""===o.a.c("Utils").normalizeText(t.innerText||"",!0)}(t)&&!!v(t)}(i)&&!m(i)){var I=o.a.c("ValueStore").getDefaultComplexValue(i,s);if(I&&I.data){var C=o.a.c("ValueStore").getOriginalComplexData(i);(T=o.a.c("ValueStore").getByComplexValue(i,s,e))&&(f=!0,o.a.c("ValueStore").replaceComplexData(D,T.data)),O(C,s,!0,c)}}else if(function(t,e){return"#text"===t.nodeName&&""!==o.a.c("Utils").trimString(t.node.textContent)||!!t.isValueNode()||"IMG"===e||"META"===e||"FORM"===e||"OPTION"===e||"SOURCE"===e||!("INPUT"!==e||!t.node.src)}(D,g)){if(function(t){return/\/svg\/.*text\(\)/.test(t)&&!/\/text\/text\(\)$/.test(t)}(s))return!1;"INPUT"===g&&D.node.src&&(s+="[@image]");var U=o.a.c("ValueStore").getDefaultValue(D,s);if(!U)return!1;var V=U.data;if(!V)return!1;if(!A(V))return!1;(T=o.a.c("ValueStore").getByValue(D,s,e))||(T=U,"IMG"!==g&&o.a.c("ValueStore").noteMissedValueIfNeeded(V,e),t.hasOwnProperty(V)||(r=!0)),o.a.c("Node").disableIllegitimateNode(D),o.a.c("ValueStore").replaceData(D,T.data,e),o.a.c("Node").isLegitimateNode(D)&&O(U.data,s,!1,c)}if("INPUT"===g||"TEXTAREA"===g)return!1;var L=e!==b;return o.a.c("ValueStore").applyPropertySetting(i,e,L),f},h,function(){}),b=e,this.isSwappedMoreThanOnce=!0,o.a.c("PerformanceMonitor").mark("swap_end"),o.a.c("Data").dynamicLoading()&&o.a.c("ValueStore").loadNewDetectedValue()},this.createFilterCallback=function(t){var e=this.shouldIgnoreNode;return function(r,a){if(e(r,t||{}))return!0;var n=r.nodeName;return!!("SCRIPT"===n||"NOSCRIPT"===n||"STYLE"===n||function(t,e){return"IMG"===e&&/googlesyndication\.com/i.test(t.src)}(r,n)||function(t,e){return"META"===n&&!(/^(description)$/.test(t.getAttribute("name"))||w[t.getAttribute("property")]||x[t.getAttribute("property")])}(r)||function(t,e){return"OPTION"===n&&!t.hasAttribute("label")&&t.innerText.length<=0}(r)||function(t,e){if("INPUT"!==n)return!1;var r=t.getAttribute("type");return!(/^(button|submit)$/i.test(r)&&t.getAttribute("value")||/^(button|submit)$/i.test(r)&&t.getAttribute("data-confirm")||/^(button|submit|image)$/i.test(r)&&t.getAttribute("data-disable-with")||/^(email|text|search|password|number)$/i.test(r)&&t.getAttribute("placeholder")||/^image$/i.test(r)&&t.src)}(r)||function(t,e){return D=D||document.body,"goog-gt-tt"===t.id||function(t,e){for(var r=D.nextSibling;r;){if(r===t)return!0;r=r.nextSibling}return!1}(t)}(r)||"SOURCE"===n&&!/picture/.test(a))}},this.shouldIgnoreNode=function(t,e){return!("function"!=typeof t.getAttribute||null===t.getAttribute("wovn-ignore")&&!o.a.c("OnDemandTranslator").isOdtIgnoreNode(t))||!(!e.classes||!function(t,e){if(t.className&&"function"==typeof t.className.split)for(var r=0;r<e.length;r++)if(t.className.split(" ").indexOf(e[r])>-1)return!0;return!1}(t,e.classes))||!!function(t,e){if(!e||!e.length)return!1;for(var r=0;r<e.length;r++){var a=e[r];try{if(document.querySelector(a)==t)return!0}catch(t){}}return!1}(t,e.selectors)};var D=document.body;function I(){for(var a in e)e.hasOwnProperty(a)&&(t.hasOwnProperty(a)&&!/meta/.test(t[a].xpath)||(t[a]=e[a]));e={},r=!1}function C(){(function(){var t=o.a.c("Lang").getDefaultCodeIfExists();if(!t)return!1;var e=o.a.c("Lang").getDocLang();return!(!e||o.a.tag.getAttribute("debugMode")||o.a.c("Config").backend()&&e!==t)})()&&(++f,clearTimeout(d),I(),d=setTimeout(function(){f=0,function(){if(!(location.hash.match(/wovn.haltReporting/)||o.a.c("Url").isLiveEditor()||p)){++g,I();var e=[];for(var r in t)t.hasOwnProperty(r)&&e.push(t[r]);!function(e,r,a,n){if(0!==t.length){if(!o.a.c("Utils").isValidURI(location.href))return null;var i=new XMLHttpRequest,s=o.a.c("Url").getApiHost();i.open("POST",s+e,!0),i.onreadystatechange=function(){4==i.readyState&&200==i.status&&4===i.readyState&&200===i.status&&h++},i.setRequestHeader("Content-Type","application/x-www-form-urlencoded");var c="",u=o.a.c("Utils").toJSON(r,null,4);if(c+="url="+o.a.c("Url").getEncodedLocation()+"&no_record_vals="+encodeURIComponent(u),o.a.c("Data").useFuzzyMatch()){var l=o.a.c("Utils").toJSON(o.a.c("FuzzyMatch").getServerFormattedFuzzyMatches());c+="&fuzzy_match="+encodeURIComponent(l)}o.a.c("PageChecker").isSupervisedPage()&&(c+="&supervised_detected"),1===g&&o.a.c("ValueStore").corruptedVals&&o.a.c("ValueStore").corruptedVals.length>0&&(c+="&corruptedVals="+encodeURIComponent(JSON.stringify(o.a.c("ValueStore").corruptedVals,null,4))),!0===m&&(c+="&high_priority"),i.send(c)}}("report_values/"+o.a.tag.getAttribute("key"),e)}}()},a))}function U(t,a){var n=o.a.c("Lang").getDefaultCodeIfExists();if(n){location.hash.match(/wovn.debugAudit/)&&console.log("AUDIT");var i=o.a.c("Lang").getDocLang()||n;o.a.c("Lang").shouldSwapVals(n,i)&&o.a.c("DomAuditor").supervisedSwapVals(i,null,a||!0),(document.documentElement.className.match("translated")||V()||function(){for(var t=document.getElementsByClassName("view-in-ga-link-logo"),e=0;e<t.length;e++){var r=t[e];if(/chrome-extension:\/\/.+analytics_logo\.png/.test(getComputedStyle(r)["background-image"]))return!0}return!1}())&&l.removeNewSrcs(),!v&&(!l.needsUVMigrationReportForUnreportableDomain()&&!o.a.c("Data").dynamicValues()||!function(){if(void 0===y){var t=o.a.c("Data").reportLotRatio();y=t>Math.random()}return y}()||g>=10||f>=10||!function(){for(var t in e)if(e.hasOwnProperty(t))return!0;return!1}()||!r)||(C(),v=!1),t&&setTimeout(t,0)}}function V(t){var e=o.a.c("Interface").getWidgetElement(),r=e&&e.getAttribute("data-theme");if(r&&"built-in"===r)return!1;if((t=t||e&&e.querySelectorAll(".wovn-switch"))&&t.length>0)for(var a=0;a<t.length;a++){var n=t[a].getAttribute("data-value"),i=n&&o.a.c("Lang").get(n),s=i&&i.name;if(s&&s!==t[a].innerHTML)return!0}return!1}this.reportCount=function(){return g},this.reportSuccessCount=function(){return h},this.resetReportCount=function(){g=0,clearTimeout(d)},this.needsUVMigrationReportForUnreportableDomain=function(){return!o.a.c("Data").dynamicValues()&&o.a.c("Data").useUnifiedValuesMigrating()},this.audit=U,this.isLanguageTranslated=V,this.removeNewSrcs=function(){for(var a in e)t.hasOwnProperty(a)&&delete t[a];e={},r=!1},this.stop=function(){N(),o.a.c("AuditTrigger").stop()},this.destroy=function(){l.stop()},this.mustEnsureOneReport=function(){return!!o.a.c("Data").hasFastReportNewPagesFeature()&&(o.a.c("Lang").missingAutoTranslateLangs()||o.a.c("Lang").missingAutoPublishLangs())},o.a.c("Url").isIframeLiveEditor()||(p=o.a.c("Agent").mutatesTextNodeData(),!0===(m=this.mustEnsureOneReport())&&(a=1e3),v=!!(o.a.c("Lang").missingAutoTranslateLangs()||o.a.c("Lang").missingAutoPublishLangs()||o.a.c("ValueStore").corruptedVals&&o.a.c("ValueStore").corruptedVals.length>0&&Math.random()<.1||location.hash.match(/wovn.forceReporting/)))},document.WOVNIO.components.SwapIntercom=function(){var t={subscribe:"WOVNIO_SWAP_INTERCOM_SUBSCRIBE",unsubscribe:"WOVNIO_SWAP_INTERCOM_UNSUBSCRIBE",acknowledge:"WOVNIO_SWAP_INTERCOM_ACKNOWLEDGE",swap:"WOVNIO_SWAP_INTERCOM_SWAP"},e=null;this.start=function(){o.a.c("Utils").pageIsWidgetPreview()||(e=this.isMasterIntercom()?this.createParentNode():this.createChildNode()).start()},this.stop=function(){e.stop()},this.isMasterIntercom=function(){return window.self===window.top},this.createParentNode=function(){return new function(){var e=[];function r(r){switch(r.data){case t.subscribe:var n=r.source;(function(r){return!o.a.c("Utils").includes(e,r)&&(e.push(r),r.postMessage(t.acknowledge,"*"),!0)})(n)&&a(n,o.a.c("Lang").getDocLang());break;case t.unsubscribe:!function(t){var r=o.a.c("Utils").indexOf(e,t);r>=0&&e.splice(r,1)}(r.source)}}function a(e,r){e&&e.postMessage(t.swap+":"+r,"*")}function n(){for(var t=o.a.c("Lang").getDocLang(),r=0;r<e.length;++r)a(e[r],t)}this.start=function(){o.a.c("Utils").onEvent(window.self,"message",r),o.a.c("Utils").addEventListener("wovnLangChanged",n)},this.stop=function(){o.a.c("Utils").removeHandler(window.self,"message",r),document.removeEventListener("wovnLangChanged",n)}}},this.createChildNode=function(){return new function(){var e=window.top,r=null,a=0;function n(e){if("string"==typeof e.data){var a=e.data.split(":");switch(a[0]){case t.acknowledge:clearTimeout(r),o.a.c("Interface").destroy();break;case t.swap:var n=a[1];o.a.c("Lang").setDocLang(n)}}}function i(){e&&(a+=1,e.postMessage(t.subscribe,"*"),r=setTimeout(i,1e3*a))}function s(){clearTimeout(r),e.postMessage(t.unsubscribe,"*")}this.start=function(){o.a.c("Utils").onEvent(window.self,"message",n),o.a.c("Utils").onEvent(window.self,"beforeunload",s),a=0,i()},this.stop=function(){o.a.c("Utils").removeHandler(window.self,"message",n),o.a.c("Utils").removeHandler(window.self,"beforeunload",s),s()}}}},document.WOVNIO.components.UnifiedValue=function(){var t={},e=!0,r=[],a={"og:description":!0,"twitter:description":!0,"og:title":!0,"twitter:title":!0},i={"og:image":!0,"og:image:url":!0,"og:image:secure_url":!0,"twitter:image":!0};this.clearCache=function(){t={}},this.refreshTranslation=function(){var t=o.a.c("Lang").getDefaultCodeIfExists();t&&I(0,o.a.c("TranslationDataBridge").loadFromStore())};var s=["placeholder"],c={search:["value","placeholder"],button:["value","placeholder","data-confirm","data-disable-with"],submit:["value","placeholder","data-confirm","data-disable-with"],image:["src","alt","placeholder","data-confirm"]};function u(t){var e=t.getAttribute("type"),r=s;return e&&(e=e.toLowerCase())in c&&(r=c[e]),r}this.inputAttrs=u,this.traversal=function(t,e,r){var a=[],n=[],i={nodeName:"",hasAttribute:_},s=o.a.c("ValuesStackBridge").create("",1),c=[];return T(s=function t(e,r,a,n,i,s,c,u,l){if(function(t){return"wovn-translate-widget"===t.id||"wovn-languages"===t.id}(e))return i;if(o.a.c("DomAuditor").shouldIgnoreNode(e,l))return i;for(var d=!!o.a.c("LiveEditor"),f=!!o.a.c("LiveEditorDecorator"),g=e.nodeName.toLowerCase(),h=H[g]||{},p=r.length,m={},v=0;v<p;++v){var b=r[v];o.a.c("OnDemandTranslator").bindOdtClickEvent(b);var y=b.nodeName.toLowerCase(),w=null;if(m.hasOwnProperty(y)){var S=m[y]+1;w=a+"/"+y+"["+S+"]",m[y]=S}else w=a+"/"+y,m[y]=1;if(!(h[y]||(d||f)&&/wovn-span-wrapper/.test(b.className)))switch(q[y]){case B:break;case $:c.push(o.a.c("TagElementBridge").create(w,b));break;case z:c.push(o.a.c("TagElementBridge").create(w,b)),i.add(x(b,y,l)),i=t(b,b.childNodes,w,n,i,s,c,u,l),K[y]||i.add(N("</"+y+">",b,!1,!0,!1));break;case W:if(0==L(b.data).length)break;var O=F(r,v+1,[b]);if(v+=O.skipCount,O.nodes.length>0){u.push(O.nodes),O.node=b,O.label=O.text.length>0?s(O.text):O.text;var D=O.text.length>0?s(O.text):O.text;O.isText=!0,i.add(A(D,b,O.text,O.original,O.nodes,O.lookahead,O.skipCount))}break;default:c.push(o.a.c("TagElementBridge").create(w,b)),T(i)&&n.push(i);var I=i.buildNextStack();i=o.a.c("ValuesStackBridge").create(w,1),T(i=t(b,b.childNodes,w,n,i,s,c,u,l))&&n.push(i),i=I}}if("iframe"==g)try{var C=e.contentDocument;if(C)return t(b=C.firstChild,b.childNodes,w,n,i,s,c,u,l)}catch(t){}return i}(i,[t],"",c,s,e,a,n,r||{}))&&c.push(s),{tags:a,texts:n,valuesStacks:c}};var l=this;function d(r,a,n){var i=o.a.c("Url"),s=o.a.c("Data"),c=o.a.c("Config"),l=o.a.c("Utils"),d=o.a.c("Parser"),f=o.a.c("ValueStore"),g=o.a.c("UrlFormatter"),h=o.a.c("TranslationDataBridge"),p=i.isLiveEditor(),m=i.getUrl.bind(i),v=i.langUrl.bind(i),b=i.shouldIgnoreLink.bind(i),w=f.getSrcValuesFromSrcsetAttribute.bind(f),x=c.urlPattern("query"),N=c.backend(),A=l.normalizeText.bind(l),S=g.createFromUrl.bind(g),T=d.getUrlsFromCss.bind(d);if((r||a)&&(e=!(!a||(r?r===a&&r===n:a===n)),D()||I(0,h.loadFromStore()),D())){var O=t.text,C=t.image;return{defaultLangCode:n,fromLangCode:r,toLangCode:a,normalizeText:A,createFromUrl:S,getUrlsFromCss:T,fromTextDict:O[r]||{},fromImageDict:C[r]||{},textDict:O[a]||{},imageDict:C[a]||{},originalImageSets:t.originalImageSets,tags:{a:p?_:P(v,a),area:p?_:P(v,a),form:function(t,e,r,a,n){return function(i,o){var s=o.getAttribute("method");if(!t||s&&"GET"!==s.toUpperCase()){if(e){var c=o.getAttribute("action"),u=c&&0!==c.length?c:location.href;if(!r(u)){var l=a(n,u);o.setAttribute("action",l)}}}else{for(var d=o.element.children,f=d.length-1;f>=0;f--){var g=d[f];if("INPUT"===g.tagName&&"wovn"===g.getAttribute("name")&&"hidden"===g.getAttribute("type"))return void g.setAttribute("value",n)}var h=document.createElement("input");h.setAttribute("type","hidden"),h.setAttribute("name","wovn"),h.setAttribute("value",n),o.element.appendChild(h)}}}(x,N,b,m,a),img:k(w),source:k(w)},attrs:s.useAriaLabel()?["aria-label"]:[],tagAttrs:{option:["label"],a:["title"],optgroup:["label"],img:["alt","srcset","src"],textarea:["alt","placeholder"],source:["srcset"]},tagAttrsCondition:{meta:y,input:u}}}}function f(t,e,r){var a,n;return"src"===e?(a=(n=t.getAttribute("src"))?t.element.src:"","path"!==o.a.tag.getAttribute("urlPattern")||/^(https?:\/\/|\/)/.test(n)||(a=o.a.c("Url").getUrl(r,a,!0))):a=t.getAttribute(e),a}function g(t,e){return!e&&t.match(/^\s*$/)?t:U(e)||"​"}this.swapUnifiedValue=function(e,a,n){var s=o.a.c("Lang").getDefaultCodeIfExists();if(s){var c=d(a,n,s);if(c){a===n&&(a=s);var u=o.a.c("Data").getIgnoredPatterns(),h=this.traversal(e,c.normalizeText,u);void 0!==a&&a!=c.defaultLangCode||(h.tags.forEach(function(t,e){for(var r=w(t,e),a=0;a<r.length;++a){var n=p(t,e,r[a]);!n.hasOriginal&&n.current&&e.setAttribute(n.attr,n.current)}var i=window.getComputedStyle(e.element).getPropertyValue("background-image");if(i&&"none"!==i){var o=E("background-image");e.hasAttribute(o)||m(i,t)&&e.setAttribute(o,i)}}.bind(null,c)),h.texts.forEach(function(t,e){var r=e[0];"TITLE"!=r.nodeName?v(r,e.reduce(function(t,e){return t+e.data},"")):t.cache.title=t.cache.title||r.data}.bind(null,c)),h.valuesStacks.forEach(function(t){var e=t.path,r=t.src;c.textDict.hasOwnProperty(r)||(o.a.c("DomAuditor").markHasNewMissedSrcIfFirstSeen(r),o.a.c("ValueStore").noteMissedValueIfNeeded(r,n)),O(r,e,t.isComplex(),!1,!0)}),h.tags.forEach(function(t){w(c,t).forEach(function(e){var r=f(t,e,c.defaultLangCode);if(r){var a,n=t.nodeName.toLowerCase(),s="img"==n&&"src"==e||"input"==n&&"src"==e,u=i[t.getAttribute("property")],l=!1;if(s||u){a=t.xpath,u&&(a+="[@image]");var d=c.createFromUrl(r);d.setShowFullUrl();var g=d.getOriginalUrl();l=c.imageDict.hasOwnProperty(g),r=g}else a=t.xpath+"[@"+e+"]",l=c.textDict.hasOwnProperty(g);l||o.a.c("DomAuditor").markHasNewMissedSrcIfFirstSeen(r),O(r,a,!1,!1,!1)}})})),h.tags.forEach(function(t,e){var r=t.tags[e.nodeName.toLowerCase()];r&&r(t,e);for(var a=w(t,e),n=0;n<a.length;++n){var i=a[n],o=p(t,e,i);o.hasOriginal&&!o.changed&&e.setAttribute(i,o.original)}var s=E("background-image"),c=e.getAttribute(s);c&&m(c,t)&&(e.element.style.backgroundImage=c)}.bind(null,c)),h.texts.forEach(function(t,e){var r=e[0];if("TITLE"!=r.nodeName){var a=b(r);if(a&&"#comment"===a.nodeName){var n=a.data;if(0===n.indexOf(R)){r.data=g(r.data,function(t){if(t){var e=t.indexOf(j);return-1==e?t.substring(R.length):t.substring(R.length,e)}return null}(n));for(var i=1;i<e.length;++i)e[i].data=""}}}else r.data=t.cache.title}.bind(null,c));var y=d(c.defaultLangCode,n,s);if(y){var x=this.traversal(e,y.normalizeText,u);if(x.tags.forEach(function(t){var e=n!==a;o.a.c("ValueStore").applyPropertySetting(t.element,n,e)}),n!==c.defaultLangCode){if(o.a.c("Data").useFuzzyMatch()){var N=o.a.c("FuzzyMatch").fuzzyMatch(M(c),n);o.a.c("Utils").assign(y.textDict,function(t,e){var r={};return t.forEach(function(t){if(e[t.existSrc]){var a=U(e[t.existSrc].src);document.createElement("html"),r[t.similarSrc]=widget.c("UnifiedValue").getValueByHtml(a)}}),r}(N,M(c)))}x.tags.forEach(function(t,e){var r=e.nodeName.toLowerCase(),a=t.tags[r];a&&a(t,e);for(var n=w(t,e),i=0;i<n.length;++i){var o=n[i],s=f(e,o,t.defaultLangCode);if(s){var c=t.normalizeText(s);if("img"==r&&"src"==o||"input"==r&&"src"==o){var u=t.createFromUrl(c);u.setShowFullUrl();var l=u.getOriginalUrl(),d=t.imageDict[l];if(!d||!d.dst)continue;e.setAttribute(o,d.dst)}else{var g=t.textDict[c];if(!g)continue;var h=V(g);e.setAttribute(o,h)}}}var p=function(t,e){var r=window.getComputedStyle(e.element).getPropertyValue("background-image");return r?t.getUrlsFromCss(r):[]}(t,e);if(p.length>0){var m=p.map(function(e){var r=t.imageDict[e];return r&&r.dst||e});m.toString()!==p.toString()&&(e.element.style.backgroundImage=m.map(function(t){return"url("+t+")"}).join(", "))}}.bind(null,y)),x.valuesStacks.forEach(function(t,e){var a=e.src,n=t.textDict[a];n?(function(t,e){var r=l.extractTextNodes(t),a=l.extractTextNodes(e);if(r.length===a.length)for(var n=t.fragments[0].node.parentNode,i=0;i<r.length;++i){var o=r[i],s=a[i];if(o.isText){o.lookahead.forEach(function(t){t.nodeValue=""});var c=s.isText?s.label:"​";o.node.nodeValue=s?g(o.original,c):"​"}else if(s.isText){var u=document.createTextNode(s.label);o.isOpen||o.isSentinel?(o.node?o.node.parentElement:n).insertBefore(u,o.node):o.isClose&&o.node.appendChild(u),v(u,"")}}}(e,n),r.push(e.src)):function(t,e){t.fragments.forEach(function(t){if(t.isText){var r=t.escapedSrc,a=e.textDict[r];if(a&&0!==a.fragments.length){var n=a.fragments[0].label;n&&(t.node.nodeValue=g(t.original,n))}}}),r.push(t.src)}(e,t)}.bind(null,y))}o.a.c("Constant").IS_DEV&&(window.debug_uv={param:c,all:h,cache:t})}}}},this.findDstFragments=function(t,e,r){var a=d(e,r,o.a.c("Lang").getDefaultCodeIfExists()),n=t,i=null;return a.textDict&&a.textDict[t.src]&&(i=(n=a.textDict[t.src]).created_at,n.fragments.length!==t.fragments.length&&(n=this.addEmptyTextNodes(n))),{createdAt:i,fragments:n.fragments}},this.migrateReportedValueWithFragmentValue=function(t,e){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:document.head.parentNode,a=o.a.c("Lang").getDefaultCodeIfExists();if(a){var n=d(t,e,a);if(n){var i=o.a.c("DomAuditor").needsUVMigrationReportForUnreportableDomain();if(t==n.defaultLangCode){var s=o.a.c("Data").getIgnoredPatterns(),c=this.traversal(r,n.normalizeText,s),u=o.a.c("Data").getTextValues(),f=o.a.c("Data").getPublishedLangs();c.valuesStacks.forEach(function(t){var e=t.path,r=t.src;if(1!==t.fragments.length||t.src!==t.lastFragment.text){var a=l.createDsts(t,f,u);i&&0===Object.keys(a).length||(o.a.c("DomAuditor").markHasNewMissedSrcIfFirstSeen(r),O(r,e,t.isComplex(),!1,!0,a,!0))}})}}}},this.createDsts=function(t,e,r){var a={};return e.forEach(function(e){var n="",i=!1;t.fragments.forEach(function(t){if(t.isText){var a=r[t.label],o="";a&&a[e]?(i=!0,o=a[e][0].data):o=t.src,n+=t.original.replace(/^(\s*)[\s\S]*?(\s*)$/,function(t,e,r){return e+(o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")||"​")+r})}else n+=t.label}),i&&(a[e]=n)}),a};var h={isSentinel:!0};function p(t,e,r){var a=E(r),n=e.getAttribute(a),i=e.getAttribute(r),s=e.hasAttribute(a),c=t.fromTextDict[n],u=!1;if(!c&&n&&"IMG"==e.element.nodeName){if("src"==r){var l=function(t,e){var r=t.createFromUrl(e);return r.setShowFullUrl(),r.getOriginalUrl()}(t,n),d=t.fromImageDict[l];c=d?d.dst:null}else if("srcset"==r){var f=o.a.c("ValueStore").getSrcValuesFromSrcsetAttribute(n);for(var g in c=n,f)if(f.hasOwnProperty(g)){var h=t.fromImageDict[g];if(h&&h.dst){var p=f[g];c=c.replace(p,h.dst)}}}u=s&&c!==i}else u=s&&c&&c.fragments[0]&&c.fragments[0].label!==i;return{attr:a,hasOriginal:s,changed:u,current:i,original:n}}function m(t,e){var r=e.getUrlsFromCss(t);if(!r||0===r.length)return!1;for(var a=0;a<r.length;a++)if(e.originalImageSets[r[a]])return!0;return!1}function v(t,r){if(e){var a,n=b(t);if(!n||"#comment"!==n.nodeName||0!==(a=n.data).indexOf(R)){var i=t.parentElement||t.parentNode;i&&(a=document.createComment(R+r),"TITLE"===i.nodeName?i.parentNode.insertBefore(a,i):i.insertBefore(a,t))}}}function b(t,e){var r=t.parentElement||t.parentNode;if(r&&"TITLE"===r.nodeName)return r.previousSibling;var a=t.previousSibling;return a?"#text"==a.nodeName?b(a,t):a:e}function y(t){var e=t.getAttribute("name"),r=t.getAttribute("property");return"description"==e||a[r]||i[r]?["content"]:[]}function w(t,e){var r=e.nodeName.toLowerCase(),a=[];function n(t){a.push(t)}return t.attrs.forEach(n),(t.tagAttrs[r]||[]).forEach(n),((t.tagAttrsCondition[r]||_)(e)||[]).forEach(n),a}function x(t,e,r){var a=o.a.c("DomAuditor").shouldIgnoreNode(t,r);return N(a?"<"+e+" wovn-ignore>":"<"+e+">",t,!0,!1,a)}function N(t,e,r,a,n){return o.a.c("UnifiedValueTagFragmentBridge").create(t,e,r,a,n)}function A(t,e,r,a,n,i,s){return o.a.c("UnifiedValueTextFragmentBridge").create(t,e,r,a,n,i,s)}function S(t){return o.a.c("UnifiedValueTextFragmentBridge").create(t,null,t,t,null,null,0)}function T(t){return t.hasText()}function O(t,e,r,a,n,i,s){o.a.c("Utils").isEmpty(o.a.c("Utils").normalizeText(t))||o.a.c("DomAuditor").addSrc(t,e,r,a,n,i,s)}function D(){return!(!t.text||!t.image)}function I(e,r){var a=C(0,r.textVals,function(t,e,r,a){var n=o.a.c("ValuesStackBridge").create("",1);n.add(A(r)),n.created_at=a,t[e]=n}),n=C(0,r.htmlTextVals,function(t,e,r,a){var n=l.getValueByHtml(r);n.created_at=a,t[e]=n});t.text=function(){for(var t={},e=0;e<arguments.length;++e){var r=arguments[e];for(var a in r)if(r.hasOwnProperty(a))for(var n in t[a]||(t[a]={}),r[a])r[a].hasOwnProperty(n)&&(t[a][n]=r[a][n])}return t}(a,n);var i=r.calcImgValsForIndex();for(var s in t.image=C(0,i,function(t,e,r,a){t[e]={dst:r,created_at:a}}),t.originalImageSets={},i)i.hasOwnProperty(s)&&(t.originalImageSets[s]=!0)}function C(t,e,r){var a={};for(var n in e){var i=e[n];for(var o in i)r(a[o]=a[o]||{},n,i[o][0].data||"",i[o][0].created_at)}return a}function U(t){return t.replace("&lt;","<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,"&")}function V(t){return t.fragments.filter(function(t){return t.isText}).map(function(t){return t.label}).join("")}function L(t){return o.a.c("Utils").normalizeTextWithoutZeroWidthSpace(t)}function E(t){return"data-"+R+"-original-"+t}function P(t,e){return function(r,a){var i,s=a.element;if(!o.a.c("DomAuditor").shouldIgnoreNode(a.element,o.a.c("Data").getIgnoredPatterns())){var c=t(e,a.element),u="wovnLinkSrcHref"in s.dataset;if(u)i=s.dataset.wovnLinkSrcHref;else try{i=(i=new n.a(s.getAttribute("href"),location.origin).href).replace(new RegExp("/"+e+"(/|$)"),"$1")}catch(t){i=null}var l=i+"-lang="+e,d=o.a.c("Data").getLinkTranslations()[l];d?("disabled"===d?(s.href="javascript:void(0)",s.setAttribute("disabled","disabled")):(s.setAttribute("href",d),s.removeAttribute("disabled")),s.dataset.wovnLinkSrcHref=i):u?(s.setAttribute("href",i),s.removeAttribute("data-wovn-link-src-href"),s.removeAttribute("disabled")):c&&a.setAttribute("href",c)}}}function k(t){return function(e,r){var a=r.getAttribute("srcset");if(a){var n=t(a),i=a;for(var o in n){var s=e.imageDict[o];if(s&&s.dst){var c=n[o];i=i.replace(c,s.dst)}}a!==i&&r.setAttribute("srcset",i)}}}function _(){}function F(t,e,r){for(var a=[],n=0,i=e;i<t.length;++i){var o=t[i],s=o.nodeName.toLowerCase();if("#text"==s)a.push(o),++n;else{if("#comment"!=s)break;if(0===o.data.indexOf(R)){++n;break}++n}}var c=r.concat(a),u=c.reduce(function(t,e){return t+e.data},"");return{text:u.trim(),original:u,nodes:c,lookahead:a,skipCount:n}}function M(t){var e={};return Object.keys(t.textDict).map(function(a){a&&r&&!o.a.c("Utils").includes(r,a)&&(e[a]=t.textDict[a])}),e}this.extractTextNodes=function(t){if(0==t.fragments.length)return[];for(var e=[],r=0;r<t.fragments.length;++r){var a=t.fragments[r];e.push(a),a.isText&&++r}return t.lastFragment.isText||e.push(h),e},this.addEmptyTextNodes=function(t,e){var r=t.fragments;if(r.length>0)for(var a=r.length-1;a>=-1;--a){var n=-1===a?null:r[a],i=!n||!n.isText,o=a===r.length-1?null:r[a+1],s=!o||!o.isText;if(i&&s){var c=e?document.createTextNode(""):null;e&&(o?o.node.parentElement.insertBefore(c,o.node):n.node.parentElement.appendChild(c)),t.fragments.splice(a+1,0,A("",c,"","",[c],[],0))}}return t},this.getValueByHtml=function(t){var e=o.a.c("ValuesStackBridge").create("",1),r=t.split(/(<.+?>)/);if(1==r.length&&""==r[0])return e.add(S(r[0])),e;for(var a=0;a<r.length;++a){var n=r[a];if(""!=n)if("<"==n[0]){var i=n.toLowerCase();"/"==n[1]?e.add(N(i,null,!1,!0,!1)):e.add(N(i,null,!0,!1,-1!==i.indexOf("wovn-ignore")))}else e.add(S(n))}return e};for(var R="wovn-src:",B=1,z=2,W=3,$=4,j=",wovn-actual-lang:",H={symbol:{title:!0,desc:!0}},q={"#comment":B,"#text":W},G=o.a.c("RailsBridge").unifiedValues.skipElements,J=0;J<G.length;J++)q[G[J]]=B;for(var Z=o.a.c("RailsBridge").unifiedValues.skipElementsWithoutAttributes,X=0;X<Z.length;X++)q[Z[X]]=$;for(var Y=o.a.c("RailsBridge").unifiedValues.emptyElements,K={},Q=0;Q<Y.length;Q++)K[Y[Q]]=1,q[Y[Q]]=z;for(var tt=o.a.c("RailsBridge").unifiedValues.inlineElements,et=0;et<tt.length;et++)q[tt[et]]=z},document.WOVNIO.components.ValueStore=function(t){var e=this,r=t.c("Data").getPublishedLangs(),a=t.c("Lang").getDefaultCodeIfExists();if(t.isComponentLoaded("LiveEditorDecorator")&&(a=t.c("LiveEditorDecorator").get_dummy_lang_code()),a){var n=t.c("Data").getTranslationData(),i=t.c("TranslationDataBridge").loadFromStore();i.update(n),i.storeToStorage();var o={},s={},c={};o[a]=i.textVals,s[a]=i.calcImgValsForIndex(),c[a]=i.htmlTextVals;var l=t.c("Data").get().prop_vals||{},d=[],f=[a],g="http://st.wovn.io/ImageValue/"+t.c("Data").getPageId()+"/",h=[],p={},m="wovn-src:",v=",wovn-actual-lang:",b="data-wovn-original-background";this.srcsetOriginalValueStore={},this.propertyIndexTags=function(){return d},this.imgSrcPrefix=function(){return g},this._nodeToSrc=function(r,a,n){var i="",o=r.nodeName.toLowerCase();if("#text"==o)return t.c("Utils").normalizeText(r.data.replace("<","&lt;").replace(">","&gt;"),!0);if("br"==o||"img"==o)return"<"+o+">";var s="",c=x(r);if(a||!1===c)for(var u=r.childNodes,l=0;l<u.length;l++)s+=t.c("Utils").normalizeText(e._nodeToSrc(u[l],a,!0),!0);return i=n?c?"<"+o+" wovn-ignore>"+s+"</"+o+">":"<"+o+">"+s+"</"+o+">":s,t.c("Utils").normalizeText(i,!0)},this.getDstImage=function(t,e){if(!t)return null;var r=T(t,s[a]);return r&&r[e]?r[e][0].data:void 0},this.addPropertyIndexTag=function(t,e){l[t]=l[t]||[],l[t][e]||(l[t][e]=[],S())},N(),S(),O(),this.getTextIndex=function(){return o},this.getImgIndex=function(){return s},this.getHtmlTextIndex=function(){return c},this.corruptedVals=h,this.isCorrupted=function(t){return I(t)},this.addValues=function(e){e=e||[];for(var r=0;r<e.length;r++)if(!I(e[r])){var n,i,u;/img(\[[^\]]*\])?$/.test(e[r].xpath)||e[r].src_img_path||/\[@background-image\]$/.test(e[r].xpath)?(n=s[a],i=e[r].src||e[r].src_img_path,(u=e[r].dst||e[r].img_path)!==i&&(u=g+u)):(n=!0===e[r].complex?c[a]:o[a],i=t.c("Utils").trimString(e[r].hasOwnProperty("src")?e[r].src:e[r].src_body),u=t.c("Utils").trimString(e[r].hasOwnProperty("dst")?e[r].dst:e[r].body)||"​");var l=e[r].language;t.c("Utils").pushUnique(f,l),n.hasOwnProperty(i)||(n[i]={},n[i][a]=[]),n[i][a].push({xpath:(e[r].xpath||"").replace(/\[1\]/g,""),data:i}),l&&(n[i].hasOwnProperty(l)||(n[i][l]=[]),n[i][l].push({xpath:(e[r].xpath||"").replace(/\[1\]/g,""),data:u}))}t.c("Agent").mutatesTextNodeData()&&O()},this.noteMissedValueIfNeeded=function(e,r){var a=t.c("Lang").getDefaultCodeIfExists();a&&r!==a&&t.c("ValueStore").noteMissedValue(e)},this.noteMissedValue=function(t){p.hasOwnProperty(t)||(p[t]=!1)},this.loadNewDetectedValue=function(){var e=[];for(var r in p)if(p.hasOwnProperty(r)&&!p[r]&&(p[r]=!0,e.push(r),e.length>=100))break;0!==e.length&&t.loadTranslation(e,function(e){t.c("Data").useUnifiedValue()?(t.c("ValueStore").mergeValues({},e.img_vals,e.text_vals),t.c("UnifiedValue").refreshTranslation()):t.c("ValueStore").mergeValues(e.text_vals,e.img_vals)},function(){})},this.mergeValues=function(e,r,n){var i=t.c("TranslationDataBridge").loadFromStore(),c=t.c("TranslationDataBridge").create((new Date).getTime(),e,r,n);i.update(c),i.storeToStorage();for(var u=[],l=c.calcImgValsForIndex(),d=[[e,o],[l,s]],f=0;f<d.length;f++){var g=d[f][0],h=d[f][1];for(var p in g)if(g.hasOwnProperty(p)){var m=g[p];h[a][p]=m;for(var v=Object.keys(m),b=0;b<v.length;b++)t.c("Utils").pushUnique(u,v[b])}}N();for(var y=0;y<u.length;y++)C(u[y])},this.srcExists=function(e,r){o[r]||C(r);var a=t.c("NodeContainer").create(e),n=this.getData(a);return""===n||j(a,r).hasOwnProperty(n)},this.replaceAllPropertyIndex=function(t,e){(l={})[t]=e,S(t)},this.applyPropertySetting=function(r,a,n){n&&F(r);var i=e.getProperty(t.c("NodeContainer").create(r),a);i&&_(i.dst,r,null)},this.getProperty=function(t,e){if(!l[e]||!l[e][t.nodeName])return null;for(var r=[],a=0;a<l[e][t.nodeName].length;a++){var n=l[e][t.nodeName][a];P(n,t.node)&&r.push(n)}return function(t,e){for(var r=-1,a=null,n=0;n<t.length;n++){var i=t[n],o=k(i.dst.selectors,e);o>0&&r<=o&&(a=i,r=o)}return a||null}(r,t.node)},this.getSrcChildTextContent=function(r){for(var a="",n=function(t){return e.getChildNodesOverrideFunc?e.getChildNodesOverrideFunc(t):t.childNodes}(r),i=0;i<n.length;i++){var o=t.c("NodeContainer").create(n[i]);if("#text"===o.nodeName){var s=t.c("ValueStore").getDefaultValue(o,"");s&&s.data&&(a+=t.c("Utils").normalizeText(s.data))}}return a},this.setProperty=function(t,r){_(t,r,e.getOriginalProperties(r))},this.getOriginalProperties=function(e){if(e.getAttribute){var r=e.getAttribute("data-wovn-original-property");if(r)return t.c("Utils").parseJSON(r)}return null},this.getParentElementOverrideFunc=void 0,this.getChildNodesOverrideFunc=void 0,this.getByValue=function(r,n,i){var o=r.node,s=this.getData(r),c=o.actualLang||t.c("Lang").getActualLang();if(!c)return null;if(!t.c("Agent").canStoreObjectInNode()&&/text/i.test(r.nodeName))return function(e,r,n,i){var o=r.node,s=t.c("Lang").getActualLang(),c=function(t){var e=z(t.node);if(e){var r=e.data.indexOf(v);return-1===r?null:e.data.substring(r+v.length)}return null}(r)||s;if(c&&s){C(c);var u=j(r,c),l=W(r,u);if(l||!t.c("Utils").isEmpty(e)){var d=t.c("Lang").getDefaultCodeIfExists();if(d&&(l||i!==d)){if(!l||!1===function(e,r,a,n,i){var o=a[e]&&E(L(a[e],i),n);return o&&t.c("Utils").normalizeText(o.data)===t.c("Utils").normalizeText(r)}(s,e,l,r,n)){if(!(l=B(r,u,e)))return;!function(t,e,r){var n=z(t),i=m+e[a][0].data+v+r;if(n)n.data=i;else{var o=document.createComment(i);(t=$(t)).parentNode&&t.parentNode.insertBefore(o,t)}}(o,l,i)}return E(L(l[i]||[],n),r)}}}}(s,r,n,i);var l=o.wovnTranslation;if(!l||"object"!==u(l)){var d=t.c("Lang").getDefaultCodeIfExists();if(!d)return null;if(i===d&&!function(e){return!(0!=t.c("DomAuditor").isSwappedMoreThanOnce||!t.c("Config").backend())&&t.c("Lang").getActualLang()!==t.c("Lang").getDefaultCodeIfExists()&&null!==z(e)}(o))return null;C(c);var f=j(r,c),g=function(e,r,a){if(0==t.c("DomAuditor").isSwappedMoreThanOnce&&t.c("Config").backend()){var n=W(e,r);if(n)return n}return B(e,r,a)}(r,f,s);try{o.wovnTranslation=g}catch(t){var h=f[s]&&(f[s][i]||f[s][a]);return h||(h=[]),E(L(h,n),r)}if(null==g)return null}return e.validateCache(r,n,i),o.wovnTranslation?E(L(o.wovnTranslation[i]||[],n),r):null},this.translateTexts=function(t,e,r){U(o,t);for(var a=o[t]||{},n={},i=0;i<r.length;i++){var s=r[i];a[s]&&a[s][e]&&a[s][e][0]?n[s]=a[s][e][0].data:n[s]=null}return n},this.getCachedOriginalSrcsetAttribute=function(t){return(this.srcsetOriginalValueStore[t]||{})[t.value]},this.cacheOriginalSrcsetAttribute=function(t,e){this.srcsetOriginalValueStore.hasOwnProperty(t)||(this.srcsetOriginalValueStore[t]={}),this.srcsetOriginalValueStore[t][t.value]=e},this.getSrcValuesFromSrcsetAttribute=R,this.replaceSrcsetNode=function(t,e,r){var n=this.getCachedOriginalSrcsetAttribute(t)||t.value;C(a);var i=s[a],o=R(n),c=function(t,e,r,a,n){if(t){var i=t;for(var o in e)if(e.hasOwnProperty(o)){var s=e[o];if(r[o]){var c=L(r[o][a]||[],n);c&&c.data&&(i=i.replace(s,c.data))}}return i}}(n,o,i,r,e);return c?(t.value=c,this.cacheOriginalSrcsetAttribute(t,n),o):[]},this.getByComplexValue=function(e,r,n){var i=q(e,!1);C(n);var o=function(e,r,n){var i=H(r);if(i.hasOwnProperty(n))return i[n];var o=t.c("Utils").normalizeText(n);return i.hasOwnProperty(o)?i[o]:H(a)[o]||void 0}(0,t.c("Lang").getDocLang(),i);return o&&o[n]&&o[n].length>0?o[n][0]:null},this.getTranslationDataFromIndex=function(t,e,r){return r.hasOwnProperty(t)?r[t]:G(e)?T(t,r):null},this.getDefaultValue=function(t,r){return this.getByValue(t,r,a)||{data:e.getData(t,!0)}},this.getDefaultComplexValue=function(t,e){return this.getByComplexValue(t,e,a)||{data:q(t,!1)}},this.validateCache=function(e,r,n){var i=e.node,o=i.wovnTranslation;if(o&&"object"===u(o)){var s=this.getData(e),c=i.actualLang||t.c("Lang").getActualLang();if(c){var l=o[c],d=l&&E(L(l,r),e),f=t.c("Utils").normalizeText(s);if(!d||t.c("Utils").normalizeText(d.data)!==f){C(c);var g=j(e,c),h=this.getTranslationDataFromIndex(f,e,g);if(!h){var p=j(e,a);h=this.getTranslationDataFromIndex(f,e,p)}i.wovnTranslation=h}}}},this.getData=function(e,r){var a,n,i=e.node;if(function(t){return-1!==y.indexOf(t)}(e.getUpperNodeName()||i.name.toUpperCase()))a=r?i.value:t.c("Utils").normalizeText(i.value);else if(G(e))if(i.getAttribute){if(a=(n=i.getAttribute("src"))?i.src:"","path"===t.tag.getAttribute("urlPattern")&&!/^(https?:\/\/|\/)/.test(n)){var o=t.c("Lang").getDefaultCodeIfExists();o&&(a=t.c("Url").getUrl(o,a,!0))}}else a=i.src;else{if(t.c("Node").isLegitimateNode(e))a=e.data;else{if(!t.c("Node").isFirstTextNode(i))return"";a=t.c("Node").wholeText(i)}!0!==r&&(a=t.c("Utils").normalizeText(a))}return a},this.getOriginalComplexData=function(t){return e._nodeToSrc(t,!0,!1)};var y=["ALT","VALUE","PLACEHOLDER","DATA-CONFIRM","DATA-DISABLE-WITH","CONTENT","LABEL","TITLE"];this.replaceData=function(e,r,a){if(r){var n=e.node,i=e.nodeName;switch(!0){case new RegExp(y.join("|"),"i").test(i||n.name):Y(n,r,a);break;case/#text/i.test(i):Z(e,r,a);break;case/img/i.test(i)||!(!/input/i.test(i)||!n.src):!function(e,r,a){var n=t.c("Lang").getDefaultCodeIfExists();if(n){if("path"===t.tag.getAttribute("urlPattern")){var i=location.hostname;location.port&&(i=i+":"+location.port),t.c("Url").getDomainPort(r).toLowerCase()==i&&(r=t.c("Url").getUrl(n,r))}e.actualLang=a,e.src!==r&&Y(e.getAttributeNode("src"),r,a)}}(n,r,a)}}},this.replaceAttribute=function(t,e,r,a){var n=t.node.getAttributeNode(e);t.node.actualLang=a,Y(n,r,a)};var w={};this.replaceComplexData=function(e,r,a){!function e(r,a,n){if(1!==r.nodeType)Z(t.c("NodeContainer").create(r),a);else{if(x(r))return;var i=r.childNodes;if(i.length>0){var o=n||w[a];if(!o){var s=document.createElement(r.tagName);s.innerHTML=a,function t(e,r){for(var a=0;a<e.childNodes.length;a++)if(e.childNodes[a].childNodes.length>0)t(e.childNodes[a],r.childNodes[a]);else if(!J(r)){if(r.childNodes.length<=a&&J(e.childNodes[a])){var n=document.createTextNode("");r.insertBefore(n,null)}if(void 0!==r.childNodes[a]&&e.childNodes[a].nodeName!==r.childNodes[a].nodeName&&J(e.childNodes[a])){var i=document.createTextNode("");r.insertBefore(i,r.childNodes[a])}}}(r,s),o=function t(e){var r=[];if(1!==e.nodeType)r.push(e.data);else for(var a=e.childNodes,n=0;n<a.length;++n){var i=a[n],o=t(a[n]);1!==i.nodeType?r=r.concat(o):r.push(o)}return r}(s),w[a]=o}for(var c=0,u=0;u<i.length;++u){var l=o[c];e(i[u],l,o[c]),c++}}}}(e.node,r,a),e.refreshData()},this.replaceText=Z,this.revertImage=function(t){if("none"!==t.style.backgroundImage){var e=X(t);(e||""===e)&&(t.style.backgroundImage=e)}},this.replaceCssImageData=function(t,e){var r=X(t);if(r||""===r||function(t){t.setAttribute(b,t.style.backgroundImage||"")}(t),e.length>0){var a=[];e.forEach(function(t){a.push("url("+t+")")}),t.style.backgroundImage=a.join(", ")}else t.style.backgroundImage=""},this.getTranslatedLangs=function(){return f},this.empty=function(){for(var t in o[a])if(o[a].hasOwnProperty(t))return!1;for(var e in c[a])if(c[a].hasOwnProperty(e))return!1;for(var r in s[a])if(s[a].hasOwnProperty(r))return!1;return!0},this.getNewDetectedValueSet=function(){return p}}function x(t){return t.hasAttribute&&t.hasAttribute("wovn-ignore")}function N(){A(s),A(o),A(c)}function A(t){var e=t[a];for(var r in e){var n=e[r],i="";for(var o in n){i=n[o][0].xpath;break}n[a]||(n[a]=[{data:r,xpath:i}])}}function S(e){var a=r;e&&(a=[e]);for(var n={},i=0;i<a.length;i++){var o=a[i];if(l[o])for(var s=t.c("Utils").keys(l[o]),c=0;c<s.length;c++)n[s[c]]=!0}d=t.c("Utils").keys(n)}function T(t,e){if(e.hasOwnProperty(t))return e[t]}function O(){for(var t in o)D(o,t);for(t in c)D(c,t)}function D(r,a){for(var n in r[a])if(r[a].hasOwnProperty(n)){var i=n;if(r===c){var o=document.createElement("P");o.innerHTML=i,i=e._nodeToSrc(o,!1,!1)}else i=t.c("Utils").normalizeText(n);if(i!==n){var s=r[a][n];for(var u in s)if(s.hasOwnProperty(u))for(var l in s[u])s[u].hasOwnProperty(l);r[a][i]=s,delete r[a][n]}}}function I(t){return"object"!==u(t)?(h.push(t),!0):t.hasOwnProperty("src")&&t.hasOwnProperty("dst")&&t.hasOwnProperty("language")?t.src===t.dst&&(h.push(t),!0):(h.push(t),!0)}function C(t){U(o,t),U(c,t),U(s,t)}function U(e,r){var n=function(e,r){for(var a=0;a<e.length;++a)t.c("Utils").findIndex(r,e[a],function(t,e){return t.data===e.data&&t.xpath===e.xpath})&&r.push(e[a])};if(!e[r]){for(var i in e[r]={},e[a])if(e[a].hasOwnProperty(i)){var s=e[a][i];if(s[r])for(var u=0;u<s[r].length;u++){var l=s[r][u].data,d=e[r][l];for(var f in d||(d={},e[r][l]=d),s)if(s.hasOwnProperty(f)){if(!f||!s[f])continue;d[f]||(d[f]=[]),n(s[f],d[f])}}}e!==o&&e!==c||D(e,r)}}function V(t,e){for(var r=0,a=t.length-1,n=e.length-1;a>=0&&n>=0;){if(t[a]!==e[n])return r;"/"===t[a]&&r++,a--,n--}return r}function L(t,e){if(!t||0===t.length)return null;if(1===t.length)return t[0];for(var r=t[0],a=V(e,t[0].xpath),n=0,i=1;i<t.length;i++)(n=V(e,t[i].xpath))>a&&(r=t[i],a=n);return r}function E(e,r){var a=r.data||t.c("ValueStore").getData(r);return e&&t.c("Utils").normalizeText(e.data)===t.c("Utils").normalizeText(a)&&(e.data=a),e}function P(t,r){for(var a in t.src_property)if(t.src_property.hasOwnProperty(a)){if("childTextContent"===a)return t.src_property[a]===e.getSrcChildTextContent(r);if(window.getComputedStyle(r)[a]!==t.src_property[a])return!1}return!0}function k(e,r){for(var a=r,n=0,i=0;i<e.length;i++){a=M(a);var o=e[i];if(a.nodeName.toUpperCase()!==o.tag_name.toUpperCase())return-1;if(a.parentNode.children)for(var s=a.parentNode.children,c=o.position||0,u=0,l=0;l<s.length;l++){var d=s[l];if(d.nodeName.toUpperCase()==o.tag_name.toUpperCase()){if(u===c){if(a!==d)return-1;break}u++}}if(n++,a.getAttribute("id")==o.element_id&&(n+=10),o.classes&&a.className)for(var f=o.classes,g=t.c("Utils").to_set(a.className.split(/\s+/)),h=0;h<f.length;h++)g[f[h]]&&(n+=10/f.length)}return n}function _(e,r,a){F(r);var n=t.c("Utils").keys(e.style);a=a||{style:{}};for(var i=0;i<n.length;i++){var o=n[i];0==a.style.hasOwnProperty(o)&&(a.style[o]=r.style[o]),r.style[o]=e.style[o];var s=o.replace(/([A-Z])/,"-$1").toLowerCase(),c=new RegExp("(("+s+": [^;]+?)( !important)?);","g");r.style.cssText=r.style.cssText.replace(c,"$1 !important;")}!function(t,e){r.setAttribute("data-wovn-original-property",JSON.stringify(t))}(a)}function F(r){var a=e.getOriginalProperties(r);if(a&&a.style)for(var n=a.style,i=t.c("Utils").keys(n),o=0;o<i.length;o++){var s=i[o];r.style[s]=n[s]}}function M(t){return e.getParentElementOverrideFunc?e.getParentElementOverrideFunc(t):t.parentNode}function R(e){var r=/\s+[^\s]+$/,a=e.match(/[^\s,]+(\s+[^\s,]+)?/g),n={};for(var i in a)if(a.hasOwnProperty(i)){var o=a[i].replace(r,""),s=t.c("UrlFormatter").createFromUrl(o);s.setShowFullUrl(),n[s.getOriginalUrl()]=o}return n}function B(r,n,i){if(n.hasOwnProperty(i))return n[i];var o=t.c("Utils").normalizeText(i),s=e.getTranslationDataFromIndex(o,r,n);if(s)return s;var c=j(r,a);return(s=e.getTranslationDataFromIndex(o,r,c))||void 0}function z(t){var e=$(t).previousSibling;return e&&"#comment"===e.nodeName&&0===e.data.indexOf(m)?e:null}function W(e,r){var a=z(e.node);if(a){var n,i=a.data.indexOf(v);if((n=-1==i?a.data.substring(m.length):a.data.substring(m.length,i)).length)return B(e,r,t.c("Utils").decodeHTMLEntities(n))}return null}function $(e){var r=e.parentElement||e.parentNode;return r?t.c("DomAuditor").isSwappedMoreThanOnce&&"TITLE"===r.nodeName?r:e:e.ownerElement}function j(t,e){var r;if(e||(e=[a]),"string"==typeof e&&(e=[e]),"IMG"===t.nodeName)for(;!r&&e.length>0;)r=s[e.shift()];else if("INPUT"===t.nodeName)for(;!r&&e.length>0;)r=s[e.shift()];else if("META"===t.nodeName)for(;!r&&e.length>0;)r=o[e.shift()];else for(;!r&&e.length>0;)r=o[e.shift()];return r}function H(t){return c[t]||C(t),c[t]}function q(t,r){return e._nodeToSrc(t,r,!1)}function G(t){return"IMG"===t.nodeName||!("INPUT"!==t.nodeName||!t.node.src)||void 0}function J(t){return 3===t.nodeType}function Z(t,e,r){if(void 0!==e){var a=t.data,n=a.replace(/^(\s*)[\s\S]*?(\s*)$/,"$1"+e.replace(/^\s+/,"").replace(/\s+$/,"").replace(/\$/g,"$$$$")+"$2");a!==n&&t.replaceData(n,r)}}function X(t){return t.getAttribute(b)}function Y(t,e,r){t&&t.value!==e&&(t.value=e,t.actualLang=r)}}},2:function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={WIDGET_ID:"wovn-translate-widget",BUILT_IN_WIDGET_ID:"wovn-languages",IS_DEV:!1,STALLION_IFRAME_ID:"wovn-stallion-iframe",STALLION_MESSAGE_TYPES:{sync:"WOVN_STALLION_READY",request:"WOVN_STALLION_REQUEST",response:"WOVN_STALLION_RESPONSE"}}},20:function(t,e,r){"use strict";(function(e){var a=r(87),n=r(88),i=/^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i,o=/^[A-Za-z][A-Za-z0-9+-.]*:\/\//,s=[["#","hash"],["?","query"],function(t){return t.replace("\\","/")},["/","pathname"],["@","auth",1],[NaN,"host",void 0,1,1],[/:(\d+)$/,"port",void 0,1],[NaN,"hostname",void 0,1,1]],c={hash:1,query:1};function u(t){var r,a=("undefined"!=typeof window?window:void 0!==e?e:"undefined"!=typeof self?self:{}).location||{},n={},i=typeof(t=t||a);if("blob:"===t.protocol)n=new d(unescape(t.pathname),{});else if("string"===i)for(r in n=new d(t,{}),c)delete n[r];else if("object"===i){for(r in t)r in c||(n[r]=t[r]);void 0===n.slashes&&(n.slashes=o.test(t.href))}return n}function l(t){var e=i.exec(t);return{protocol:e[1]?e[1].toLowerCase():"",slashes:!!e[2],rest:e[3]}}function d(t,e,r){if(!(this instanceof d))return new d(t,e,r);var i,o,c,f,g,h,p=s.slice(),m=typeof e,v=this,b=0;for("object"!==m&&"string"!==m&&(r=e,e=null),r&&"function"!=typeof r&&(r=n.parse),e=u(e),i=!(o=l(t||"")).protocol&&!o.slashes,v.slashes=o.slashes||i&&e.slashes,v.protocol=o.protocol||e.protocol||"",t=o.rest,o.slashes||(p[3]=[/(.*)/,"pathname"]);b<p.length;b++)"function"!=typeof(f=p[b])?(c=f[0],h=f[1],c!=c?v[h]=t:"string"==typeof c?~(g=t.indexOf(c))&&("number"==typeof f[2]?(v[h]=t.slice(0,g),t=t.slice(g+f[2])):(v[h]=t.slice(g),t=t.slice(0,g))):(g=c.exec(t))&&(v[h]=g[1],t=t.slice(0,g.index)),v[h]=v[h]||i&&f[3]&&e[h]||"",f[4]&&(v[h]=v[h].toLowerCase())):t=f(t);r&&(v.query=r(v.query)),i&&e.slashes&&"/"!==v.pathname.charAt(0)&&(""!==v.pathname||""!==e.pathname)&&(v.pathname=function(t,e){for(var r=(e||"/").split("/").slice(0,-1).concat(t.split("/")),a=r.length,n=r[a-1],i=!1,o=0;a--;)"."===r[a]?r.splice(a,1):".."===r[a]?(r.splice(a,1),o++):o&&(0===a&&(i=!0),r.splice(a,1),o--);return i&&r.unshift(""),"."!==n&&".."!==n||r.push(""),r.join("/")}(v.pathname,e.pathname)),a(v.port,v.protocol)||(v.host=v.hostname,v.port=""),v.username=v.password="",v.auth&&(f=v.auth.split(":"),v.username=f[0]||"",v.password=f[1]||""),v.origin=v.protocol&&v.host&&"file:"!==v.protocol?v.protocol+"//"+v.host:"null",v.href=v.toString()}d.prototype={set:function(t,e,r){var i=this;switch(t){case"query":"string"==typeof e&&e.length&&(e=(r||n.parse)(e)),i[t]=e;break;case"port":i[t]=e,a(e,i.protocol)?e&&(i.host=i.hostname+":"+e):(i.host=i.hostname,i[t]="");break;case"hostname":i[t]=e,i.port&&(e+=":"+i.port),i.host=e;break;case"host":i[t]=e,/:\d+$/.test(e)?(e=e.split(":"),i.port=e.pop(),i.hostname=e.join(":")):(i.hostname=e,i.port="");break;case"protocol":i.protocol=e.toLowerCase(),i.slashes=!r;break;case"pathname":case"hash":if(e){var o="pathname"===t?"/":"#";i[t]=e.charAt(0)!==o?o+e:e}else i[t]=e;break;default:i[t]=e}for(var c=0;c<s.length;c++){var u=s[c];u[4]&&(i[u[1]]=i[u[1]].toLowerCase())}return i.origin=i.protocol&&i.host&&"file:"!==i.protocol?i.protocol+"//"+i.host:"null",i.href=i.toString(),i},toString:function(t){t&&"function"==typeof t||(t=n.stringify);var e,r=this,a=r.protocol;a&&":"!==a.charAt(a.length-1)&&(a+=":");var i=a+(r.slashes?"//":"");return r.username&&(i+=r.username,r.password&&(i+=":"+r.password),i+="@"),i+=r.host+r.pathname,(e="object"==typeof r.query?t(r.query):r.query)&&(i+="?"!==e.charAt(0)?"?"+e:e),r.hash&&(i+=r.hash),i}},d.extractProtocol=l,d.location=u,d.qs=n,t.exports=d}).call(this,r(3))},3:function(t,e){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(t){"object"==typeof window&&(r=window)}t.exports=r},86:function(t,e,r){t.exports=r(130)},87:function(t,e,r){"use strict";t.exports=function(t,e){if(e=e.split(":")[0],!(t=+t))return!1;switch(e){case"http":case"ws":return 80!==t;case"https":case"wss":return 443!==t;case"ftp":return 21!==t;case"gopher":return 70!==t;case"file":return!1}return 0!==t}},88:function(t,e,r){"use strict";var a=Object.prototype.hasOwnProperty;function n(t){return decodeURIComponent(t.replace(/\+/g," "))}e.stringify=function(t,e){e=e||"";var r,n,i=[];for(n in"string"!=typeof e&&(e="?"),t)a.call(t,n)&&((r=t[n])||null!=r&&!isNaN(r)||(r=""),i.push(encodeURIComponent(n)+"="+encodeURIComponent(r)));return i.length?e+i.join("&"):""},e.parse=function(t){for(var e,r=/([^=?&]+)=?([^&]*)/g,a={};e=r.exec(t);){var i=n(e[1]),o=n(e[2]);i in a||(a[i]=o)}return a}}});
!function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(r,o,function(e){return t[e]}.bind(null,o));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=42)}([function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(){}return t.prototype.c=function(t){return this.instance().c(t)},Object.defineProperty(t.prototype,"tag",{get:function(){return this.instance()?this.instance().tag:{getAttribute:function(){}}},enumerable:!0,configurable:!0}),t.prototype.instance=function(){return window.WOVN&&window.WOVN.io&&window.WOVN.io._private?window.WOVN.io._private.widget:null},t.prototype.isBackend=function(){return this.tag.getAttribute("backend")},t.prototype.getBackendCurrentLang=function(){return this.tag.getAttribute("currentLang")},t.prototype.getBackendDefaultLang=function(){return this.tag.getAttribute("defaultLang")},t.prototype.isComponentLoaded=function(t){return!!this.instance()&&this.instance().isComponentLoaded()},t.prototype.isTest=function(){return this.instance().isTest||!1},t.prototype.loadTranslation=function(t,e,n){this.instance()&&this.instance().loadTranslation(t,e,n)},t.prototype.reloadData=function(t){this.instance()&&this.instance().reloadData(t)},t.prototype.loadPreviewData=function(t,e,n){this.instance().loadPreviewData(t,e,n)},t.prototype.loadDataJson=function(t){this.instance().loadDataJson(t)},t.prototype.reinstallComponent=function(t){this.instance().reinstallComponent(t)},t.prototype.loadDomainOption=function(t,e){this.instance().loadDomainOption(t,e)},t.prototype.loadComponents=function(t,e){this.instance().loadComponents(t,e)},t.prototype.loadSavedData=function(t,e){this.instance().loadSavedData(t,e)},t}();e.default=new r},,function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={WIDGET_ID:"wovn-translate-widget",BUILT_IN_WIDGET_ID:"wovn-languages",IS_DEV:!1,STALLION_IFRAME_ID:"wovn-stallion-iframe",STALLION_MESSAGE_TYPES:{sync:"WOVN_STALLION_READY",request:"WOVN_STALLION_REQUEST",response:"WOVN_STALLION_RESPONSE"}}},function(t,e){var n;n=function(){return this}();try{n=n||new Function("return this")()}catch(t){"object"==typeof window&&(n=window)}t.exports=n},function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var md5=__webpack_require__(55),domready=__webpack_require__(58),Widget_1=__webpack_require__(0),Agent_1=__webpack_require__(21),Constant_1=__webpack_require__(2),hasComputedStyleCache=void 0,browserFingerprint,addedEvents=[],wovnEmptyCharacter="​";function hasComputedStyle(){return void 0===hasComputedStyleCache&&(hasComputedStyleCache=!!window.getComputedStyle),hasComputedStyleCache}function createJsonHandler(t,e){return function(n,r){if(n){try{var o=JSON.parse(n)}catch(t){return void e()}t(o,r)}else e()}}function jsonReviver(t,e,n){var r,o,i=t[e];if(i&&"object"==typeof i)for(r in i)Object.prototype.hasOwnProperty.call(i,r)&&(void 0!==(o=jsonReviver(i,r,n))?i[r]=o:delete i[r]);return n.call(t,e,i)}function trimText(t,e){var n=t;return Agent_1.default.mutatesTextNodeData()&&(n=n.replace(/([^\u0000-\u007F])\n([^\u0000-\u007F])/g,"$1$2")),n.replace(e," ").replace(/^[\s\u00A0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]+|[\s\u00A0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]+$/g,"")}var removesZeroWidthByTrim=void 0,Utils=function(){function Utils(){this.normalizeTextCache={},this.normalizeTextCacheWithoutZeroWidthSpace={}}return Utils.prototype.pageIsWidgetPreview=function(){return/fake_page\/blank/.test(window.location.pathname)&&/wovn\.(io|com)/.test(window.location.hostname)},Utils.prototype.createInitEvent=function(t,e,n){var r=null;return document.createEvent?(r=document.createEvent("Event")).initEvent(t,e,n):document.createEventObject&&(r=document.createEventObject()),r},Utils.prototype.addEventListener=function(t,e){document.addEventListener?document.addEventListener(t,e):document.createEventObject&&document.attachEvent(t,e)},Utils.prototype.dispatchEvent=function(t){document.dispatchEvent?document.dispatchEvent(t):document.createEventObject&&document.documentElement[t]++},Utils.prototype.getMetaElement=function(t,e){e||(e={});for(var n=document.getElementsByTagName("meta"),r=0;r<n.length;++r)if(n[r].getAttribute("name")===t){var o=!0;for(var i in e)if(e.hasOwnProperty(i)&&e[i]!==n[r].getAttribute(i)){o=!1;break}if(o)return n[r]}return null},Utils.prototype.getElementsByClassName=function(t,e){if("function"==typeof document.getElementsByClassName)return t.getElementsByClassName(e);for(var n=[],r=new RegExp("(^| )"+e+"( |$)"),o=t.getElementsByTagName("*"),i=0,a=o.length;i<a;i++)(r.test(o[i].className)||r.test(o[i].getAttribute("class")))&&n.push(o[i]);return n},Utils.prototype.canStyleChange=function(t){if(!hasComputedStyle())return!1;if(!t.style)return!1;var e=t.nodeName;return"META"!==e&&"IMG"!==e&&"#text"!==e&&"#comment"!==e},Utils.prototype.onEvent=function(t,e,n){e=e.replace(/^on(.)/i,function(t,e){return e.toLowerCase()}),t.addEventListener?t.addEventListener(e,n,!1):t.attachEvent&&t.attachEvent("on"+e,n),addedEvents.push([t,e,n])},Utils.prototype.removeHandler=function(t,e,n){t.removeEventListener?t.removeEventListener(e,n,!1):t.detachEvent&&t.detachEvent("on"+e,n)},Utils.prototype.getReadyState=function(){return document.readyState},Utils.prototype.onLoadingComplete=function(t){var e=this;"complete"===this.getReadyState()?t():setTimeout(function(){e.onLoadingComplete(t)},100)},Utils.prototype.onDomReady=function(t){domready(t)},Utils.prototype.sendRequestAsJson=function(t,e,n,r){var o=createJsonHandler(n,r);this.sendRequest(t,e,null,o,r)},Utils.prototype.postJsonRequest=function(t,e,n,r){var o=createJsonHandler(n,r);this.sendRequest("POST",t,e,o,r)},Utils.prototype.createXHR=function(){return window.XDomainRequest?new window.XDomainRequest:new XMLHttpRequest},Utils.prototype.sendRequest=function(t,e,n,r,o){var i;window.XDomainRequest?((i=new window.XDomainRequest).onload=function(){r(i.responseText,null)},i.onerror=function(){o()},i.ontimeout=function(){o()}):(i=new XMLHttpRequest).onreadystatechange=function(){if(i.readyState===XMLHttpRequest.DONE)if(200===this.status||304===this.status){for(var t={},e=i.getAllResponseHeaders().split("\r\n"),n=0;n<e.length;n++)if(""!==e[n]){var a=e[n].split(": ");t[a[0]]=a[1]}r(i.responseText,t)}else o(i)},i.open(t,e,!0),n?"object"==typeof n?i.send(this.toJSON(n)):i.send(n):i.send()},Utils.prototype.trimString=function(t){return t.trim&&void 0===removesZeroWidthByTrim&&(removesZeroWidthByTrim=0==="​".trim().length),t.trim&&!1===removesZeroWidthByTrim?t.trim():t.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"")},Utils.prototype.to_set=function(t){for(var e={},n=0;n<t.length;n++)e[t[n]]=!0;return e},Utils.prototype.isEmpty=function(t){return this.normalizeText(t)===wovnEmptyCharacter},Utils.prototype.toJSON=function(t,e,n){return this.loadsJsonBreakingPrototype()?Object.toJSON(t):this.loadsJsonBreakingMooTools()&&void 0!==JSON.encode?JSON.encode(t):JSON.stringify(t,e,n)},Utils.prototype.loadsJsonBreakingPrototype=function(){return void 0!==window.Prototype&&'["a"]'!==JSON.stringify(["a"])},Utils.prototype.loadsJsonBreakingMooTools=function(){return void 0!==window.MooTools&&'["a"]'!==JSON.stringify(["a"])},Utils.prototype.pushUnique=function(t,e){for(var n=0;n<t.length;n++)if(e==t[n])return;t.push(e)},Utils.prototype.findIndex=function(t,e,n){n=n||function(t,e){return t==e};for(var r=0;r<t.length;r++)if(n(t[r],e))return r;return-1},Utils.prototype.setComplement=function(t,e,n){n=n||function(t,e){return t==e};var r=[];for(var o in t)t.hasOwnProperty(o)&&-1===this.findIndex(e,t[o],n)&&r.push(t[o]);return r},Utils.prototype.getBrowserFingerprint=function(){if(browserFingerprint)return browserFingerprint;var t=window.navigator,e=t.vendor,n=t.userAgent,r=t.hardwareConcurrency,o=t.language,i=t.languages,a=(t.plugins,e||"None"),u=n||"None",s=r||"None",l=o||"None",c=i||[],f=window.screen||{height:"None",width:"None",colorDepth:"None",pixelDepth:"None"},d=a+"::"+u+"::"+s+"::"+l+"::"+c.join()+"::"+function(){for(var t=window.navigator.plugins,e=[],n=0;n<t.length;++n){var r=t[n];e.push(r.name+"-"+r.description+"-"+r.filename)}return e}().join()+"::"+f.height+"::"+f.width+"::"+f.colorDepth+"::"+f.pixelDepth+"::"+(new Date).getTimezoneOffset();return browserFingerprint=md5(d)},Utils.prototype.clearCache=function(){this.normalizeTextCache={},this.normalizeTextCacheWithoutZeroWidthSpace={}},Utils.prototype.normalizeText=function(t,e){if(void 0===e&&(e=!1),null==t)return null;if(this.normalizeTextCache[t]){var n=this.normalizeTextCache[t];return e&&n===wovnEmptyCharacter?n="":e||""!==n||(n=wovnEmptyCharacter),n}var r=trimText(t,/[\n \t\u0020\u0009\u000C\u200B\u000D\u000A]+/g);return!1===e&&0===r.length&&(r=wovnEmptyCharacter),this.normalizeTextCache[t]=r,r},Utils.prototype.normalizeTextWithoutZeroWidthSpace=function(t){if(null==t)return null;if(this.normalizeTextCacheWithoutZeroWidthSpace[t])return this.normalizeTextCacheWithoutZeroWidthSpace[t];var e=trimText(t,/[\n \t\u0020\u0009\u000C\u000D\u000A]+/g);return this.normalizeTextCacheWithoutZeroWidthSpace[t]=e,e},Utils.prototype.decodeHTMLEntities=function(t){return t.replace(/&#(\d+);/g,function(t,e){return String.fromCharCode(e)})},Utils.prototype.extractPath=function(t){var e=t.replace(/^.*?\/\/[^\/]+/,"");return""===e?"/":e},Utils.prototype.toArrayFromDomList=function(t){for(var e=[],n=0;n<t.length;n++)e.push(t[n]);return e},Utils.prototype.keys=function(t){if(Object.keys)return Object.keys(t);var e=[];for(var n in t)t.hasOwnProperty(n)&&e.push(n);return e},Utils.prototype.values=function(t){for(var e=this.keys(t),n=[],r=0;r<e.length;r++)n.push(t[e[r]]);return n},Utils.prototype.each=function(t,e){for(var n=this.keys(t),r=0;r<n.length;r++){var o=n[r];e(o,t[o])}},Utils.prototype.includes=function(t,e){for(var n=0;n<t.length;n++)if(t[n]===e)return!0;return!1},Utils.prototype.indexOf=function(t,e,n){if(void 0===n&&(n=0),t.indexOf)return t.indexOf(e);var r=t.length>>>0;if(0===r)return-1;if(1/0===Math.abs(n)&&(n=0),n>=r)return-1;for(n=Math.max(0<=n?n:r-Math.abs(n),0);n<r;n++)if(n in t&&t[n]===e)return n;return-1},Utils.prototype.parseJSON=function(jsonText,reviver){if(JSON&&JSON.parse)return JSON.parse(jsonText);var s=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;s.lastIndex=0,s.test(jsonText)&&(jsonText=jsonText.replace(s,function(t){return"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)}));var replace=jsonText.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@"),replace2=replace.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]"),s2=replace2.replace(/(?:^|:|,)(?:\s*\[)+/g,"");if(/^[\],:{}\s]*$/.test(s2)){var d=eval("("+jsonText+")");return"function"==typeof reviver?jsonReviver({"":d},"",reviver):d}throw new SyntaxError("JSON.parse")},Utils.prototype.isValidURI=function(t){try{return decodeURIComponent(t),!0}catch(t){if("URIError"===t.name)return!1}},Utils.prototype.assign=function(t,e){return Object.assign?Object.assign(t,e):(Object.keys(e).forEach(function(n){t[n]=e[n]}),t)},Utils.prototype.destroy=function(){for(var t=0;t<addedEvents.length;t++){var e=addedEvents[t];this.removeHandler(e[0],e[1],e[2])}},Utils.prototype.convertCssStyles=function(t){if(!Constant_1.default.IS_DEV)return t;var e,n,r=Widget_1.default.c("RailsBridge").domainCssStyles,o={};if(Object.keys(t).forEach(function(i){var a=t[i];"style"===i?e=a.toString().split(" "):"position"===i?n=a.toString():r[i]&&r[i][a.toString()]&&(o[i]=r[i][a.toString()])}),e&&r.style[e[0]]){var i=r.style[e[0]];o.style=i.form,2==e.length&&i.colors[e[1]]&&(o.style+=i.colors[e[1]]),o.position=i.position[n]}return t.css=o,t},Utils}();exports.default=new Utils},,,function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(26),o=void 0,i={widgetOptions:{},published_langs:[],convert_langs:[]},a={},u=function(){function t(){}return t.prototype.getValue=function(t){return i[t]||(this.getOptions()||{})[t]},t.prototype.set=function(t){i=t},t.prototype.setSavedData=function(t){a=t},t.prototype.getSavedData=function(){return a},t.prototype.getValuesInfo=function(){return i.values_info||{}},t.prototype.getProTranslatingValues=function(){return i.pro_translating},t.prototype.get=function(){return i},t.prototype.getLang=function(){return i.language},t.prototype.getPageCss=function(){return i.page_css},t.prototype.getPageJs=function(){return i.page_js},t.prototype.getSecondaryLang=function(){return this.getOptions().secondary_language},t.prototype.getPageId=function(){return i.id},t.prototype.getManualPublishedDate=function(){var t=i.manual_published_time;return t?new Date(1e3*t):null},t.prototype.getTranslationData=function(){var t=this.getTextValues(),e=this.getImageValues(),n=this.getHTMLTextValues();return new r.default(Date.now(),t,e,n)},t.prototype.getTextValues=function(){return i.text_vals||{}},t.prototype.getHTMLTextValues=function(){return i.html_text_vals||{}},t.prototype.getImageValues=function(){return i.img_vals||{}},t.prototype.getLinkTranslations=function(){return i.link_translations||{}},t.prototype.getRemovedTextValues=function(){return i.removed_text_vals||[]},t.prototype.getPublishedLangs=function(){return i.published_langs||[]},t.prototype.hasPublishedLang=function(){return this.getPublishedLangs().length>0},t.prototype.getDomainLangs=function(){return this.getValue("domain_langs")||[]},t.prototype.getConvertedLangs=function(){var t=i.convert_langs||[],e=this.getDomainLangs();return 0===e.length?t:t.reduce(function(t,n){return e.indexOf(n.code)>-1&&t.push(n),t},[])},t.prototype.isTranslatableLangs=function(t){return this.getTranslatableLangs().indexOf(t)>-1},t.prototype.getTranslatableLangs=function(){return this.getPublishedLangs().concat(this.getLang())},t.prototype.getAutoTranslateLangs=function(){return this.getOptions().auto_translate_langs||i.auto_translate_langs},t.prototype.getAutoPublishLangs=function(){return this.getOptions().auto_publish_langs||i.auto_translate_langs},t.prototype.getOptions=function(){return i.widgetOptions},t.prototype.setOptions=function(t){i.widgetOptions=t},t.prototype.updateOptions=function(t){for(var e in i.widgetOptions||(i.widgetOptions={}),t)t.hasOwnProperty(e)&&(i.widgetOptions[e]=t[e])},t.prototype.hasEmptyOriginalOptions=function(){if(!i.widgetOptions||"{}"==JSON.stringify(i.widgetOptions))return!0;var t=[];for(var e in i.widgetOptions)i.widgetOptions.hasOwnProperty(e)&&t.push(e);return["countryCode"].sort().toString()==t.sort().toString()},t.prototype.getStyleColor=function(){var t=this.getValue("style");if(!t)return null;var e=t.split(" ");return e.length<2?null:e[1]},t.prototype.needsCountryCode=function(t){return t.useCountryData||!1},t.prototype.getCountryCode=function(){if(i.widgetOptions)return this.getOptions().countryCode},t.prototype.browsesFromJapan=function(){return!!i.widgetOptions&&"JP"===this.getOptions().countryCode},t.prototype.setCountryCode=function(t){i.widgetOptions||(i.widgetOptions={}),i.widgetOptions.countryCode=t},t.prototype.dynamicValues=function(){return this.getValue("dynamic_values")||!1},t.prototype.getIgnoredClasses=function(){return this.getValue("ignored_classes")||[]},t.prototype.getIgnoredSelectors=function(){return this.getValue("ignored_selectors")||[]},t.prototype.getIgnoredPatterns=function(){return{classes:this.getIgnoredClasses(),selectors:this.getIgnoredSelectors()}},t.prototype.getExcludedPaths=function(){return this.getValue("excluded_paths")||[]},t.prototype.getExcludedUrls=function(){return this.getValue("excluded_urls")||[]},t.prototype.useWidgetManualStartFeature=function(){return this.getValue("widget_manual_start")||!1},t.prototype.useMachineTranslatedModal=function(){return this.getValue("show_machine_translated_modal")||!1},t.prototype.getMachineTranslatedModalContent=function(){return this.getValue("machine_translated_modal_content")||{}},t.prototype.reportLotRatio=function(){var t=this.getOptions().report_lot_ratio;return t||0===t||(t=1),t},t.prototype.dynamicLoading=function(){return this.getValue("dynamic_loading")||!1},t.prototype.useUnifiedValue=function(){return i.widgetOptions.unified_values},t.prototype.useUnifiedValuesMigrating=function(){return i.widgetOptions.unified_values_migrating},t.prototype.useAriaLabel=function(){return i.widgetOptions.aria_label},t.prototype.useFragmentedValue=function(){return i.widgetOptions.scraping2},t.prototype.useFuzzyMatch=function(){return this.getOptions().fuzzy_match||i.fuzzy_match},t.prototype.numberSwappingAllowed=function(){return i.widgetOptions.number_swapping||!1},t.prototype.useImmediateWidget=function(){return!0===this.getOptions().immediate_widget},t.prototype.hasWidgetSessionFeature=function(){return!0===this.getOptions().widget_session},t.prototype.hasDomainPrecacheFeature=function(){return 1==this.getOptions().domain_precache},t.prototype.hasOnDemandTranslationFeature=function(){return 1==this.getOptions().on_demand_translation},t.prototype.hasUnifiedValuePreviewFeature=function(){return i.has_unified_values_preview||!1},t.prototype.hasFastReportNewPagesFeature=function(){return!!this.getOptions().fast_report_new_pages},t.prototype.hasSpaStopClearingWidgetLanguages=function(){return!!this.getOptions().spa_stop_clearing_widget_languages},t.prototype.hasIgnoreBrowserLang=function(){return this.getOptions().ignore_browser_lang},t.prototype.hasNoAutomaticRedirection=function(){return this.getOptions().no_automatic_redirection},t.prototype.couldUseGlossaryAddFeature=function(){return!!this.getValue("tp_glossary_terms")},t.prototype.createNormalizedHostAliases=function(){if(o)return o;for(var t=this.getOptions().host_aliases||[],e=0;e<t.length;e++)t[e]=t[e].replace(/^\^/,"").replace(/\$$/,"").replace(/\\([^\\])/g,"$1");return o=t,t},t.prototype.clear=function(){o=void 0,i={widgetOptions:{},published_langs:[],convert_langs:[]},a={}},t}();e.default=new u},,function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children||(t.children=[]),Object.defineProperty(t,"loaded",{enumerable:!0,get:function(){return t.l}}),Object.defineProperty(t,"id",{enumerable:!0,get:function(){return t.i}}),t.webpackPolyfill=1),t}},,,,,,,,,,,,function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=void 0,o=window.navigator.userAgent,i=function(){function t(){this.isIEResult=void 0,this.isEdgeResult=void 0}return t.prototype.setAgentString=function(t){o=t},t.prototype.getAgentString=function(){return o},t.prototype.isIE=function(){if(void 0!==this.isIEResult)return this.isIEResult;var t=o.toLowerCase();return this.isIEResult=-1!==t.indexOf("msie")||-1!==t.indexOf("trident"),this.isIEResult},t.prototype.isEdge=function(){return void 0!==this.isEdgeResult?this.isEdgeResult:(this.isEdgeResult=!!o.match(/Edge/),this.isEdgeResult)},t.prototype.isCrawler=function(){return new RegExp("googlebot|slurp|y!j|yahooseeker|bingbot|msnbot|baiduspider|yandex|yeti|naverbot|duckduckbot|360spider|^sogou","i").test(o)},t.prototype.isWovnCrawler=function(){return new RegExp("WovnCrawler","i").test(o)},t.prototype.isMobile=function(){return!!(o.match(/android/i)&&o.match(/mobile/i)||o.match(/iphone/i)||o.match(/ipod/i)||o.match(/phone/i)||(o.match(/blackberry/i)||o.match(/bb10/i)||o.match(/rim/i))&&!o.match(/tablet/i)||(o.match(/\(mobile;/i)||o.match(/\(tablet;/i)||o.match(/; rv:/i))&&o.match(/mobile/i)||o.match(/meego/i))},t.prototype.mutatesTextNodeData=function(){if(void 0!==r)return r;var t=document.createElement("p");return t.innerHTML="0\n1",r="0\n1"!==t.firstChild.data},t.prototype.canStoreObjectInNode=function(){return!this.isEdge()&&!this.isIE()},t.prototype.isDataHighlighter=function(){return!!o.match(/Google PP Default/)},t}();e.default=new i},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(){}return t.prototype.set=function(t,e,n,r){if(void 0===n&&(n=0),""!==t){r=void 0===r?location.hostname||"http://j.wovn.io/wovn.io":r;var o=t+"="+(null===e?"":e)+"; path=/";if(n){var i=new Date;i.setTime(i.getTime()+24*n*60*60*1e3),o+="; expires="+i.toUTCString()}var a=null,u=function(t){a=o+(t?"; domain="+t:""),document.cookie=a};if(1===r.split(".").length)u();else{var s=r.split(".");s.shift();var l="."+s.join(".");u(l),null!=this.get(t)&&this.get(t)==e||(u(l="."+r),null!=this.get(t)&&this.get(t)==e||u(r))}return a}},t.prototype.get=function(t){for(var e=t+"=",n=document.cookie.split(";"),r=0;r<n.length;r++){for(var o=n[r];" "==o.charAt(0);)o=o.substring(1,o.length);if(0==o.indexOf(e))return o.substring(e.length,o.length)}return null},t.prototype.erase=function(t){this.set(t,null,-1),this.set(t,null,-1,"")},t}();e.default=new r},,,function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};e.isElement=function(t){return"object"===("undefined"==typeof HTMLElement?"undefined":r(HTMLElement))?t instanceof HTMLElement:!!t&&"object"===(void 0===t?"undefined":r(t))&&1===t.nodeType&&"string"==typeof t.nodeName}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(7),o=n(4),i=n(28),a=function(){function t(t,e,n,r){void 0===t&&(t=null),void 0===e&&(e={}),void 0===n&&(n={}),void 0===r&&(r={}),this.creationTime=t,this.textVals=e,this.imgVals=n,this.htmlTextVals=r}return t.create=function(e,n,r,o){return new t(e,n,r,o)},t.onlyShowLangs=function(t){var e=this.loadFromStoreWithoutFilter();this.localTranslationData=this.create(e.creationTime,this.filterByLangs(t,e.textVals),this.filterByLangs(t,e.imgVals),this.filterByLangs(t,e.htmlTextVals))},t.loadFromStore=function(){return this.localTranslationData||this.loadFromStoreWithoutFilter()},t.loadFromStoreWithoutFilter=function(){var e=Date.now()-36e5,n=r.default.getManualPublishedDate(),o=n?n.getTime():e;return o<e&&(o=e),t.getStoredTranslationValue(o)},t.getStoredTranslationValue=function(e){var n=i.WovnStorageInstance.get();return n&&t.getStoredTranslation(n,e)||new t(Date.now(),{},{},{})},t.getStoredTranslation=function(e,n){var r=e.getValue("TranslationStore",n);if(!r)return null;var o=r[0],i=r[1];return new t(o,i.text_vals||{},i.img_vals||{},i.html_text_vals||{})},t.clearData=function(){new t(1,{},{},{}).storeToStorage()},t.prototype.storeToStorage=function(){var t=i.WovnStorageInstance.get();if(t){var e={text_vals:this.textVals,img_vals:this.imgVals,html_text_vals:this.htmlTextVals};t.setValue("TranslationStore",e,this.creationTime)}},t.prototype.update=function(t){var e=this,n=t.textVals,r=t.imgVals,i=t.htmlTextVals;o.default.each(n,function(t,n){e.textVals[t]=n}),o.default.each(r,function(t,n){e.imgVals[t]=n}),o.default.each(i,function(t,n){e.htmlTextVals[t]=n}),t.creationTime<this.creationTime&&(this.creationTime=t.creationTime)},t.prototype.calcImgValsForIndex=function(t){void 0===t&&(t=null);for(var e=t||this.imgVals,n=/https?:\/\/([^\/:]+)(:[0-9]+)?/,i={},a=o.default.assign,u=r.default.createNormalizedHostAliases(),s={},l=u.length,c=0;c<l;c++)(f=u[c]).indexOf(":")>=0&&(f=f.substring(0,f.indexOf(":"))),s[f]=!0;for(c=0;c<l;c++){var f,d=(f=u[c]).indexOf(":")>=0?f:f+"$2";for(var p in e)if(e.hasOwnProperty(p)){var g=p.match(n);if(g&&!s[g[1]]){i[p]=a({},e[p]);continue}for(var h=e[p],m=p.replace(n,d),v=p.replace(n,f),y=["http://"+m,"https://"+m,"http://"+v,"https://"+v],b=0;b<y.length;b++)i[y[b]]=this.getValue(a,y[b],e,h)}}return i},t.prototype.getValue=function(t,e,n,r){return n[e]?t({},n[e]):t({},r)},t.filterByLangs=function(t,e){var n={};for(var r in e){var o=e[r],i={};Object.keys(o).filter(function(e){return-1!=t.indexOf(e)}).forEach(function(t){i[t]=o[t]}),Object.keys(i).length>0&&(n[r]=i)}return n},t}();e.default=a},function(t,e){var n={utf8:{stringToBytes:function(t){return n.bin.stringToBytes(unescape(encodeURIComponent(t)))},bytesToString:function(t){return decodeURIComponent(escape(n.bin.bytesToString(t)))}},bin:{stringToBytes:function(t){for(var e=[],n=0;n<t.length;n++)e.push(255&t.charCodeAt(n));return e},bytesToString:function(t){for(var e=[],n=0;n<t.length;n++)e.push(String.fromCharCode(t[n]));return e.join("")}}};t.exports=n},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o="__wovn__.",i=void 0;function a(t){return o+t}var u=function(){function t(){this.storage=function(){try{if(window.localStorage)return window.localStorage}catch(t){return null}return null}()}return t.prototype.get=function(e){return void 0===e&&(e=!1),i&&!e||(i=new t),i.storage?i:null},t.prototype.usable=function(){return!!this.storage},t.prototype.getValue=function(t,e){if(!this.usable())return null;var n=a(t),r=this.getItem(n);if(!r)return null;var o=null;try{o=JSON.parse(r)}catch(t){return this.removeItem(n),null}var i=o.creationTime,u=o.value;return i&&u?i<e||(new Date).getTime()<i?(this.removeItem(n),null):[i,u]:(this.removeItem(n),null)},t.prototype.setValue=function(t,e,n){if(this.usable()){var o={creationTime:n,value:e};this.setItem(a(t),r.default.toJSON(o))}},t.prototype.getItem=function(t){try{return this.storage.getItem(t)}catch(t){return null}},t.prototype.setItem=function(t,e){try{this.storage.setItem(t,e)}catch(e){this.removeItem(t)}},t.prototype.removeItem=function(t){try{this.storage.removeItem(t)}catch(t){}},t}();e.WovnStorage=u,e.WovnStorageInstance=new u},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(22),o="wovn_selected_lang",i="wovn_selected_lang_set_time";function a(){r.default.set(i,(new Date).getTime(),365)}var u=function(){function t(){}return t.prototype.set=function(t){a(),r.default.set(o,t,365)},t.prototype.get=function(){return(t=r.default.get("wovn_selected_lang_2017v1"))&&(r.default.erase("wovn_selected_lang_2017v1"),function(t){a(),r.default.set(o,t,365)}(t)),function(){var t=r.default.get(i);return!t||parseInt(t)<1519376747522}()?null:r.default.get(o);var t},t.prototype.erase=function(){r.default.erase(o)},t}();e.default=new u},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=["alt","value","placeholder","data-confirm","data-disable-with","content","label","title"],o=function(){function t(t){this.node=t,this.nodeName=t.nodeName,this.data=t.data}return t.prototype.create=function(e){return new t(e)},t.prototype.getUpperNodeName=function(){if(!this.nodeName)return null;var t=this.nodeName.charCodeAt(1);return 0==(65<=t&&t<=90)?this.nodeName.toUpperCase():this.nodeName},t.prototype.replaceData=function(t,e){this.node.data=t,this.data=t,this.node.actualLang=e},t.prototype.refreshData=function(){var t=this.node.data;t!==this.data&&(this.data=t)},t.prototype.isValueNode=function(){return-1!==r.indexOf(this.nodeName)},t}();e.default=o},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(t,e,n){this.label=t,this.node=e,this.isClose=n};e.default=r},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(7),o=n(0),i=function(){function t(){this.tagCaches={}}return t.prototype.getAttributeUsingCache=function(t){return this.tagCaches.hasOwnProperty(t)||(this.tagCaches[t]=o.default.tag.getAttribute(t)),this.tagCaches[t]},t.prototype.urlPattern=function(t){var e;if(o.default.tag.getAttribute("urlPattern"))e=o.default.tag.getAttribute("urlPattern");else if(r.default.getOptions().lang_path)switch(r.default.getOptions().lang_path){case"query":e="query";break;case"path":e="path"}return 0===arguments.length?e:e===t},t.prototype.backend=function(t){var e;return e=!!o.default.tag.getAttribute("backend"),0===arguments.length?e:e===!!t},t.prototype.getSitePrefixPath=function(){return this.getAttributeUsingCache("site_prefix_path")},t.prototype.setConfig=function(t,e){return"setConfig"===t?null:(this[t]=e,e)},t}();e.default=new i},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(30),o="wovn-src:";function i(t){return"#comment"===t.nodeName&&function(t,e){if(t.startsWith)return t.startsWith(e);for(var n=0;n<e.length;n++)if(t.charCodeAt(n)!==e.charCodeAt(n))return!1;return!0}(t.data,o)}var a=function(){function t(){}return t.prototype.isLegitimateNode=function(t){return"#text"!==t.nodeName||!function(t){var e=t.previousSibling;if(e){if("#text"===e.nodeName)return!0;if(i(e)){var n=e.previousSibling;if(n&&"#text"===n.nodeName)return!0}}var r=t.nextSibling;if(r){if("#text"===r.nodeName)return!0;if(i(r)){var o=r.nextSibling;if(o&&"#text"===o.nodeName)return!0}}return!1}(t.node)},t.prototype.isFirstTextNode=function(t){for(var e=t;e;){var n=e.previousSibling;if(!n)return!0;if("#text"===n.nodeName){if(!1===/^\s*$/.test(n.data))return!1}else if(0==i(n))return!0;e=n}},t.prototype.disableIllegitimateNode=function(t){if("#text"===t.nodeName)for(var e=t.node.nextSibling;e;){var n=new r.default(e),o=e.nextSibling;if("#text"===n.nodeName)""!==n.data&&n.replaceData("",null);else{if(!i(n))break;e.parentNode.removeChild(e)}e=o}},t.prototype.wholeText=function(t){var e=t.wholeText;if(!e){e="";for(var n=t;n&&"#text"===n.nodeName;)e+=n.data,n=n.nextSibling}return e},t.prototype.getXpath=function(t){var e=[],n=t;for("#text"===t.nodeName&&(e.push("text()"),n=n.parentElement);n&&n.nodeType===Node.ELEMENT_NODE;n=n.parentElement){for(var r=0,o=!1,i=n.previousSibling;i;i=i.previousSibling)i.nodeType!=Node.DOCUMENT_TYPE_NODE&&i.nodeName===n.nodeName&&r++;for(i=n.nextSibling;i&&!o;i=i.nextSibling)i.nodeName===n.nodeName&&(o=!0);var a=n.nodeName.toLowerCase(),u=r||o?"["+(r+1)+"]":"";e.splice(0,0,a+u)}return e.length?"/"+e.join("/"):null},t}();e.default=new a},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),o=n(7),i=n(4),a=function(){function t(){this.WOD_CONTAINER="wovn-on-demand",this.WOD_TRIGGER="wovn-on-demand-trigger",this.WOD_SOURCE="wovn-on-demand-source",this.WOD_RESULT="wovn-on-demand-result"}return t.prototype.isOdtIgnoreNode=function(t){return"function"==typeof t.getAttribute&&(t.hasAttribute(this.WOD_RESULT)||t.hasAttribute(this.WOD_SOURCE))},t.prototype.bindOdtClickEvent=function(t){if(o.default.hasOnDemandTranslationFeature()){if(!this.isValidOdtElement(t))return!1;t.querySelector("["+this.WOD_TRIGGER+"]").onclick=this.onTriggerClick.bind(this)}},t.prototype.isValidOdtElement=function(t){return!("function"!=typeof t.hasAttribute||!t.hasAttribute(this.WOD_CONTAINER))&&0!==t.querySelectorAll("["+this.WOD_SOURCE+"]").length&&0!==t.querySelectorAll("["+this.WOD_TRIGGER+"]").length&&0!==t.querySelectorAll("["+this.WOD_RESULT+"]").length},t.prototype.onTriggerClick=function(t){var e=this;t.stopPropagation(),t.preventDefault(),t.target.setAttribute("disabled",!0);var n=this.getOdtContainer(t.target);if(n){var o=n.querySelector("["+this.WOD_SOURCE+"]"),i=r.default.c("Lang").getActualLang();this.translateNode(o,i,function(r){e.insertTranslationResult(n,r),t.target.removeAttribute("disabled")},function(){t.target.removeAttribute("disabled")})}},t.prototype.getOdtContainer=function(t){for(var e=t.parentElement;e;){if(e.hasAttribute(this.WOD_CONTAINER))return e;e=e.parentElement}},t.prototype.getOdtResultNode=function(t){var e=t.querySelector("["+this.WOD_RESULT+"]");return e.setAttribute("style",""),e},t.prototype.insertTranslationResult=function(t,e){var n=this.getOdtResultNode(t);n.innerHTML=e[0].dst,n.focus()},t.prototype.clearOdtResults=function(){for(var t=document.querySelectorAll("["+this.WOD_RESULT+"]"),e=0;e<t.length;e++){var n=t[e];n.innerHTML="",n.setAttribute("style","display: none")}},t.prototype.translateNode=function(t,e,n,r){if(o.default.hasOnDemandTranslationFeature()){var i=[t.innerHTML.replace(/(<\w+)(\s+?)[^>]*/g,"$1")];this.translateTexts(i,e,n,r)}},t.prototype.translateTexts=function(t,e,n,o){var a={token:r.default.tag.getAttribute("key"),tgt_lang:e,texts:t};if(a.token&&a.tgt_lang&&t&&t.length>0){var u=r.default.c("RailsBridge").wovnHost.replace(/^.*\/\//,"//api."),s=i.default.createXHR(),l="on_demand_translation="+encodeURIComponent(i.default.toJSON(a));s.open("POST",u+"v0/on_demand_translation",!0),s.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),s.onreadystatechange=function(){if(4===s.readyState)if(200===s.status){var t=JSON.parse(s.responseText);n(t.translations)}else o(new Error("Cannot translate text"))},s.send(l)}},t}();e.default=new a},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(){}return t.prototype.contains=function(t,e){return-1!=t.indexOf(e)},t.prototype.startsWith=function(t,e,n){return n=n||0,t.substr(n,e.length)===e},t}();e.default=new r},,,,,,,function(t,e,n){t.exports=n(43)},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(44),o=n(45),i=n(2),a=n(54),u=n(59),s=n(30),l=n(60),c=n(62),f=n(64),d=n(66),p=n(68),g=n(21),h=n(32),m=n(22),v=n(69),y=n(7),b=n(70),_=n(72),w=n(29),O=n(33),C=n(34),L=n(76),T=n(77),S=n(78),x=n(79),E=n(80),N=n(81),I=n(4),A=n(84),P=n(35),D=n(28),j=n(85);document.WOVNIO.components.PunyCode=r,document.WOVNIO.components.uniqueSelector=o,document.WOVNIO.components.NodeContainer=s.default,document.WOVNIO.components.Agent=g.default,document.WOVNIO.components.Config=h.default,document.WOVNIO.components.Constant=i.default,document.WOVNIO.components.Cookie=m.default,document.WOVNIO.components.TagCustomization=v.default,document.WOVNIO.components.Data=y.default,document.WOVNIO.components.DomIterator=b.default,document.WOVNIO.components.FuzzyMatch=_.default,document.WOVNIO.components.Lang=a.default,document.WOVNIO.components.CustomDomainLanguages=u.default,document.WOVNIO.components.LangCookie=w.default,document.WOVNIO.components.Node=O.default,document.WOVNIO.components.OnDemandTranslator=C.default,document.WOVNIO.components.InSiteSearcher=L.default,document.WOVNIO.components.PageChecker=T.default,document.WOVNIO.components.Parser=S.default,document.WOVNIO.components.PerformanceMonitor=x.default,document.WOVNIO.components.SingleWorker=E.default,document.WOVNIO.components.Storage=D.WovnStorageInstance,document.WOVNIO.components.TagElementBridge=d.default,document.WOVNIO.components.TranslationDataBridge=p.default,document.WOVNIO.components.UnifiedValueTagFragmentBridge=l.default,document.WOVNIO.components.UnifiedValueTextFragmentBridge=c.default,document.WOVNIO.components.UrlFormatter=N.default,document.WOVNIO.components.Utils=I.default,document.WOVNIO.components.StringUtils=P.default,document.WOVNIO.components.ValuesStackBridge=f.default,document.WOVNIO.components.SessionProxy=A.default,document.WOVNIO.components.Wap=j.default},function(t,e,n){(function(t,r){var o;/*! https://mths.be/punycode v1.4.1 by @mathias */!function(i){e&&e.nodeType,t&&t.nodeType;var a="object"==typeof r&&r;a.global!==a&&a.window!==a&&a.self;var u,s=2147483647,l=36,c=1,f=26,d=38,p=700,g=72,h=128,m="-",v=/^xn--/,y=/[^\x20-\x7E]/,b=/[\x2E\u3002\uFF0E\uFF61]/g,_={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},w=l-c,O=Math.floor,C=String.fromCharCode;function L(t){throw new RangeError(_[t])}function T(t,e){for(var n=t.length,r=[];n--;)r[n]=e(t[n]);return r}function S(t,e){var n=t.split("@"),r="";return n.length>1&&(r=n[0]+"@",t=n[1]),r+T((t=t.replace(b,".")).split("."),e).join(".")}function x(t){for(var e,n,r=[],o=0,i=t.length;o<i;)(e=t.charCodeAt(o++))>=55296&&e<=56319&&o<i?56320==(64512&(n=t.charCodeAt(o++)))?r.push(((1023&e)<<10)+(1023&n)+65536):(r.push(e),o--):r.push(e);return r}function E(t){return T(t,function(t){var e="";return t>65535&&(e+=C((t-=65536)>>>10&1023|55296),t=56320|1023&t),e+C(t)}).join("")}function N(t){return t-48<10?t-22:t-65<26?t-65:t-97<26?t-97:l}function I(t,e){return t+22+75*(t<26)-((0!=e)<<5)}function A(t,e,n){var r=0;for(t=n?O(t/p):t>>1,t+=O(t/e);t>w*f>>1;r+=l)t=O(t/w);return O(r+(w+1)*t/(t+d))}function P(t){var e,n,r,o,i,a,u,d,p,v,y=[],b=t.length,_=0,w=h,C=g;for((n=t.lastIndexOf(m))<0&&(n=0),r=0;r<n;++r)t.charCodeAt(r)>=128&&L("not-basic"),y.push(t.charCodeAt(r));for(o=n>0?n+1:0;o<b;){for(i=_,a=1,u=l;o>=b&&L("invalid-input"),((d=N(t.charCodeAt(o++)))>=l||d>O((s-_)/a))&&L("overflow"),_+=d*a,!(d<(p=u<=C?c:u>=C+f?f:u-C));u+=l)a>O(s/(v=l-p))&&L("overflow"),a*=v;C=A(_-i,e=y.length+1,0==i),O(_/e)>s-w&&L("overflow"),w+=O(_/e),_%=e,y.splice(_++,0,w)}return E(y)}function D(t){var e,n,r,o,i,a,u,d,p,v,y,b,_,w,T,S=[];for(b=(t=x(t)).length,e=h,n=0,i=g,a=0;a<b;++a)(y=t[a])<128&&S.push(C(y));for(r=o=S.length,o&&S.push(m);r<b;){for(u=s,a=0;a<b;++a)(y=t[a])>=e&&y<u&&(u=y);for(u-e>O((s-n)/(_=r+1))&&L("overflow"),n+=(u-e)*_,e=u,a=0;a<b;++a)if((y=t[a])<e&&++n>s&&L("overflow"),y==e){for(d=n,p=l;!(d<(v=p<=i?c:p>=i+f?f:p-i));p+=l)T=d-v,w=l-v,S.push(C(I(v+T%w,0))),d=O(T/w);S.push(C(I(d,0))),i=A(n,_,r==o),n=0,++r}++n,++e}return S.join("")}u={version:"1.4.1",ucs2:{decode:x,encode:E},decode:P,encode:D,toASCII:function(t){return S(t,function(t){return y.test(t)?"xn--"+D(t):t})},toUnicode:function(t){return S(t,function(t){return v.test(t)?P(t.slice(4).toLowerCase()):t})}},void 0===(o=function(){return u}.call(e,n,e,t))||(t.exports=o)}()}).call(this,n(9)(t),n(3))},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=e.selectorTypes,r=void 0===n?["ID","Class","Tag","NthChild"]:n,o=e.attributesToIgnore,i=void 0===o?["id","class","length"]:o,a=[],u=(0,c.getParents)(t),s=!0,f=!1,d=void 0;try{for(var p,h=u[Symbol.iterator]();!(s=(p=h.next()).done);s=!0){var m=g(p.value,r,i);Boolean(m)&&a.push(m)}}catch(t){f=!0,d=t}finally{try{!s&&h.return&&h.return()}finally{if(f)throw d}}var v=[],y=!0,b=!1,_=void 0;try{for(var w,O=a[Symbol.iterator]();!(y=(w=O.next()).done);y=!0){var C=w.value;v.unshift(C);var L=v.join(" > ");if((0,l.isUnique)(t,L))return L}}catch(t){b=!0,_=t}finally{try{!y&&O.return&&O.return()}finally{if(b)throw _}}return null};var r=n(46),o=n(47),i=n(48),a=n(49),u=n(50),s=n(51),l=n(52),c=n(53);function f(t,e){var n=t.parentNode.querySelectorAll(e);return 1===n.length&&n[0]===t}function d(t,e){return e.find(f.bind(null,t))}function p(t,e,n){var r=(0,i.getCombinations)(e,3),o=d(t,r);return Boolean(o)?o:Boolean(n)&&(o=d(t,r=r.map(function(t){return n+t})),Boolean(o))?o:null}function g(t,e,n){var i=void 0,l=function(t,e,n){var i={Tag:s.getTag,NthChild:u.getNthChild,Attributes:function(t){return(0,a.getAttributes)(t,n)},Class:o.getClassSelectors,ID:r.getID};return e.reduce(function(e,n){return e[n]=i[n](t),e},{})}(t,e,n),c=!0,d=!1,g=void 0;try{for(var h,m=e[Symbol.iterator]();!(c=(h=m.next()).done);c=!0){var v=h.value,y=l.ID,b=l.Tag,_=l.Class,w=l.Attributes,O=l.NthChild;switch(v){case"ID":if(Boolean(y)&&f(t,y))return y;break;case"Tag":if(Boolean(b)&&f(t,b))return b;break;case"Class":if(Boolean(_)&&_.length&&(i=p(t,_,b)))return i;break;case"Attributes":if(Boolean(w)&&w.length&&(i=p(t,w,b)))return i;break;case"NthChild":if(Boolean(O))return O}}}catch(t){d=!0,g=t}finally{try{!c&&m.return&&m.return()}finally{if(d)throw g}}return"*"}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.getID=function(t){var e=t.getAttribute("id");return null===e||""===e||e.match(/^wovn/)?null:"#"+e}},function(t,e,n){"use strict";function r(t){if(!t.hasAttribute("class"))return[];try{var e=Array.prototype.slice.call(t.classList);return(e=e.filter(function(t){return/^wovn/.test(t)?null:t})).filter(function(t){return/^[a-z_-][a-z\d_-]*$/i.test(t)?t:null})}catch(e){var n=t.getAttribute("class");return(n=n.trim().replace(/\s+/g," ")).split(" ")}}Object.defineProperty(e,"__esModule",{value:!0}),e.getClasses=r,e.getClassSelectors=function(t){return r(t).filter(Boolean).map(function(t){return"."+t})}},function(t,e,n){"use strict";function r(t,e,n,o,i,a,u){if(a!==u)for(var s=o;s<=i&&i-s+1>=u-a;++s)n[a]=e[s],r(t,e,n,s+1,i,a+1,u);else t.push(n.slice(0,a).join(""))}Object.defineProperty(e,"__esModule",{value:!0}),e.getCombinations=function(t,e){for(var n=[],o=t.length,i=[],a=1;a<=e;++a)r(n,t,i,0,o-1,0,a);return n}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.getAttributes=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:["id","class","length"],n=t.attributes;return[].concat(function(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return Array.from(t)}(n)).reduce(function(t,n){return e.indexOf(n.nodeName)>-1||t.push("["+n.nodeName+'="'+n.value+'"]'),t},[])}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.getNthChild=function(t){var e=0,n=void 0,o=void 0,i=t.parentNode;if(Boolean(i)){var a=i.childNodes,u=a.length;for(n=0;n<u;n++)if(o=a[n],(0,r.isElement)(o)&&(e++,o===t))return":nth-child("+e+")"}return null};var r=n(25)},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.getTag=function(t){return t.tagName.toLowerCase().replace(/:/g,"\\:")}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.isUnique=function(t,e){if(!Boolean(e))return!1;var n=t.ownerDocument.querySelectorAll(e);return 1===n.length&&n[0]===t}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.getParents=function(t){for(var e=[],n=t;(0,r.isElement)(n);)e.push(n),n=n.parentNode;return e};var r=n(25)},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),o=n(21),i=n(7),a=n(29),u=n(4),s=null,l=null,c=!1,f=null,d=[" \f\n\r\t\v   - \u2028\u2029  　\ufeff","0123456789","!\"#$%&'()*+,\\-ー./\\:;<=>?@\\[\\]^_`{|}~"].reduce(function(t,e){for(var n=0;n<e.length;++n)t[e[n]]=!0;return t},{}),p=function(){function t(){this.convertedCodes=null,this.init()}return t.prototype.init=function(){s=null,l=null,c=!1,f=null,this.langHash=r.default.c("RailsBridge").langHash,this.langCodeAliases=this.getLangCodeAliases(),this.currentLangOfWidgetTag=r.default.getBackendCurrentLang()},t.prototype.getLangCodeAliases=function(){var t=r.default.tag.getAttribute("langCodeAliases"),e=""!==t?u.default.parseJSON(t):{};for(var n in e)e.hasOwnProperty(n)&&(this.langHash[n]&&""!==e[n]||delete e[n]);return e},t.prototype.get=function(t){if(t.code&&(t=t.code),"string"!=typeof t)return null;for(var e in t=t.toLowerCase(),this.langHash)if(this.langHash.hasOwnProperty(e)&&(t===this.langHash[e].name.toLowerCase()||t===this.langHash[e].code.toLowerCase()||t===this.langHash[e].en.toLowerCase()))return this.langHash[e];for(var e in this.langCodeAliases)if(this.langCodeAliases.hasOwnProperty(e)&&t===this.langCodeAliases[e].toLowerCase())return this.langHash[e];return null},t.prototype.iso6391Normalization=function(t){return t.replace(/zh-CHT/i,"zh-Hant").replace(/zh-CHS/i,"zh-Hans")},t.prototype.getCode=function(t){var e=this.get(t);return e&&e.code},t.prototype.getCodes=function(){var t=[];for(var e in this.langHash)this.langHash.hasOwnProperty(e)&&t.push(e);return t},t.prototype.isCode=function(t){return this.langHash.hasOwnProperty(t)},t.prototype.isAlias=function(t){for(var e in this.langCodeAliases)if(this.langCodeAliases.hasOwnProperty(e)&&t===this.langCodeAliases[e])return!0;return!1},t.prototype.hasAlias=function(t){return Boolean(this.langCodeAliases[t])},t.prototype.isCaseInsensitiveCode=function(t){for(var e in this.langHash)if(this.langHash.hasOwnProperty(e)&&t.toLowerCase()===e.toLowerCase())return!0;return!1},t.prototype.isCaseInsensitiveAlias=function(t){for(var e in this.langCodeAliases)if(this.langCodeAliases.hasOwnProperty(e)&&t.toLowerCase()===this.langCodeAliases[e].toLowerCase())return!0;return!1},t.prototype.setDefaultCodeAndRecomputeSecondaryCode=function(t){s=t,l=this.computeSecondaryCode()},t.prototype.getDefaultCodeIfExists=function(){return s||(s=(s=r.default.tag.getAttribute("backend")&&r.default.tag.getAttribute("defaultLang"))||i.default.getLang()),s},t.prototype.getSecondaryCode=function(){return null===l&&(l=this.computeSecondaryCode()),l},t.prototype.computeSecondaryCode=function(){var t=i.default.getSecondaryLang(),e=i.default.getTranslatableLangs();return t&&-1!==u.default.indexOf(e,t)||(t=this.getDefaultCodeIfExists()),t},t.prototype.missingAutoTranslateLangs=function(){var t=i.default.getTranslatableLangs(),e=i.default.getAutoTranslateLangs();return u.default.setComplement(e,t).length>0},t.prototype.missingAutoPublishLangs=function(){var t=i.default.getTranslatableLangs(),e=i.default.getAutoPublishLangs();return u.default.setComplement(e,t).length>0},t.prototype.isNeedChangeUrlForSetDocLang=function(t){if(i.default.hasNoAutomaticRedirection())return!1;var e=i.default.getOptions().lang_path;return("query"===e||"path"===e||r.default.isBackend()&&r.default.tag.getAttribute("urlPattern")&&(!o.default.isCrawler()||o.default.isCrawler&&!i.default.getOptions().prevent_bot_redirection))&&r.default.c("Url").getLangCode()!==t},t.prototype.isNeedChangeUrlForSetDocLangWithoutSwap=function(t){if(i.default.hasNoAutomaticRedirection())return!1;var e=i.default.getOptions().lang_path;return("query"===e||"path"===e||r.default.isBackend()&&r.default.tag.getAttribute("urlPattern"))&&r.default.c("Url").getLangCode()!==t},t.prototype.setDocLang=function(t){var e=this.getCurrentLang();if(e){t=t||this.getDocLang();var n=i.default.getTranslatableLangs();!1!==u.default.includes(n,t)&&(i.default.hasPublishedLang()&&this.setHtmlLangAttribute(t),this.isNeedChangeUrlForSetDocLang(t)&&r.default.c("Url").changeUrl(t),i.default.hasPublishedLang()&&a.default.set(t),this.shouldSwapVals(e,t)&&r.default.c("DomAuditor").supervisedSwapVals(t),f=t,e!==t&&setTimeout(function(){r.default.c("Api").dispatchLangChangedEvent()},0),r.default.c("OnDemandTranslator").clearOdtResults(),c=!0)}},t.prototype.setHtmlLangAttribute=function(t){document.getElementsByTagName("html")[0].setAttribute("lang",this.iso6391Normalization(t))},t.prototype.getCurrentLang=function(){return c?this.getDocLang():this.getDefaultCodeIfExists()},t.prototype.shouldSwapVals=function(t,e){return t===e||t!==e&&!i.default.hasDomainPrecacheFeature()},t.prototype.setDocLangWithoutSwap=function(t){var e=this.getCurrentLang();if(e){t=t||this.getDocLang();var n=i.default.getTranslatableLangs();!1!==u.default.includes(n,t)&&(i.default.hasPublishedLang()&&this.setHtmlLangAttribute(t),this.isNeedChangeUrlForSetDocLangWithoutSwap(t)&&r.default.c("Url").changeUrl(t),i.default.hasPublishedLang()&&a.default.set(t),f=t,e!==t&&setTimeout(function(){r.default.c("Api").dispatchLangChangedEvent()},0),c=!0)}},t.prototype.isValidLangCode=function(t){if(null===t)return!1;if(t===this.getDefaultCodeIfExists())return!0;if(!this.convertedCodes){this.convertedCodes={};for(var e=i.default.getConvertedLangs(),n=0;n<e.length;n++)this.convertedCodes[e[n].code]=!0}return this.convertedCodes[t]||!1},t.prototype.getActualLang=function(){return c?this.getDocLang():r.default.isBackend()&&this.isValidLangCode(this.currentLangOfWidgetTag)?this.currentLangOfWidgetTag:this.getDefaultCodeIfExists()},t.prototype._getDocLang=function(){var t=this.getDefaultCodeIfExists(),e=this.getSecondaryCode();if(o.default.isDataHighlighter())return r.default.isBackend()?(f=r.default.c("Url").getLangCode(),this.isValidLangCode(f)||(f=t)):f=t,f;if(r.default.tag.getAttribute("backend")){if(r.default.c("Data").hasNoAutomaticRedirection()){if(!r.default.c("Data").hasIgnoreBrowserLang()&&!a.default.get()&&this.isValidLangCode(n))return f=this.getBrowserLang();var n=r.default.getBackendCurrentLang();return f=n}if(!r.default.c("Data").hasIgnoreBrowserLang()&&!a.default.get()){var i=this.getBrowserLang();if(this.isValidLangCode(i))return f=i}return f=(n=r.default.getBackendCurrentLang())!==t&&this.isValidLangCode(n)?n:e}var u=r.default.c("Url").getLangCode();if(t!==u&&this.isValidLangCode(u)&&(f=u),!f){var s=a.default.get();this.isValidLangCode(s)&&(f=s)}return f||(i=this.getBrowserLang(),this.isValidLangCode(i)&&(f=i)),f||(f=e),f},t.prototype.getDocLang=function(){return f||this._getDocLang()},t.prototype.getBrowserLang=function(){var t=window.navigator.languages&&window.navigator.languages[0]||window.navigator.language||window.navigator.userLanguage||window.navigator.browserLanguage;return this.browserLangCodeToWidgetLangCode(t)},t.prototype.browserLangCodeToWidgetLangCode=function(t){var e=this.getCodes(),n=null;switch(t.toLowerCase()){case"zh-tw":n="zh-CHT";break;case"zh-cn":case"zh":n="zh-CHS";break;case"iw":n="he";break;default:n=t}if(n)for(var r=0;r<e.length;r++){if(e[r]===n)return e[r];var o=new RegExp("^"+e[r],"i");if(n.match(o))return e[r]}return null},t.prototype.getLangIdentifier=function(t){return r.default.isBackend()&&this.langCodeAliases[t]||this.getCode(t)},t.prototype.getBackendLangIdentifier=function(){var t=f||r.default.getBackendCurrentLang();return this.getLangIdentifier(t)},t.prototype.isKoreanText=function(t){if(t){for(var e=0,n=0,r=0;r<t.length;++r){var o=t[r],i=t.charCodeAt(r);i>=44032&&i<=55203?e+=1:d[o]&&(n+=1)}if(n<t.length)return e/(t.length-n)>=.9}return!1},t.prototype.defaultLangAlias=function(){return this.langCodeAliases[r.default.getBackendDefaultLang()]},t}();e.default=p},function(t,e,n){!function(){var e=n(56),r=n(27).utf8,o=n(57),i=n(27).bin,a=function(t,n){t.constructor==String?t=n&&"binary"===n.encoding?i.stringToBytes(t):r.stringToBytes(t):o(t)?t=Array.prototype.slice.call(t,0):Array.isArray(t)||(t=t.toString());for(var u=e.bytesToWords(t),s=8*t.length,l=1732584193,c=-271733879,f=-1732584194,d=271733878,p=0;p<u.length;p++)u[p]=16711935&(u[p]<<8|u[p]>>>24)|4278255360&(u[p]<<24|u[p]>>>8);u[s>>>5]|=128<<s%32,u[14+(s+64>>>9<<4)]=s;var g=a._ff,h=a._gg,m=a._hh,v=a._ii;for(p=0;p<u.length;p+=16){var y=l,b=c,_=f,w=d;c=v(c=v(c=v(c=v(c=m(c=m(c=m(c=m(c=h(c=h(c=h(c=h(c=g(c=g(c=g(c=g(c,f=g(f,d=g(d,l=g(l,c,f,d,u[p+0],7,-680876936),c,f,u[p+1],12,-389564586),l,c,u[p+2],17,606105819),d,l,u[p+3],22,-1044525330),f=g(f,d=g(d,l=g(l,c,f,d,u[p+4],7,-176418897),c,f,u[p+5],12,1200080426),l,c,u[p+6],17,-1473231341),d,l,u[p+7],22,-45705983),f=g(f,d=g(d,l=g(l,c,f,d,u[p+8],7,1770035416),c,f,u[p+9],12,-1958414417),l,c,u[p+10],17,-42063),d,l,u[p+11],22,-1990404162),f=g(f,d=g(d,l=g(l,c,f,d,u[p+12],7,1804603682),c,f,u[p+13],12,-40341101),l,c,u[p+14],17,-1502002290),d,l,u[p+15],22,1236535329),f=h(f,d=h(d,l=h(l,c,f,d,u[p+1],5,-165796510),c,f,u[p+6],9,-1069501632),l,c,u[p+11],14,643717713),d,l,u[p+0],20,-373897302),f=h(f,d=h(d,l=h(l,c,f,d,u[p+5],5,-701558691),c,f,u[p+10],9,38016083),l,c,u[p+15],14,-660478335),d,l,u[p+4],20,-405537848),f=h(f,d=h(d,l=h(l,c,f,d,u[p+9],5,568446438),c,f,u[p+14],9,-1019803690),l,c,u[p+3],14,-187363961),d,l,u[p+8],20,1163531501),f=h(f,d=h(d,l=h(l,c,f,d,u[p+13],5,-1444681467),c,f,u[p+2],9,-51403784),l,c,u[p+7],14,1735328473),d,l,u[p+12],20,-1926607734),f=m(f,d=m(d,l=m(l,c,f,d,u[p+5],4,-378558),c,f,u[p+8],11,-2022574463),l,c,u[p+11],16,1839030562),d,l,u[p+14],23,-35309556),f=m(f,d=m(d,l=m(l,c,f,d,u[p+1],4,-1530992060),c,f,u[p+4],11,1272893353),l,c,u[p+7],16,-155497632),d,l,u[p+10],23,-1094730640),f=m(f,d=m(d,l=m(l,c,f,d,u[p+13],4,681279174),c,f,u[p+0],11,-358537222),l,c,u[p+3],16,-722521979),d,l,u[p+6],23,76029189),f=m(f,d=m(d,l=m(l,c,f,d,u[p+9],4,-640364487),c,f,u[p+12],11,-421815835),l,c,u[p+15],16,530742520),d,l,u[p+2],23,-995338651),f=v(f,d=v(d,l=v(l,c,f,d,u[p+0],6,-198630844),c,f,u[p+7],10,1126891415),l,c,u[p+14],15,-1416354905),d,l,u[p+5],21,-57434055),f=v(f,d=v(d,l=v(l,c,f,d,u[p+12],6,1700485571),c,f,u[p+3],10,-1894986606),l,c,u[p+10],15,-1051523),d,l,u[p+1],21,-2054922799),f=v(f,d=v(d,l=v(l,c,f,d,u[p+8],6,1873313359),c,f,u[p+15],10,-30611744),l,c,u[p+6],15,-1560198380),d,l,u[p+13],21,1309151649),f=v(f,d=v(d,l=v(l,c,f,d,u[p+4],6,-145523070),c,f,u[p+11],10,-1120210379),l,c,u[p+2],15,718787259),d,l,u[p+9],21,-343485551),l=l+y>>>0,c=c+b>>>0,f=f+_>>>0,d=d+w>>>0}return e.endian([l,c,f,d])};a._ff=function(t,e,n,r,o,i,a){var u=t+(e&n|~e&r)+(o>>>0)+a;return(u<<i|u>>>32-i)+e},a._gg=function(t,e,n,r,o,i,a){var u=t+(e&r|n&~r)+(o>>>0)+a;return(u<<i|u>>>32-i)+e},a._hh=function(t,e,n,r,o,i,a){var u=t+(e^n^r)+(o>>>0)+a;return(u<<i|u>>>32-i)+e},a._ii=function(t,e,n,r,o,i,a){var u=t+(n^(e|~r))+(o>>>0)+a;return(u<<i|u>>>32-i)+e},a._blocksize=16,a._digestsize=16,t.exports=function(t,n){if(null==t)throw new Error("Illegal argument "+t);var r=e.wordsToBytes(a(t,n));return n&&n.asBytes?r:n&&n.asString?i.bytesToString(r):e.bytesToHex(r)}}()},function(t,e){!function(){var e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",n={rotl:function(t,e){return t<<e|t>>>32-e},rotr:function(t,e){return t<<32-e|t>>>e},endian:function(t){if(t.constructor==Number)return 16711935&n.rotl(t,8)|4278255360&n.rotl(t,24);for(var e=0;e<t.length;e++)t[e]=n.endian(t[e]);return t},randomBytes:function(t){for(var e=[];t>0;t--)e.push(Math.floor(256*Math.random()));return e},bytesToWords:function(t){for(var e=[],n=0,r=0;n<t.length;n++,r+=8)e[r>>>5]|=t[n]<<24-r%32;return e},wordsToBytes:function(t){for(var e=[],n=0;n<32*t.length;n+=8)e.push(t[n>>>5]>>>24-n%32&255);return e},bytesToHex:function(t){for(var e=[],n=0;n<t.length;n++)e.push((t[n]>>>4).toString(16)),e.push((15&t[n]).toString(16));return e.join("")},hexToBytes:function(t){for(var e=[],n=0;n<t.length;n+=2)e.push(parseInt(t.substr(n,2),16));return e},bytesToBase64:function(t){for(var n=[],r=0;r<t.length;r+=3)for(var o=t[r]<<16|t[r+1]<<8|t[r+2],i=0;i<4;i++)8*r+6*i<=8*t.length?n.push(e.charAt(o>>>6*(3-i)&63)):n.push("=");return n.join("")},base64ToBytes:function(t){t=t.replace(/[^A-Z0-9+\/]/gi,"");for(var n=[],r=0,o=0;r<t.length;o=++r%4)0!=o&&n.push((e.indexOf(t.charAt(r-1))&Math.pow(2,-2*o+8)-1)<<2*o|e.indexOf(t.charAt(r))>>>6-2*o);return n}};t.exports=n}()},function(t,e){function n(t){return!!t.constructor&&"function"==typeof t.constructor.isBuffer&&t.constructor.isBuffer(t)}
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */t.exports=function(t){return null!=t&&(n(t)||function(t){return"function"==typeof t.readFloatLE&&"function"==typeof t.slice&&n(t.slice(0,0))}(t)||!!t._isBuffer)}},function(t,e,n){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
t.exports=function(){var t,e=[],n=document,r=(n.documentElement.doScroll?/^loaded|^c/:/^loaded|^i|^c/).test(n.readyState);return r||n.addEventListener("DOMContentLoaded",t=function(){for(n.removeEventListener("DOMContentLoaded",t),r=1;t=e.shift();)t()}),function(t){r?setTimeout(t,0):e.push(t)}}()},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),o=n(4),i=function(){function t(){this.init()}return t.prototype.init=function(){this._customDomainLanguages=this._deserializeCustomDomainLangs(),this._defaultLanguage=r.default.c("Lang").getDefaultCodeIfExists(),this._defaultLanguageCustomDomain=this._findCustomDomainWithLanguage(this._defaultLanguage)},t.prototype.findCustomDomainLanguage=function(t){var e=r.default.c("Url").getLocation(t),n=this._findCustomDomain(e.hostname);return this._customDomainLanguages[n]},t.prototype.removeLanguageFromAbsoluteUrl=function(t,e){var n=this._findCustomDomainWithLanguage(e);return n&&this._defaultLanguageCustomDomain?this._replaceCaseInsensitive(t,n,this._defaultLanguageCustomDomain):t},t.prototype.removeLanguageFromUrlHost=function(t,e){var n=this._findCustomDomainWithLanguage(e);return n&&this._defaultLanguageCustomDomain?this._replaceCaseInsensitive(t,n,this._defaultLanguageCustomDomain):t},t.prototype.addLanguageToAbsoluteUrl=function(t,e){var n=r.default.c("Url").getLocation(t),o=this._findCustomDomain(n.hostname),i=this._findCustomDomainWithLanguage(e);return o&&i?this._replaceCaseInsensitive(t,o,i):t},t.prototype._replaceCaseInsensitive=function(t,e,n){return t.replace(new RegExp(e,"i"),n)},t.prototype._findCustomDomain=function(t){return Object.keys(this._customDomainLanguages).filter(function(e){return t.toLowerCase()==e.toLowerCase()})[0]},t.prototype._findCustomDomainWithLanguage=function(t){var e=this;return Object.keys(this._customDomainLanguages).filter(function(n){return e._customDomainLanguages[n]===t})[0]},t.prototype._deserializeCustomDomainLangs=function(){var t=r.default.tag.getAttribute("custom_domain_langs");return""!==t?o.default.parseJSON(t):{}},t}();e.default=i},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(61),o=function(){function t(){}return t.prototype.create=function(t,e,n,o,i){return new r.default(t,e,n,o,i)},t}();e.default=o},function(t,e,n){"use strict";var r=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])};return function(e,n){function r(){this.constructor=e}t(e,n),e.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=function(t){function e(e,n,r,o,i){var a=t.call(this,e,n,o)||this;return a.isOpen=r,a.ignore=i,a}return r(e,t),Object.defineProperty(e.prototype,"isIgnored",{get:function(){return this.ignore},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isText",{get:function(){return!1},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"escapedSrc",{get:function(){return null},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"src",{get:function(){return this.label},enumerable:!0,configurable:!0}),e}(n(31).default);e.default=o},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(63),o=function(){function t(){}return t.prototype.create=function(t,e,n,o,i,a,u){return new r.default(t,e,n,o,i,a,u)},t}();e.default=o},function(t,e,n){"use strict";var r=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])};return function(e,n){function r(){this.constructor=e}t(e,n),e.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(e,"__esModule",{value:!0});var o=n(31),i={"'":"&#39;","&":"&amp;",'"':"&quot;","<":"&lt;",">":"&gt;"},a=new RegExp("["+Object.keys(i).join("")+"]","g"),u=function(t){function e(e,n,r,o,i,a,u){var s=t.call(this,e,n,!1)||this;return s.text=r,s.original=o,s.nodes=i,s.lookahead=a,s.skipCount=u,s}return r(e,t),Object.defineProperty(e.prototype,"isText",{get:function(){return!0},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"isIgnored",{get:function(){return!1},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"escapedSrc",{get:function(){return this.htmlEscapeText(this.label).replace(/\u200b/g,"")},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"src",{get:function(){return this.escapedSrc},enumerable:!0,configurable:!0}),e.prototype.htmlEscapeText=function(t){return t.replace(a,function(t){return i[t]})},e}(o.default);e.default=u},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(65),o=function(){function t(){}return t.prototype.create=function(t,e){return new r.default(t,e)},t}();e.default=o},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(t,e){this.headPath=t,this.index=e,this.fragments=[]}return Object.defineProperty(t.prototype,"path",{get:function(){if(this.headPath.match(/title$/))return this.headPath;var t=this.headPath+"/text()";return 1===this.index?t:t+"["+this.index+"]"},enumerable:!0,configurable:!0}),t.prototype.add=function(t){0===this.fragments.length&&t.isClose||this.fragments.push(t)},Object.defineProperty(t.prototype,"src",{get:function(){return this.removeWovnIgnore(this.fragments).map(function(t){return t.src}).join("")},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"lastFragment",{get:function(){return this.fragments[this.fragments.length-1]},enumerable:!0,configurable:!0}),t.prototype.isComplex=function(){return this.fragments.length>1},t.prototype.removeWovnIgnore=function(t){for(var e=[],n=0;n<t.length;++n){var r=t[n];if(r.isIgnored){for(e.push(r),++n;n<t.length;++n)if(!(r=t[n]).isText){e.push(r);break}}else e.push(r)}return e},t.prototype.hasText=function(){for(var t=0,e=this.fragments;t<e.length;t++)if(e[t].isText)return!0;return!1},t.prototype.buildNextStack=function(){return new t(this.headPath,this.index+1)},t}();e.default=r},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(67),o=function(){function t(){}return t.prototype.create=function(t,e){return new r.default(t,e)},t}();e.default=o},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(t,e){this.xpath=t,this.element=e}return t.prototype.hasAttribute=function(t){return this.element.hasAttribute(t)},t.prototype.getAttribute=function(t){return this.element.getAttribute(t)},t.prototype.setAttribute=function(t,e){this.element.setAttribute(t,e)},Object.defineProperty(t.prototype,"nodeName",{get:function(){return this.element.nodeName},enumerable:!0,configurable:!0}),t}();e.default=r},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(26),o=function(){function t(){}return t.prototype.loadFromStore=function(){return r.default.loadFromStore()},t.prototype.onlyShowLangs=function(t){r.default.onlyShowLangs(t)},t.prototype.create=function(t,e,n,o){return new r.default(t,e,n,o)},t.prototype.clearData=function(){r.default.clearData()},t}();e.default=o},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(7),o=function(){function t(){}return t.prototype.load=function(){this.insertTag(r.default.getPageCss(),r.default.get().widgetOptions.domain_css,"css"),r.default.get().widgetOptions.js_customization&&this.insertTag(r.default.getPageJs(),r.default.get().widgetOptions.domain_js,"js")},t.prototype.insertTag=function(t,e,n){var r=document.head||document.body,o=document.getElementById("wovn-page-"+n),i=document.getElementById("wovn-domain-"+n);o&&r.removeChild(o),i&&r.removeChild(i);var a="js"===n?"script":"style",u=document.createElement(a),s=document.createElement(a);u.setAttribute("id","wovn-page-"+n),s.setAttribute("id","wovn-domain-"+n),u.appendChild(document.createTextNode(t)),s.appendChild(document.createTextNode(e)),r.appendChild(s),r.appendChild(u)},t.prototype.insertJsOnce=function(t,e){document.getElementById("wovn-page-js")||document.getElementById("wovn-domain-js")||this.insertTag(t,e,"js")},t}();e.default=o},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),o=n(33),i=n(71),a=n(34);e.default={go:function(t,e,n,u){if("function"==typeof e&&"function"==typeof n&&"function"==typeof u){var s,l,c={head:document.head||document.getElementsByTagName("head")[0],limit:-1,filter:function(t){return t.nodeName.toLowerCase().match(/script|noscript|style/)},target:function(t){return"#comment"!==t.nodeName}};if(t.hasOwnProperty("head")&&t.head&&(l=t.head,(s=o.default.getXpath(l))&&(s="#text"===l.nodeName?s.replace(/\/text\(\)$/,""):s.replace(new RegExp("/"+l.nodeName.toLowerCase()+"$"),""))),s||(l=c.head,s="/html"),t.hasOwnProperty("headXPath")&&"string"==typeof t.headParentXpath||(t.headParentXpath=c.headParentXpath),t.hasOwnProperty("limit")&&"number"==typeof t.limit?t.limit=Math.floor(t.limit):t.limit=c.limit,0!==t.limit){if(t.hasOwnProperty("filter")?"function"==typeof t.filter||("object"==typeof t.filter&&t.filter.nodeName?t.filter=function(t){return function(e){return e.nodeName.toLowerCase().match(/script|noscript|style/)||e.nodeName.toLowerCase()===t}}(t.filter.nodeName.toLowerCase()):"string"==typeof t.filter?t.filter=function(t){return function(e){return e.nodeName.toLowerCase().match(/script|noscript|style/)||e.nodeName.toLowerCase()===t}}(t.filter.toLowerCase()):t.filter=c.filter):t.filter=c.filter,t.hasOwnProperty("target")&&"function"!=typeof t.target)if("object"==typeof t.target&&t.target.length){for(var f="",d=0;d<t.target.length;d++)f+=(t.target[d].nodeName||t.target[d])+"|";f="^("+f.substr(0,f.length-1)+")$";var p=new RegExp(f,"i");t.target=function(t){return function(e){return t.test(e.nodeName)}}(p)}else"object"==typeof t.target&&t.target.nodeName?t.target=function(t){return function(e){return e.nodeName.toLowerCase()===t}}(t.target.nodeName.toLowerCase()):"string"==typeof t.target?t.target=function(t){return function(e){return e.nodeName.toLowerCase()===t}}(t.target.toLowerCase()):t.target=c.target;else t.target=c.target;var g=t.attributes,h=(document.head||document.getElementsByTagName("head")[0]).parentElement;!function o(s,l,c){if(l){var f={};f[l.nodeName]=1;for(var d=l,p=l.nextSibling;p;){f[y=p.nodeName]=f[y]?f[y]+1:1,d=p,p=p.nextSibling}for(var m=!0,v=(l=d)&&l.previousSibling;m?m=!1:v=(l=v)&&l.previousSibling,l;){if(l===h)return;if(t.filter(l,s)||l.id&&(l.id===r.default.WIDGET_ID||l.id===r.default.BUILT_IN_WIDGET_ID))u(l,s),S(f,l.nodeName);else{var y,b=!1,_=c||i.default.isIdentifiableThirdPartyNode(l),w=void 0;if("#text"===(y=l.nodeName)){if(/^\s+$/.test(l.nodeValue)){S(f,y);continue}w="text()"}else w=y.toLowerCase();var O=f[y]>1?"["+f[y]+"]":"",C=s+"/"+w+O;if(t.target(l,C)&&0!==t.limit&&(b=e(l,C,_,t),--t.limit),n(l,C,_),0===t.limit)return;if(l.hasChildNodes()&&!b&&o(C,l.firstChild,_),"IFRAME"===y){var L=null;try{L=l.contentDocument}catch(t){}L&&o("",L.firstChild,_)}if(a.default.bindOdtClickEvent(l),g&&l.hasAttribute)for(var T in g)if(l.hasAttribute(T)&&0!==t.limit){C=s+"/"+l.nodeName+"[@"+T+"]"+O;g[T](l,C),--t.limit}S(f,y)}}}function S(t,e){t[e]--}}(s,l,!!l.parent&&i.default.isIdentifiableThirdPartyNode(l.parent))}}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=[new o("DIV","id","intercom-container"),new o("IFRAME","id","intercom-frame"),new o("DIV","class","gm-style"),new o("IFRAME","id","pop-veritrans")];function o(t,e,n){this.name=t,this.attr=e,this.val=n,this.matchesElement=function(t){return(!this.name||t.nodeName===this.name)&&t.getAttribute(this.attr)===this.val}}e.default={isIdentifiableThirdPartyNode:function(t){if(t&&1==t.nodeType)for(var e=0;e<r.length;++e)if(r[e].matchesElement(t))return!0;return!1}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),o=n(73),i={},a=[],u=function(){function t(){}return t.prototype.fuzzyMatch=function(t,e){var n=this,o=Object.keys(t),i=r.default.c("ValueStore").getNewDetectedValueSet();return Object.keys(i).forEach(function(e){var r=n._findBestMatch(e,o);if(n._shouldSwap(r.distanceFromSrc,e)&&t[r.valueToSwap]){var i={existSrc:r.valueToSwap,similarSrc:e,xpath:t[r.valueToSwap].path};!a.some(function(t){return t.similarSrc===i.similarSrc})&&a.push(i)}}),a},t.prototype.getServerFormattedFuzzyMatches=function(){return a.map(function(t){return{exist_src:t.existSrc,similar_src:t.similarSrc,xpath:t.xpath}})},t.prototype._findBestMatch=function(t,e){var n=this;i[t]=void 0===i[t]?{}:i[t];var o,a=Number.MAX_VALUE,u="",s=r.default.c("Utils").decodeHTMLEntities(t);return e.forEach(function(t){var e=r.default.c("Utils").decodeHTMLEntities(t);n._isValueTooDifferentForFuzzyMatching(s,e)||(o=n._getEditDistanceFromCacheOrRecalculate(s,e))<a&&(a=o,u=t)}),{valueToSwap:u,distanceFromSrc:a}},t.prototype._getEditDistanceFromCacheOrRecalculate=function(t,e){if(i[t]&&i[t][e])return i[t][e];var n=o.get(t,e,{useCollator:!0});return i[t]||(i[t]={}),i[t][e]=n,n},t.prototype._isValueTooDifferentForFuzzyMatching=function(t,e){var n=.05*t.length,r=Math.abs(t.length-e.length);return r>n&&r>5},t.prototype._shouldSwap=function(t,e){return t/e.length<.05&&t<5},t}();e.default=new u},function(t,e,n){(function(t){var r;!function(){"use strict";var o;try{o="undefined"!=typeof Intl&&void 0!==Intl.Collator?Intl.Collator("generic",{sensitivity:"base"}):null}catch(t){console.log("Collator could not be initialized and wouldn't be used")}var i=[],a=[],u={get:function(t,e,n){var r,u,s,l,c,f,d=n&&o&&n.useCollator,p=t.length,g=e.length;if(0===p)return g;if(0===g)return p;for(s=0;s<g;++s)i[s]=s,a[s]=e.charCodeAt(s);if(i[g]=g,d)for(s=0;s<p;++s){for(u=s+1,l=0;l<g;++l)r=u,f=0===o.compare(t.charAt(s),String.fromCharCode(a[l])),(u=i[l]+(f?0:1))>(c=r+1)&&(u=c),u>(c=i[l+1]+1)&&(u=c),i[l]=r;i[l]=u}else for(s=0;s<p;++s){for(u=s+1,l=0;l<g;++l)r=u,f=t.charCodeAt(s)===a[l],(u=i[l]+(f?0:1))>(c=r+1)&&(u=c),u>(c=i[l+1]+1)&&(u=c),i[l]=r;i[l]=u}return u}};null!==n(74)&&n(75)?void 0===(r=function(){return u}.call(e,n,e,t))||(t.exports=r):null!==t&&void 0!==e&&t.exports===e?t.exports=u:"undefined"!=typeof self&&"function"==typeof self.postMessage&&"function"==typeof self.importScripts?self.Levenshtein=u:"undefined"!=typeof window&&null!==window&&(window.Levenshtein=u)}()}).call(this,n(9)(t))},function(t,e){t.exports=function(){throw new Error("define cannot be used indirect")}},function(t,e){(function(e){t.exports=e}).call(this,{})},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),o=n(4);function i(t,e){return new Promise(function(n,i){var a=function(t,e){return r.default.c("RailsBridge").apiHost+"domains/"+r.default.tag.getAttribute("key")+"/search?q="+encodeURIComponent(t)+"&lang="+encodeURIComponent(e)}(t,e);o.default.sendRequestAsJson("GET",a,function(t){n(t.results)},function(t){!function(t){if(t&&400<=t.status&&t.status<500)try{var e=JSON.parse(t.responseText);i(e.message||"Server error")}catch(t){return void i("Server error")}else i("Server error")}(t)})})}var a=function(){function t(){}return t.prototype.search=function(t,e,n,r){i(t,e).then(function(t){n(t)}).catch(function(t){r(t)})},t}();e.default=a},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(0);e.notFoundOccurrences=["404","не е намерена","未找到","未找到","ikke fundet","niet gevonden","not found","ei löydetty","pas trouvé","non trouvé","introuvable","nicht gefunden","δεν βρέθηκε","לא נמצא","नहीं मिला","tidak ditemukan","non trovato","見つかりません","찾을 수 없음","tidak ditemui","ikke funnet","nie znaleziono","não encontrado","не обнаружена","extraviado","no encontrada","hittades inte","ไม่พบ","bulunamadı","не знайдено","không tìm thấy"];var i=new RegExp("("+e.notFoundOccurrences.join("|")+")","i"),a=function(){function t(){this.supervised=null}return t.prototype.isSupervisedPage=function(){return null===this.supervised&&(this.supervised=document.documentElement.hasAttribute("wovn-supervised")),this.supervised},t.prototype.notifyWovnIfNotFound=function(){var t;(-1!==document.title.search(i)||(t=document.body.innerText)&&-1!==t.search(i))&&r.default.sendRequest("HEAD",window.location.href,null,function(){},function(t){404===t.status&&function(){var t=r.default.createXHR(),e=o.default.c("RailsBridge").apiHost.replace(/^.*\/\//,"//")+"page_not_found/"+o.default.tag.getAttribute("key");t.open("POST",e,!0),t.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),t.send("url="+o.default.c("Url").getEncodedLocation())}()})},t}();e.default=new a},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(){}return t.prototype.getUrlsFromCss=function(t){var e=[];return t.split(/,\s+/).forEach(function(t){var n=/^url\(["']?([^"']+?)["']?\)?$/.exec(t);n&&e.push(n[1])}),e},t}();e.default=r},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(22),o={page_request_start:null,page_response_end:null,wovn_js_request_start:null,wovn_js_response_end:null},i=function(){function t(){this.isMonitorable=!1,this.resetIsMonitorable()}return t.prototype.mark=function(t){if(0!=this.isMonitorable){var e="wovn_"+t;null!=o[e]&&null!=o[e]||(o[e]=(new Date).getTime())}},t.prototype.getResult=function(){if(0==this.isMonitorable)return{};for(var t=Object.keys(o),e={},n=0;n<t.length;n++){var r=t[n],i=r;new RegExp("wovn_").test(i)&&(i=i.substring("wovn_".length)),e[i]=o[r]}return e},t.prototype.resetIsMonitorable=function(){"true"===r.default.get("wovn_monitor_enable")?this.isMonitorable=!0:this.isMonitorable=!1},t}();e.default=new i},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(t){void 0===t&&(t=1e3),this.coolDownTime=t,this.workableId=0,this.isExecuting=!1,this.previousExecutedTime=null}return t.prototype.isCoolingDown=function(t){return this.previousExecutedTime&&this.previousExecutedTime+this.coolDownTime>t},t.prototype.executeSetTimeout=function(t,e,n,r,o){var i=this;return function(r,o){return setTimeout(function(){!function(n,r){n===i.workableId&&(i.isExecuting=!0,i.previousExecutedTime=null,t.apply(i,r),i.previousExecutedTime=(new Date).getTime(),i.isExecuting=!1,e())}(r,o)},n)}(r,o)},t.prototype.createSingleWorker=function(e){return void 0===e&&(e=1e3),new t(e)},t.prototype.setTimeout=function(t,e,n){var r=(new Date).getTime();if(!this.isExecuting){if(this.isCoolingDown(r)){var o=this.previousExecutedTime+this.coolDownTime;n=Math.max(o+100,n+r)-r}this.workableId=(this.workableId+1)%1e4;var i=Array.prototype.slice.call(arguments).slice(3);return this.executeSetTimeout(t,e,n,this.workableId,i)}},t}();e.default=new r},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(82),o=n(83),i=n(0),a={},u={createFromUrl:function(t){var e=function(t){var e=i.default.c("Url").getLangCode(t);return e?(a[t]||(a[t]={}),a[t][e]||(a[t][e]=o.default.getLocation(t)),a[t][e]):o.default.getLocation(t)}(t),n=o.default.getNormalizedHost(e),u=/^https?:\/\//.test(t),s=("/"!==e.pathname.charAt(0)?"/":"")+e.pathname;u&&/^https?:\/\/.[^\/]+$/.test(t)&&(s="");var l=new r.default(e.protocol,n,s,e.search,e.hash);if(!u)if(/^\//.test(t))l.setToShowUrlFromPath();else{var c=l.getOriginalUrl();l.setBaseIgnorePath(c.substr(0,c.indexOf(t)))}return l},create:function(t,e,n,o,i){return new r.default(t,e,n,o,i)}};e.default=u},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(32),o=n(35),i=n(0),a=function(){function t(t,e,n,r,o){this.protocol=t,this.host=e,this.pathname=n,this.search=r,this.hash=o,this.fromPath=!1,this.baseIgnorePath=null}return t.prototype.setShowFullUrl=function(){this.fromPath=!1,this.baseIgnorePath=null},t.prototype.setToShowUrlFromPath=function(){this.fromPath=!0},t.prototype.setBaseIgnorePath=function(t){this.baseIgnorePath=t},t.prototype.getOriginalUrl=function(){return this.createUrl(this.protocol,this.host,this.pathname,this.search,this.hash)},t.prototype.getNormalizedPageUrl=function(t,e){var n=this.getOriginalUrl();if(t){var o=i.default.c("Lang").getBackendLangIdentifier();switch(e){case"query":var a=this.search.replace(new RegExp("(\\?|&)wovn="+o+"(&|$)"),"$1").replace(/(\?|&)$/,"");n=this.createUrl(this.protocol,this.host,this.pathname,a,this.hash);break;case"subdomain":n=n.replace(new RegExp("//"+o+"\\.","i"),"//");break;case"custom_domain":n=i.default.c("CustomDomainLanguages").removeLanguageFromAbsoluteUrl(n,o);break;case"path":var u=r.default.getSitePrefixPath();if(u){var s=this.pathname.replace(new RegExp("^/("+u+")/"+o+"(/|$)","i"),"/$1$2");n=this.createUrl(this.protocol,this.host,s,this.search,this.hash)}else{s=this.pathname;var l=i.default.c("Lang").defaultLangAlias();s=l?this.pathname.replace(new RegExp("^(/)?"+o+"(/|$)","i"),"/"+l+"$2"):this.pathname.replace(new RegExp("^(/)?"+o+"(/|$)","i"),"$2"),n=this.createUrl(this.protocol,this.host,s,this.search,this.hash)}}}return n},t.prototype.getConvertedLangUrl=function(t,e,n){var o,a=this.getOriginalUrl(),u=i.default.c("Lang").getLangIdentifier(t),s=i.default.c("Lang").getLangIdentifier(e),l=i.default.c("Lang").getDefaultCodeIfExists();if(!l)return null;switch(n){case"query":o=(o=(o=e===l?a.replace(/([\?&])wovn=[^#&]*&?/,"$1"):a.match(/[\?&]wovn=[^&#]*/)?a.replace(/([\?&])wovn=[^&#]*/,"$1wovn="+s):a.match(/\?/)?a.replace(/\?/,"?wovn="+s+"&"):a.replace(/(#|$)/,"?wovn="+s+"$1")).replace(/&$/,"")).replace(/\?$/,"");break;case"custom_domain":o=i.default.c("CustomDomainLanguages").addLanguageToAbsoluteUrl(a,s);break;case"subdomain":o=e===l?a.replace(new RegExp("://"+u.toLowerCase()+"\\.","i"),"://"):t===l?a.replace(new RegExp("://","i"),"://"+s.toLowerCase()+"."):a.replace(new RegExp("://"+u.toLowerCase()+"\\.","i"),"://"+s.toLowerCase()+".");break;case"path":var c=function(t,e,n){if("path"!==t)return e;var o=i.default.c("Lang").getLangIdentifier(n),a=r.default.getSitePrefixPath();return a?e.replace(new RegExp("^(/"+a+")/"+o+"(/|$)"),"$1$2"):e.replace(new RegExp("^/"+o+"(/|$)"),"$1")}(n,this.pathname,t);c=function(t,e,n){var o=i.default.c("Lang").getDefaultCodeIfExists();if(!o)return null;if("path"!==t)return e;if(n===o&&!i.default.c("Lang").hasAlias(o))return e;var a=i.default.c("Lang").getLangIdentifier(n),u=r.default.getSitePrefixPath();return u?e.replace(new RegExp("^(/"+u+")(/|$)"),"$1/"+a+"$2"):"/"+a+e}(n,c,e),o=this.createUrl(this.protocol,this.host,c,this.search,this.hash);break;default:o=a}return o},t.prototype.createUrl=function(t,e,n,r,i){var a=t+"//"+e+n+r+i;return this.baseIgnorePath?a=o.default.startsWith(a,this.baseIgnorePath,0)?a.replace(this.baseIgnorePath,""):n+r+i:this.fromPath&&(a=n+r+i),a},t.prototype.extractHost=function(){return this.host},t}();e.default=a},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r={getLocation:function(t){var e=document.createElement("a");if(e.href=t,e.href=e.href,""===e.host){var n=window.location.protocol+"//"+window.location.host;if("/"===t.charAt(1))e.href=n+t;else{var r=("/"+e.pathname).match(/.*\//)[0];e.href=n+r+t}}return e},getNormalizedHost:function(t){var e=t.host;return"http:"===t.protocol&&/:80$/.test(e)?e=e.replace(/:80$/,""):"https:"===t.protocol&&/:443$/.test(e)&&(e=e.replace(/:443$/,"")),e}};e.default=r},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(2),o=n(4),i=n(0),a=function(){function t(){this.stallion=null,this.started=!1,this.messageHandler=this.onStallionMessage.bind(this),this.requestCallbacks={},this.lastMessageId=0}return t.prototype.start=function(){this.started=!0,o.default.onEvent(window.self,"message",this.messageHandler),this.startRPC()},t.prototype.stop=function(){this.started=!1,this.stallion=null,o.default.removeHandler(window.self,"message",this.messageHandler),this.stopRPC()},t.prototype.sendRequest=function(t,e,n,o){if(this.stallion){var i={method:t,path:e,data:n},a=++this.lastMessageId;return o&&(this.requestCallbacks[a]=o),this.stallion.postMessage({messageType:r.default.STALLION_MESSAGE_TYPES.request,messageId:a,request:i},"*"),!0}return!1},t.prototype.onStallionMessage=function(t){if(this.started)if(this.stallion||t.data.messageType!==r.default.STALLION_MESSAGE_TYPES.sync){if(t.data.messageType===r.default.STALLION_MESSAGE_TYPES.response){var e=t.data.messageId,n=this.requestCallbacks[e];n&&(n(t.data.response),delete this.requestCallbacks[e])}}else this.setStallionFromEvent(t),this.stallion&&document.dispatchEvent(new Event("wovnSessionReady"))},t.prototype.startRPC=function(){var t=document.createElement("IFRAME"),e=i.default.c("RailsBridge").cdnOriginHost.replace(/\/$/,""),n=i.default.tag.getAttribute("key");t.setAttribute("id",r.default.STALLION_IFRAME_ID),t.setAttribute("style","display: none"),t.setAttribute("src",e+"/widget/stallion_loader?token="+n),document.body.appendChild(t)},t.prototype.stopRPC=function(){var t=this.getStallionIframe();t&&t.remove()},t.prototype.setStallionFromEvent=function(t){this.stallion=t.source,this.stallion||("http://test-wovn.io/"===location.origin?this.stallion=window:this.stallion=this.getStallionIframe().contentWindow)},t.prototype.getStallionIframe=function(){return document.getElementById(r.default.STALLION_IFRAME_ID)},t}();e.default=new a},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(){}return t.prototype.init=function(){var t=document.createElement("script");t.async=!0,t.src="1-1.js"/*tpa=http://wap.wovn.io/1.js*/,document.getElementsByTagName("head")[0].appendChild(t)},t}();e.default=new r}]);



/** Starts initialization if there is not a wovn-ignore attribute in the <html> tag. */
function kickoffWidgetInit () {
  var htmlTag = document.getElementsByTagName('html')[0];
  if (!htmlTag || (htmlTag.getAttribute('wovn-ignore') === null))
    widget.c('Interface').start(function () {
      widget.c('SwapIntercom').start();
    });

  if (widget.hasWAP()) {
      widget.c('Wap').init();
  }
}

function kickoffLiveEditorInit () {
  var componentsToLoad = ['Vue', 'LiveEditorController', 'LiveEditorDecorator']
  var loadedComponents = {}
  var loadedCallbacks = {}

  function allComponentsLoaded () {
    return componentsToLoad.every(function (componentName) {
      return loadedComponents[componentName]
    })
  }

  function kickoffLiveEditor (event) {
    var componentName = event.type.replace(/Loaded$/, '')

    loadedComponents[componentName] = true

    if (allComponentsLoaded()) {
      widget.c('Api')
      widget.c('LiveEditorDecorator').start()

      if (isDev() && !loadedInsideIframe()) {
        var decorator = widget.c("LiveEditorDecorator")
        decorator.decoratePage()
      }
    }
  }

  for (var i = 0; i < componentsToLoad.length; ++i) {
    loadedCallbacks[componentsToLoad[i]] = kickoffLiveEditor
  }

  widget.loadComponents(componentsToLoad, loadedCallbacks)
}

function isDev() {
  var scripts = document.scripts
  return  Array.prototype.some.call(scripts, function(script) {
    return /j\.dev-wovn\.io/.test(script.src)
  })
}

function loadedInsideIframe() {
  return window.parent !== window
}

// remember the original URL so that potentially removed hash information are
// remembered for Live Edit purpose
widget.c('Url').saveOriginalHrefIfNeeded();

// If client application has turbolinks present rebuild widget on turbolinks page transitions
if (window.Turbolinks) {
  document.addEventListener("turbolinks:load", function (){
    widget.c('Interface').build()
  })
}

if (widget.c('Url').isIframeLiveEditor()) {
  kickoffLiveEditorInit();
} else if (widget.c('Agent').isWovnCrawler() && !widget.tag.getAttribute('wovnScrape')) {
  // don't execute widget.
  window.WOVN = null;
  document.WOVNIO = null;
  document.appendM17nJs = null;
}
else {
  kickoffWidgetInit();
}

}());
