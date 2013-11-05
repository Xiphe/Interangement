/*global jQuery, window, markdown, Vex */
(function($, window, markdown, undefined) {
  'use strict';

  /** @const */
  var MARKDOWN_DIALECT = 'Maruku';

  /** @const */
  var MAIN_HEADLINE_SELECTOR = 'h1,h2';

  /** @const */
  var SUB_HEADLINE_SELECTOR = 'h3,h4,h5,h6';

  /** @const */
  var VARIATIONS_SECTION = 'Variations';
  
  /** @const */
  var TABDIV_EL = '<div class="vex-tabdiv">';

  /** @const */
  var DELETE_FOR_TEXTHEADER = [
    'bpm'
  ];

  /** @const */
  var RENAME_FOR_TEXTHEADER = {
    'tonality': 'key'
  };

  /** @const */
  var DEFAULT_HEADER = {
    notation: true,
    tablature: false,
    tonality: 'C',
    bpm: 120,
    time: '4/4'
  };

  /** @const */
  var DEFAULT_VARIATIONS = {
    tablature: {
      notation: false,
      tablature: true
    },
    both: {
      notation: true,
      tablature: true
    },
    percussion: {
      tonality: 'C',
      clef: 'percussion'
    },
    bass: {
      clef: 'bass'
    }
  };

  /** @const */
  var DEFAULTS = {
    showEditors: window.location.hash.match(/edit/),
    getHeader: function() {
      return $(this).find(MAIN_HEADLINE_SELECTOR).first().nextUntil(MAIN_HEADLINE_SELECTOR).html();
    },
    getVariations: function() {
      var variations = {},
          $variations = $(this).find(MAIN_HEADLINE_SELECTOR)
              .filter(':contains(' + VARIATIONS_SECTION + ')')
              .first().nextUntil(MAIN_HEADLINE_SELECTOR);

      $variations.filter(SUB_HEADLINE_SELECTOR).each(function() {
        variations[$(this).text()] = $(this).nextUntil(SUB_HEADLINE_SELECTOR).html();
      });

      return variations;
    },
    vexOptions: {
      'width': 1000
    },
    header: DEFAULT_HEADER,
    variations: DEFAULT_VARIATIONS
  };

  /* **************** */
  /* HELPER FUNCTIONS */
  /* **************** */

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
   * Convert a textlist to json object.
   *  
   * @param  {string} input
   * @param  {string} seperator default: ":"
   * @return {object}
   */
  function _listToObject(input, seperator) {
    var output = {};
    seperator = typeof seperator === 'sting' ? seperator : ':';

    input = input.replace(/<br(\s|\/)*>/g, '\n').match(/[^\r\n]+/g);
    for (var i = 0, l = input.length; i < l; i++) {
      var inp = input[i].split(seperator);
      output[$.trim(inp[0]).toLowerCase()] = $.trim(inp[1]);
    }

    return output;
  }


  /* *********** */
  /* MAIN PLUGIN */
  /* *********** */

  function Interarrangement(el, options) {
    var self = this;

    self.source = '';
    self.el = el;
    self.$el = $(el);
    self.options = $.extend({}, DEFAULTS, options);

    self._init();
  }

  Interarrangement.prototype = {
    _init: function() {
      var self = this;

      if (!self._fetchSource()) {
        return false;
      }

      self._markup();

      self._fetchHeader();

      self._fetchVariations();

      self._initVex();
    },

    /**
     * Get basic markdown from element.
     *
     * @return {boolean} success or not
     */
    _fetchSource: function() {
      var self = this;

      if (self.source.length) {
        _error('WARNING: About to fetch source a second time.');
      }

      self.source = self.$el.text();

      if (!self.source.length) {
        _error('ERROR: Source seems to be empty.');
        return false;
      }

      return true;
    },

    /**
     * Parse Markdown and replace element with it.
     * 
     * @return {void}
     */
    _markup: function() {
      var self = this;

      self.$el.html(markdown.toHTML(self.source, MARKDOWN_DIALECT));
    },

    /**
     * Get and parse the header infos.
     * 
     * @return {void}
     */
    _fetchHeader: function() {
      var self = this,
          header;

      header = self.options.getHeader.call(self.el);
      if (typeof header === 'string') {
        header = _listToObject(header);
      }

      $.extend(self.options.header, header);
    },

    _fetchVariations: function() {
      var self = this,
          variations;

      variations = self.options.getVariations.call(self.el);
      $.each(variations, function(k, v) {
        if (typeof v === 'string') {
          v = _listToObject(v);
        }
        variations[k] = v;
      });

      $.extend(self.options.variations, variations);
    },

    _initVex: function() {
      var self = this;

      self.$el.find('code').each(function() {
        var $code = $(this),
            $tabdiv = $(TABDIV_EL),
            notes = $.trim($code.html()),
            header;

        if (!notes.length) {
          return;
        }

        header = self.getHeaderFor($code);
        header = self._getTextHeader(header);

        if (self.options.showEditors) {
          $tabdiv.attr('editor', 'true');
        }

        $tabdiv.attr('class', $code.attr('class'));
        $tabdiv.html(header + self._applyNotePrefix(notes));
        $code.replaceWith($tabdiv);

        $tabdiv.data('vextabdiv', new Vex.Flow.TabDiv($tabdiv[0]));
      });
    },

    _getTextHeader: function(header) {
      var self = this,
          out = [],
          oi = 0;

      $.each(self.options.vexOptions, function(k, v) {
        if (oi === 0) {
          out.push('options');
        }
        oi++;
        out.push(k + '=' + v);
      });

      out.push('tabstave');

      self._eachValidateHeader(header, function(k, v) {
        out.push(k + '=' + v);
      });

      return out.join('\n') + '\n';
    },

    _eachValidateHeader: function(header, cb) {
      $.each(header, function(k, v) {
        if (DELETE_FOR_TEXTHEADER.indexOf(k) > -1) {
          return;
        }

        if (typeof RENAME_FOR_TEXTHEADER[k] !== 'undefined') {
          k = RENAME_FOR_TEXTHEADER[k];
        }

        cb(k, v);
      });
    },

    _applyNotePrefix: function(input) {
      return $.trim(('\n' + input).replace(/[\r\n](?!voice)/g, '\nnotes '));
    },

    getHeaderFor: function($el) {
      var self = this,
          header = $.extend({}, self.options.header),
          classes = ('' + $el.attr('class')).split(' ');

      for (var i = 0, l = classes.length; i < l; i++) {
        if (typeof self.options.variations[classes[i]] !== 'undefined') {
          $.extend(header, self.options.variations[classes[i]]);
        }
      }

      return header;
    }
  };

  window.bridge('interarrangement', Interarrangement);
})(jQuery, window, markdown, Vex);
