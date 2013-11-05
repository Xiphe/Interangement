/*global jQuery, window */
(function($, window, undefined) {
  'use strict';

  /*
   ********** BRIDGE **********
   */

  /** @const */
  var _BRIDGE_DEFAULTS = {
    /* Should we add an option method? */
    addOption: true,
    /* Methods with this prefix will be returned. */
    returns: ['get', 'should', 'is']
    /* The validator is applied before instances are created, */
    // ,validator: function(options) {}
  };

  /**
   * Append a option method to our Plugin class.
   *
   * @param  {Function} Plugin
   * @return {void}
   */
  function _bridgeAddOptionMethod(Plugin) {
    Plugin.prototype.option = function(option, value) {
      var self = this;

      if (typeof option === 'string') {
        if (value !== undefined) {
          self.options[option] = value;
        } else {
          return self.options[option];
        }
      } else {
        self.options = $.extend({}, self.options, option);
      }
    };
  }

  /**
   * Check if the given method/argument combination is meant to get
   * the option value.
   *
   * @param  {String}  method
   * @param  {Array}   args
   * @return {Boolean}
   */
  var _isOptionGetter = function(method, args) {
    return (method === 'option' && args.length === 1 && typeof args[0] === 'string');
  };

  /**
   * Check if the scope starts with one of the given search strings.
   *
   * @param  {String|Array}  search
   * @return {Boolean}
   */
  var _startsWith = function(search) {
    /* Ensure search is an array */
    if (typeof search === 'string') {
      search = [search];
    }

    for (var i = 0, l = search.length; i < l; i++) {
      if (this.substring(0, search[i].length) === search[i]) {
        return true;
      }
    }

    return false;
  };

  /**
   * Wrapper for console.error
   * Check if console exists
   * Silently push into history
   * Wrap arguments in array for ie.
   *
   * @return {void}
   */
  var _error = function() {
    _error.history.push(arguments);

    if (!_error.silent && window.console) {
      window.console.error(Array.prototype.slice.call(arguments));
    }
  };
  _error.history = [];
  _error.silent = false;

  /**
   * Bridge with method and option support.
   *
   * Influenced by [query.isotope.js](https://github.com/desandro/isotope),
   *   [jQuery UI](https://github.com/jquery/jquery-ui) and
   *   [jcarousel](https://github.com/jsor/jcarousel)
   *
   * @param  {String}   pluginName    The name of our Plugin.
   * @param  {Function} Plugin        Our Plugin Class.
   * @param  {Object}   bridgeOptions optional options for our bridge, see BRIDGE_DEFAULTS
   * @return {void}
   */
  window.bridge = function(pluginName, Plugin, bridgeOptions) {
    bridgeOptions = $.extend({}, _BRIDGE_DEFAULTS, bridgeOptions);

    /* Apply an option method if requested */
    if (bridgeOptions.addOption) {
      _bridgeAddOptionMethod(Plugin);
    }

    $.fn[pluginName] = function(options) {
      var self = this,
          method = typeof options === 'string' ? options : false,
          namespace = 'plugin_' + pluginName,
          allArgs = arguments,
          args = Array.prototype.slice.call(arguments, 1),
          addOptionOpt = bridgeOptions.addOption,
          returnVars = [],
          returnMethodResult = false;

      /* Check if we want the methods return value or the jQuery element to be returned by the plugin. */
      if (method) {
        returnMethodResult = ((addOptionOpt && _isOptionGetter(method, args)) ||
            _startsWith.call(method, bridgeOptions.returns));
      }

      self.each(function() {
        var el = this,
            returned,
            instance = $.data(el, namespace);

        /* Check if we have a validator, apply it and stop here if it returns false */
        if (typeof bridgeOptions.validator === 'function' && !bridgeOptions.validator.apply(el, allArgs)) {
          return;
        }

        if (!instance) {
          /* Initialize a new instance */
          instance = new Plugin(el, (method ? {} : options));
          $.data(el, namespace, instance);
          if (!method) {
            return;
          }
        }

        if (!method) {
          if (addOptionOpt) {
            /* apply options & re-init */
            instance.option(options);
            instance._init();
          }
          return;
        } else {
          /* Check if method exists, and isn't protected. */
          if (typeof instance[method] !== 'function' || method.charAt(0) === '_') {
            _error('no such method "' + method + '" for ' + pluginName + ' instance');
            return;
          }

          /* Call the method. */
          returned = instance[method].apply(instance, args);
          if (returnMethodResult) {
            returnVars.push(returned);
          }
        }
      });

      /*
       * Return jQuery object for silent methods
       * a single value for calls on a single element
       * and an array of values for calls on multiple elements.
       */
      if (!returnMethodResult) {
        return self;
      } else if (returnVars.length <= 1) {
        return returnVars[0] || null;
      } else {
        return returnVars;
      }
    };
  };
})(jQuery, window);