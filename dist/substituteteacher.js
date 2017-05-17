"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (window) {
  "use strict";

  var NBSP = "&nbsp;";

  var TRANSITIONS = {
    "WebkitTransition": "webkitTransitionEnd",
    "MozTransition": "transitionend",
    "MSTransition": "msTransitionEnd",
    "OTransition": "otransitionend",
    "transition": "transitionend"
  };

  /**
   * Compare function for sorting annotated actions, used to fine the pair of
   * sentences with the minimum edit distance.
   *
   * @param {Object} annotatedAction1 - the annotated action in question
   * @param {Object} annotatedAction1.action - the action in question
   * @param {int} annotatedAction1.action.cost - the action's cost
   * @param {Object} annotatedAction2 - the annotated action to compare to
   * @param {Object} annotatedAction2.action - the action to compare to
   * @param {int} annotatedAction1.action.cost - the action to compare to's cost
   *
   * @return {int} difference in cost - positive if 1 > 2, negative if 2 > 1,
   *                                    0 if 1 === 2
   */
  var _sortAnnotatedAction = function _sortAnnotatedAction(annotatedAction1, annotatedAction2) {
    return annotatedAction1.action.cost - annotatedAction2.action.cost;
  };

  var shuffleArr = function shuffleArr(arr) {
    var tempArr = arr.slice();

    for (var i = tempArr.length; i; i--) {
      var j = Math.floor(Math.random() * i);

      var _ref = [tempArr[j], tempArr[i - 1]];
      tempArr[i - 1] = _ref[0];
      tempArr[j] = _ref[1];
    }

    return tempArr;
  };

  /**
   * Parse the raw sentence into an array of words.
   *
   * Separate the sentence by spaces, and then go along each word and pull
   * punctuation off words that end with a punctuation symbol:
   *
   *  "We're here (in Wilkes-Barre), finally!" =>
   *  ["We're", "here", "(", "in", "Wilkes-Barre", ")", ",", "finally", "!"]
   *
   * TODO: figure out some way to annotate puncatation so that it can be
   * rendered without a space in it.
   *
   * @param {string[]} rawSentences the sentences to parse
   * @returns {string[][]} sentences the sentences split up into tokens
   */
  function _parseSentence(rawSentence) {
    if (!rawSentence || typeof rawSentence !== "string") {
      throw "rawSentence must be a string.";
    }

    var components = [];
    var start = 0;
    var end = 0;

    for (; end < rawSentence.length; end++) {
      var endChar = rawSentence.charAt(end);

      /**
       * Characters that should "detach" from strings are:
       *   ().,/![]*;:{}=?"+ or whitespace
       * Characters that remain that remain a part of the word include:
       *   -#$%^&_`~'
       */
      if (endChar.match(/[\.,"\/!\?\*\+;:{}=()\[\]\s]/g)) {
        // Append the word we've been building
        if (end > start) {
          components.push(rawSentence.slice(start, end) + (endChar.match(/\s/g) ? NBSP : ""));
        }

        // If the character is not whitespace, then it is a special character
        // and should be split off into its own string
        if (!endChar.match(/\s/g)) {
          components.push(endChar + (end + 1 < rawSentence.length && rawSentence[end + 1].match(/\s/g) ? NBSP : ""));
        }

        // The start of the next word is the next character to be seen.
        start = end + 1;
      }
    }

    if (start < end) {
      components.push(rawSentence.slice(start, end));
    }

    return components;
  }

  function _whichTransitionEndEvent() {
    var el = document.createElement("fakeelement");

    for (var t in TRANSITIONS) {
      if (el.style[t] !== undefined) {
        return TRANSITIONS[t];
      }
    }
  }

  /**
   * Generate the HTML associated with each word.
   *
   * @param {string} namespace - the namespace associated with this library,
   *                             which should be prepended to classnames.
   * @param {int} idx - the index of this word in the sentence.
   *
   * @returns {string} template - the HTML to inject.
   */
  var _wordTemplate = function _wordTemplate(namespace, idx) {
    return "<div class=\"" + namespace + "-to-idx-" + idx + " " + namespace + "-word\">\n        <span class=\"" + namespace + "-visible\" style=\"opacity: 0\"></span>\n        <span class=\"" + namespace + "-invisible\" style=\"width: 0px\"></span>\n      </div>";
  };

  /**
   * Inject CSS needed to make the transitions work in the <head>.
   *
   * @param {string} namespace - the namespace associated with this library,
   *                             which should be prepended to classnames.
   * @param {number} transitionSpeed - the speed for CSS transitions.
   * @param {number} height - the outerHeight of the wrapper.
   */
  var _injectStyle = function _injectStyle(namespace, transitionSpeed, height, fontFamily) {
    var head = document.head || document.getElementsByTagName("head")[0];
    var style = document.createElement("style");

    var css = "@font-face {\n        font-family: " + namespace + "-empty;\n        src: url(data:application/font-woff;charset=utf-8;base64,d09GRk9UVE8AAAQ0AAoAAAAAA+wAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABDRkYgAAAA9AAAAJ4AAACeXQ48j09TLzIAAAGUAAAAYAAAAGAIIgbWY21hcAAAAfQAAABEAAAARAAyAGlnYXNwAAACOAAAAAgAAAAIAAAAEGhlYWQAAAJAAAAANgAAADb9mzB5aGhlYQAAAngAAAAkAAAAJAHiAeVobXR4AAACnAAAABAAAAAQAAAAAG1heHAAAAKsAAAABgAAAAYABFAAbmFtZQAAArQAAAFdAAABXVqZXRlwb3N0AAAEFAAAACAAAAAgAAMAAAEABAQAAQEBDHNwYWNlLWVtcHR5AAECAAEAOvgcAvgbA/gYBB4KABlT/4uLHgoAGVP/i4sMB4tr+JT4dAUdAAAAfA8dAAAAgREdAAAACR0AAACVEgAFAQEMFxkbHnNwYWNlLWVtcHR5c3BhY2UtZW1wdHl1MHUxdTIwAAACAYkAAgAEAQEEBwoN/JQO/JQO/JQO/JQO+JQU+JQViwwKAAAAAwIAAZAABQAAAUwBZgAAAEcBTAFmAAAA9QAZAIQAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAABAAAAAIAHg/+D/4AHgACAAAAABAAAAAAAAAAAAAAAgAAAAAAACAAAAAwAAABQAAwABAAAAFAAEADAAAAAIAAgAAgAAAAEAIP/9//8AAAAAACD//f//AAH/4wADAAEAAAAAAAAAAAABAAH//wAPAAEAAAABAAAAeR2GXw889QALAgAAAAAAzz54vgAAAADPPni+AAAAAAAAAAAAAAAIAAIAAAAAAAAAAQAAAeD/4AAAAgAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABQAAAEAAAAAAAOAK4AAQAAAAAAAQAWAAAAAQAAAAAAAgAOAGMAAQAAAAAAAwAWACwAAQAAAAAABAAWAHEAAQAAAAAABQAWABYAAQAAAAAABgALAEIAAQAAAAAACgAoAIcAAwABBAkAAQAWAAAAAwABBAkAAgAOAGMAAwABBAkAAwAWACwAAwABBAkABAAWAHEAAwABBAkABQAWABYAAwABBAkABgAWAE0AAwABBAkACgAoAIcAcwBwAGEAYwBlAC0AZQBtAHAAdAB5AFYAZQByAHMAaQBvAG4AIAAxAC4AMABzAHAAYQBjAGUALQBlAG0AcAB0AHlzcGFjZS1lbXB0eQBzAHAAYQBjAGUALQBlAG0AcAB0AHkAUgBlAGcAdQBsAGEAcgBzAHAAYQBjAGUALQBlAG0AcAB0AHkARwBlAG4AZQByAGEAdABlAGQAIABiAHkAIABJAGMAbwBNAG8AbwBuAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=) format('woff');\n      }\n      ." + namespace + "-invisible { visibility: hidden; }\n      ." + namespace + "-animating {\n        -webkit-transition: " + transitionSpeed + "s all linear;\n        -moz-transition: " + transitionSpeed + "s all linear;\n        -o-transition: " + transitionSpeed + "s all linear;\n        transition: " + transitionSpeed + "s all linear;\n      }\n      ." + namespace + " {\n        position: relative;\n        font-family: " + namespace + "-empty;\n        margin:\n      }\n      ." + namespace + ":after {\n        content: ' ';\n        display: block;\n        clear: both;\n      }\n      ." + namespace + "-text-width-calculation {\n        position: absolute;\n        visibility: hidden;\n        font-family: " + fontFamily + ";\n        height: auto;\n        width: auto;\n        display: inline-block;\n        white-space: nowrap;\n      }\n      ." + namespace + " ." + namespace + "-old-content {\n        font-family: " + fontFamily + ";\n        position: absolute;\n        left: 0;\n        width: 100%;\n        top: 0;\n        height: 100%;\n      }\n      ." + namespace + "." + namespace + "-loaded ." + namespace + "-old-content {\n        display: none;\n      }\n      ." + namespace + "." + namespace + "-loaded ." + namespace + "-word {\n        opacity: 1;\n      }\n      ." + namespace + " ." + namespace + "-punctuation { margin-left: -0.3rem; }\n      ." + namespace + " ." + namespace + "-word {\n        display: inline-block;\n        position: relative;\n        float: left;\n        opacity: 0;\n        font-family: " + fontFamily + ";\n        text-align: center;\n        height: " + height + ";\n        white-space: nowrap;\n        overflow: hidden;\n      }\n      ." + namespace + " ." + namespace + "-word span {\n        top: 0;\n        position: relative;\n        overflow: hidden;\n        height: 1px;\n        display: inline-block;\n      }\n      ." + namespace + " ." + namespace + "-word ." + namespace + "-visible {\n        position: absolute;\n        display: inline-block;\n        height: " + height + ";\n        top: 0;\n        bottom: 0;\n        right:0;\n        left: 0;\n    }";

    style.type = "text/css";

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  };

  /***************************************************************************
   *                                                                         *
   *                               Animation()                               *
   *                                                                         *
   ***************************************************************************/

  /**
   * A privately used class for creating animations.  It allows for animations
   * to have state associated with them, without passing arguments to callback
   * functions.
   *
   * @param {string} animation - one of "remove", "sub", "insert", or
   *                             "keep".  Indicates the animation to perform,
   *                             and forcasts the contents of animationContext.
   * @param {Object} sub - the instance of the Sub class associated
   *                           with this animation.
   * @param {Object} animationContext - any context that is needed by the
   *                                    passed animation.
   */

  var Animation = function () {
    function Animation(animation, sub, animationContext) {
      var _this = this;

      _classCallCheck(this, Animation);

      this.sub = sub;
      this.ctx = animationContext;
      this.transitionEnd = _whichTransitionEndEvent();
      this.animatingClass = sub.settings.namespace + "-animating";

      this.steps = function () {
        if (animation === "remove") {
          return [function () {
            _this._fadeOut();
          }, function () {
            _this._setWidth();
          }, function () {
            _this._removeElement();
          }];
        } else if (animation === "sub") {
          return [function () {
            _this._reIndex();
          }, function () {
            _this._fadeOut();
          }, function () {
            _this._setWidth();
          }, function () {
            _this._setTextAndFadeIn();
          }, function () {
            _this._cleanUp();
          }];
        } else if (animation === "insert") {
          return [function () {
            _this._setWidth();
          }, function () {
            _this._setTextAndFadeIn();
          }, function () {
            _this._cleanUp();
          }];
        } else if (animation === "keep") {
          return [function () {
            _this._reIndex();
          }];
        } else {
          console.error("Unknown animation: ", animation);
        }
      }();

      this.steps[0](); // dequeue an run the first task.
    }

    /**
     * Change the index class of the word.
     */


    _createClass(Animation, [{
      key: "_reIndex",
      value: function _reIndex() {
        var _ctx = this["ctx"],
            word = _ctx.word,
            fromIndexClass = _ctx.fromIndexClass,
            toIndexClass = _ctx.toIndexClass,
            steps = this.steps,
            sub = this.sub;

        // if (this.sub.settings.verbose) { console.log("_reIndex"); }

        // Perform substitution if needed

        if (sub.settings.verbose) {
          console.log("_reIndex ", word.innerText, " from ", fromIndexClass, " to ", toIndexClass);
        }

        word.classList.remove(fromIndexClass);
        word.classList.add(toIndexClass);

        // run next step if there is one
        steps.shift(); // pop _reIndex

        if (steps.length > 0) {
          steps[0]();
        }
      }

      /**
       * Fade out this word
       */

    }, {
      key: "_fadeOut",
      value: function _fadeOut() {
        var _ctx2 = this["ctx"],
            visible = _ctx2.visible,
            invisible = _ctx2.invisible,
            steps = this.steps,
            sub = this.sub,
            animatingClass = this.animatingClass,
            transitionEnd = this.transitionEnd;


        if (sub.settings.verbose) {
          console.log("_fadeOut");
        }

        /* Hold the containerId width, and fade out */
        visible.classList.add(animatingClass);
        steps.shift(); // pop _fadeOut

        visible.addEventListener(transitionEnd, steps[0], false);

        invisible.style.width = invisible.offsetWidth + "px";
        visible.style.opacity = 0;
      }

      /**
       * Set with width of this word to the width of ctx.newText.
       */

    }, {
      key: "_setWidth",
      value: function _setWidth() {
        var _ctx3 = this["ctx"],
            visible = _ctx3.visible,
            invisible = _ctx3.invisible,
            newText = _ctx3.newText,
            steps = this.steps,
            sub = this.sub,
            animatingClass = this.animatingClass,
            transitionEnd = this.transitionEnd;


        if (sub.settings.verbose) {
          console.log("_setWidth");
        }
        /* Animate the width */
        visible.classList.remove(animatingClass);
        invisible.classList.add(animatingClass);

        visible.removeEventListener(transitionEnd, steps[0], false);

        steps.shift(); // pop _setWidth

        invisible.addEventListener(transitionEnd, steps[0], false);

        var newWidth = this._calculateWordWidth(newText, sub.wrapper.tagName, sub.wrapper.className.split(" "));

        setTimeout(function () {
          invisible.style.width = newWidth + "px";
        }, 5);
      }

      /**
       * Remove this element from the DOM
       */

    }, {
      key: "_removeElement",
      value: function _removeElement() {
        var _ctx4 = this["ctx"],
            invisible = _ctx4.invisible,
            word = _ctx4.word,
            steps = this.steps,
            sub = this.sub,
            transitionEnd = this.transitionEnd;


        if (sub.settings.verbose) {
          console.log("_removeElement");
        }

        /* Remove this word */
        invisible.removeEventListener(transitionEnd, steps[0], false);
        sub.wrapper.removeChild(word);
      }

      /**
       * Set the text of this element to ctx.newText and fade it in.
       */

    }, {
      key: "_setTextAndFadeIn",
      value: function _setTextAndFadeIn() {
        var _ctx5 = this["ctx"],
            visible = _ctx5.visible,
            invisible = _ctx5.invisible,
            newText = _ctx5.newText,
            steps = this.steps,
            sub = this.sub,
            animatingClass = this.animatingClass,
            transitionEnd = this.transitionEnd;


        if (sub.settings.verbose) {
          console.log("_setTextAndFadeIn");
        }

        /* Sub the text then fade in */
        invisible.classList.remove(animatingClass);
        visible.classList.add(animatingClass);

        invisible.removeEventListener(transitionEnd, steps[0], false);

        steps.shift(); // pop _setTextAndFadeIn

        visible.addEventListener(transitionEnd, steps[0], false);

        visible.innerHTML = newText;
        invisible.innerHTML = newText;
        visible.style.opacity = 1;
      }

      /**
       * Remove animation classes, remove event listeners, and set widths to "auto"
       */

    }, {
      key: "_cleanUp",
      value: function _cleanUp() {
        var _ctx6 = this["ctx"],
            visible = _ctx6.visible,
            invisible = _ctx6.invisible,
            steps = this.steps,
            sub = this.sub,
            animatingClass = this.animatingClass,
            transitionEnd = this.transitionEnd;


        if (sub.settings.verbose) {
          console.log("_cleanUp");
        }

        /* Clean Up */
        invisible.classList.remove(animatingClass);
        visible.classList.remove(animatingClass);

        visible.removeEventListener(transitionEnd, steps[0], false);
        invisible.style.width = "auto";
      }

      /**
       * Find the width that an element with a given tag and classes would have if
       * it contained the passed text.
       *
       * @param {string} text - the text to get the width of
       * @param {string} tag - the tag that the text will be put in
       * @param {string[]} classes - an array of classes associated with this
       *                             element.
       */

    }, {
      key: "_calculateWordWidth",
      value: function _calculateWordWidth(text, tag) {
        var classes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

        var elem = document.createElement(tag);

        classes.push(this.sub.settings.namespace + "-text-width-calculation");

        elem.setAttribute("class", classes.join(" "));
        elem.innerHTML = text;

        document.body.appendChild(elem);
        /* Get a decimal number of the form 12.455 */
        var width = parseFloat(window.getComputedStyle(elem, null).width);

        elem.parentNode.removeChild(elem);

        return width;
      }
    }]);

    return Animation;
  }();

  /***************************************************************************
   *                                                                         *
   *                                  Sub()                                  *
   *                                                                         *
   ***************************************************************************/

  /**
   * Sub() - the exposed API for substituteteacher.js
   *
   * @param {string[]} rawSentences - An array of sentences to loop between.
   * @param {Object} options - Configuration options
   * @param {string} options.containerId - id of the injection point for HTML
   *                                       default: "sub"
   * @param {string} options.namespace - namespace to prepend to classes used
   *                                     internally
   *                                     default: "sub"
   * @param {int} options.interval - number of milliseconds between each change
   *                                 default: 5000
   * @param {int} options.speed - number of milliseconds that each step of the
   *                              animation should take
   *                              default: 200
   * @param {bool} options.verbose - true to enable console logging
   *                                 default: false
   * @param {bool} options.random - true if the first sentence to appear should
   *                                be random
   *                                default: false
   * @param {bool} options.best - true if the sentences should be ordered to
   *                              minimize the number of changes performed
   *                              default: true
   * @param {bool} options.mobileWidth - if defined, the sentence loop will stop
   *                                     at screen sizes smaller than the width.
   *                                     defulat: null
   * @param {bool} options.clearOriginalContent - true if the contents of the
   *                                              container should be removed
   *                                              before we inject our elements.
   *                                              If it is set to false, the
   *                                              original content will remain
   *                                              until after the first sentence
   *                                              is inserted, at which time it
   *                                              will be hidden
   *                                              default: true
   * @param {bool} options._testing - true if testing.  sentences will be
   *                                  ignored
   */


  var Sub = function () {
    function Sub(rawSentences) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Sub);

      var settings = {
        containerId: opts.containerId || "sub",
        namespace: opts.namespace || "sub",
        interval: opts.interval || 5000,
        speed: opts.speed || 200,
        mobileWidth: opts.mobileWidth || null,
        verbose: opts.verbose !== undefined ? opts.verbose : false,
        random: opts.random !== undefined ? opts.random : false,
        best: opts.best !== undefined ? opts.best : true,
        clearOriginalContent: opts.clearOriginalContent !== undefined ? opts.clearOriginalContent : true,
        _testing: opts._testing !== undefined ? opts._testing : false
      };

      this.wrapper = document.getElementById(settings.containerId);
      this.settings = settings;

      var namespace = settings.namespace;
      var wrapperStyle = window.getComputedStyle(this.wrapper);

      _injectStyle(namespace, settings.speed / 1000, wrapperStyle.height, wrapperStyle.fontFamily);

      this.highestTimeoutId = 0;
      this.currentState = null;
      this.actions = [];
      this.invisibleClass = " ." + namespace + "-invisible";
      this.visibleClass = " ." + namespace + "-visible";
      this.fromClass = namespace + "-from-idx-";
      this.toClass = namespace + "-to-idx-";
      this.wrapperSelector = "#" + namespace;
      this.isEmpty = true;

      this._setupContainer();

      if (!settings._testing) {
        this._setSentences(this._parseSentences(rawSentences));
      }
    }

    /**
     * Parse the array of raw sentence strings into an array of arrays of words.
     *
     * @param {string[]} rawSentences the sentences to parse
     * @returns {string[][]} sentences the
     */


    _createClass(Sub, [{
      key: "_parseSentences",
      value: function _parseSentences(rawSentences) {
        if (!rawSentences || (typeof rawSentences === "undefined" ? "undefined" : _typeof(rawSentences)) !== "object") {
          throw "rawSentences must be an array of strings.";
        }

        return rawSentences.map(_parseSentence);
      }

      /**
       * Find the container for the sentences, empty out any HTML that might be
       * inside, and then give it the namespace class.  It will be the root element
       * for any changes we might make.
       */

    }, {
      key: "_setupContainer",
      value: function _setupContainer() {
        var _settings = this.settings,
            containerId = _settings.containerId,
            clearOriginalContent = _settings.clearOriginalContent,
            namespace = _settings.namespace;


        var container = document.getElementById(containerId);

        if (!container) {
          throw "Cannot find element with id:" + containerId;
        }

        var originalStyle = window.getComputedStyle(container);

        container.style.height = originalStyle.height;

        if (clearOriginalContent) {
          container.innerHTML = "";
        } else {
          container.style.width = originalStyle.width;
          container.innerHTML = "<span class=\"" + namespace + "-old-content\">" + container.innerHTML.replace(" ", NBSP) + "</span>";
        }

        container.className = namespace;
      }
    }, {
      key: "_getOnResize",
      value: function _getOnResize() {
        var _this2 = this;

        this.isStopped = false;

        var onResize = function onResize() {
          _this2.lastWindowWidth = window.innerWidth;

          // Disable on small screens, if that parameter is provided.
          if (_this2.settings.mobileWidth !== null) {
            if (!_this2.isStopped && _this2.lastWindowWidth < _this2.settings.mobileWidth) {
              // stop on small screens
              _this2._stop();
              _this2.isStopped = true;
            } else if (_this2.isStopped && _this2.lastWindowWidth > _this2.settings.mobileWidth) {
              // start up again
              _this2._run();
              _this2.isStopped = false;
            }
          }
        };

        return onResize;
      }

      /**
       * Run the sentence loop.  If we haven't successfully populated self.actions,
       * we delay the running until we have.
       *
       * This function should only be called internally.
       */

    }, {
      key: "_run",
      value: function _run() {
        var _this3 = this;

        var actions = this.actions,
            wrapper = this.wrapper,
            _settings2 = this["settings"],
            namespace = _settings2.namespace,
            interval = _settings2.interval;

        // We haven't finished generating self.actions yet, so delay running

        if (!this.actions) {
          setTimeout(function () {
            this.run();
          }, 20);
          return;
        }

        if (this.isEmpty) {
          this.isEmpty = false;

          var action = this._computeActionsToChange([], actions[0].from);

          if (!action) {
            console.log(action);

            throw "returned null action";
          }

          this._applyAction(action);
        }

        this.highestTimeoutId = setTimeout(function () {
          wrapper.classList.add(namespace + "-loaded");
          wrapper.style.height = "";

          _this3._sentenceLoop();
        }, interval);
      }

      /**
       * Run the sentence loop and add resize handlers. If we haven't successfully
       * populated self.actions, we delay the running until we have.
       */

    }, {
      key: "run",
      value: function run() {
        this.onResize = this._getOnResize();

        window.addEventListener("resize", this.onResize, false);
        window.addEventListener("orientationchange", this.onResize, false);

        this._run();

        return this;
      }

      /**
       * Stop the sentence loop. This will stop all animations.
       *
       * This function should only be called internally.
       */

    }, {
      key: "_stop",
      value: function _stop() {
        var self = this;

        clearTimeout(self.highestTimeoutId);
      }

      /**
       * Stop the sentence loop. This will stop all animations and remove event
       * listeners.
       */

    }, {
      key: "stop",
      value: function stop() {
        window.removeEventListener("resize", this.onResize, false);
        window.removeEventListener("orientationchange", this.onResize, false);

        this._stop();

        return this;
      }

      /**
       * Compute the actions required to transform `from` into `to`.
       *
       * Example:
       *     from: ["The", "quick", "brown", "fox", "is", "very", "cool", ",", "supposedly", "."]
       *       to: ["The", "brown", "color", "is", "very", "very", "pretty", ",", "no", "?"]
       *   output:
       *     {
       *       from: ["The", "quick", "brown", "fox", "is", "very", "cool", ",", "supposedly", "."],
       *       to: ["The", "brown", "color", "is", "very", "very", "pretty", ",", "no", "?"],
       *       sub:[
       *       { fromWord: "fox",        toWord: "color", fromIndex: 3, toIndex: 2 },
       *       { fromWord: "cool",       toWord: "very",  fromIndex: 6, toIndex: 5 },
       *       { fromWord: "supposedly", toWord: "no",    fromIndex: 8, toIndex: 8 },
       *       { fromWord: ".",          toWord: "?",     fromIndex: 9, toIndex: 9 } ],
       *       remove: [
       *       { fromWord: "quick", fromIndex: 1 } ],
       *       insert: [
       *       { toWord: "pretty", toIndex: 6 } ],
       *       keep: [
       *       { fromWord: "The",   toWord: "The",   fromIndex: 0, toIndex: 0 },
       *       { fromWord: "brown", toWord: "brown", fromIndex: 2, toIndex: 1 },
       *       { fromWord: "is",    toWord: "is",    fromIndex: 4, toIndex: 3 },
       *       { fromWord: "very",  toWord: "very",  fromIndex: 5, toIndex: 4 },
       *       { fromWord: ",",     toWord: ",",     fromIndex: 7, toIndex: 7 } ],
       *       cost: 6
       *     }
       *
       * @param {string[]} from - the sentence to change from
       * @param {string[]} to - the sentence to change to
       *
       * @returns {object} actions - comamnds to perform
       *   @returns {string[]} actions.from - the from sentence
       *   @returns {string[]} actions.to - the to sentence
       *   @returns {object[]} actions.sub - substitutions to do
       *     @returns {string} actions.sub.fromWord - word to sub
       *     @returns {string} actions.sub.toWord - word to sub with
       *     @returns {int} actions.sub.fromIndex - index of word to sub
       *     @returns {int} actions.sub.toIndex - index of word to sub with
       *   @returns {object[]} actions.remove - removals to do
       *     @returns {string} actions.remove.fromWord - word to remove
       *     @returns {int} actions.remove.fromIndex - index of word to remove
       *   @returns {object[]} actions.insert - insertions to do
       *     @returns {string} actions.insert.toWord - word to insert
       *     @returns {int} actions.insert.toIndex - index of word to insert
       *   @returns {object[]} actions.keep - words to keep (no-ops)
       *     @returns {string} actions.keep.fromWord - word to keep (from)
       *     @returns {string} actions.keep.toWord - word to keep (to)
       *     @returns {int} actions.keep.fromIndex - index in from of word to keep
       *     @returns {int} actions.keep.toIndex - index in to of word to keep
       *   @returns {int} actions.cost - total cost of action =
       *                                 removals + substitutions + insertions
       */

    }, {
      key: "_computeActionsToChange",
      value: function _computeActionsToChange(from, to) {
        if (this.settings.verbose) {
          console.log("_computeActionsToChange: ", from, to);
        }

        var actions = {
          from: from,
          to: to,
          sub: [],
          remove: [],
          insert: [],
          keep: [],
          cost: 0
        };

        /**
         * Recursively creates `actions`, given a start index for each sentence
         *
         * @param {int} fromIndex - index of first word to consider in from sentence
         * @param {int} toIndex - index of first word to consider in to sentence
         * @param {bool} lookAhead - true if we are looking ahead at other
         *                           possible solutions.  Actions will not be
         *                           modified.  false if actions should be modified.
         * @returns {int} cost - the recursively built cost of actions to take.
         */
        var __computeActionsToCange = function __computeActionsToCange(fromIndex, toIndex) {
          var lookAhead = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

          // End of from list
          if (fromIndex >= from.length) {
            if (!lookAhead) {
              actions.insert = actions.insert.concat(to.slice(toIndex).map(function (x, i) {
                return {
                  toWord: x,
                  toIndex: i + toIndex
                };
              }));
            }
            // base case, each insert costs 1
            return to.length - toIndex;
          }

          // End of to list
          if (toIndex >= to.length) {
            if (!lookAhead) {
              actions.remove = actions.remove.concat(from.slice(fromIndex).map(function (x, i) {
                return {
                  fromWord: x,
                  fromIndex: i + fromIndex
                };
              }));
            }
            // base case, each remove costs 1
            return from.length - toIndex;
          }

          // Easy Case: a match!
          if (from[fromIndex] === to[toIndex]) {
            if (lookAhead) {
              return 0;
            }

            actions.keep.push({
              fromWord: from[fromIndex],
              toWord: to[toIndex],
              fromIndex: fromIndex,
              toIndex: toIndex
            });

            // keep is free
            return __computeActionsToCange(fromIndex + 1, toIndex + 1);
          }

          var foundIndex = from.indexOf(to[toIndex], fromIndex);

          if (lookAhead) {
            return foundIndex;
          }

          if (fromIndex + 1 == from.length) {
            // Can't look ahead, make a move now
            if (foundIndex === -1) {
              actions.sub.push({
                fromWord: from[fromIndex],
                toWord: to[toIndex],
                fromIndex: fromIndex,
                toIndex: toIndex
              });
              // Sub costs 1
              return __computeActionsToCange(fromIndex + 1, toIndex + 1) + 1;
            }
          }

          var futureIndex = __computeActionsToCange(fromIndex, toIndex + 1, true);

          if (foundIndex === -1) {
            if (futureIndex === 0) {
              actions.insert.push({
                toWord: to[toIndex],
                toIndex: toIndex
              });
              // insert costs 1
              return __computeActionsToCange(fromIndex, toIndex + 1) + 1;
            }

            actions.sub.push({
              fromWord: from[fromIndex],
              toWord: to[toIndex],
              fromIndex: fromIndex,
              toIndex: toIndex
            });
            // sub costs 1
            return __computeActionsToCange(fromIndex + 1, toIndex + 1) + 1;
          }

          if (foundIndex === fromIndex + 1 && futureIndex === fromIndex || foundIndex === futureIndex) {
            var fromLeft = from.length - fromIndex;
            var toLeft = to.length - toIndex;

            if (fromLeft > toLeft) {
              actions.insert.push({
                toWord: to[toIndex],
                toIndex: toIndex
              });
              // Insert costs 1
              return __computeActionsToCange(fromIndex + 1, toIndex) + 1;
            }

            // toLeft >= fromLeft
            actions.remove.push({
              fromWord: from[fromIndex],
              fromIndex: fromIndex
            });
            // remove costs 1
            return __computeActionsToCange(fromIndex, toIndex + 1) + 1;
          }

          if (foundIndex > futureIndex && futureIndex !== -1) {
            actions.sub.push({
              fromWord: from[fromIndex],
              toWord: to[toIndex],
              fromIndex: fromIndex,
              toIndex: toIndex
            });
            // Sub costs 1
            return __computeActionsToCange(fromIndex + 1, toIndex + 1) + 1;
          }

          // from.slice
          // foundIndex < futureIndex

          actions.remove = actions.remove.concat(from.slice(fromIndex, foundIndex).map(function (x, i) {
            return {
              fromWord: x,
              fromIndex: i + fromIndex
            };
          }));

          actions.keep.push({
            fromWord: from[foundIndex],
            toWord: to[toIndex],
            fromIndex: foundIndex,
            toIndex: toIndex
          });

          // Each remove costs 1, the keep is free
          return __computeActionsToCange(foundIndex + 1, toIndex + 1) + (foundIndex - fromIndex);
        };

        // Initalize the recursive call, the final result is the cost.
        actions.cost = __computeActionsToCange(0, 0);

        return actions;
      }

      /**
       * Generate self.actions.  If self.settings.best is true, we order the
       * actions to rotate between sentences with minimal insertions, removals, and
       * changes.  If self.settings.random is true, the sentences will appear in a
       * random order.  If both are set, the sequence will be optimal, but will
       * start from a random position in the sequence.
       *
       * @param {string[][]} sentences - sentences to be converted to actions
       */

    }, {
      key: "_setSentences",
      value: function _setSentences(sentences) {
        var _this4 = this;

        var sensLen = sentences.length;

        if (sentences.length === 0) {
          this.actions = [];
        }

        if (this.settings.best) {
          /* Because who says the Traveling Salesman Problem isn't releveant? */

          // compute a table of values table[fromIndex][toIndex] = {
          //   fromIndex: fromIndex,
          //   toIndex: toIndex,
          //   action: the action from sentences[fromIndex] to sentences[toIndex]
          // }
          var table = sentences.map(function (from, fromIndex) {
            return sentences.map(function (to, toIndex) {
              if (fromIndex === toIndex) {
                return {
                  action: {
                    cost: Number.MAX_VALUE
                  },
                  fromIndex: fromIndex,
                  toIndex: toIndex
                };
              }

              var action = _this4._computeActionsToChange(sentences[fromIndex], sentences[toIndex]);

              return {
                action: action,
                fromIndex: fromIndex,
                toIndex: toIndex
              };
            });
          });

          // sort each rows by cost, then sort the rows by lowest cost in that row
          table.sort(function (row1, row2) {
            row1.sort(_sortAnnotatedAction);
            row2.sort(_sortAnnotatedAction);

            return row1[0].cost - row2[0].cost;
          });

          var from = 0;
          var i = 0;

          var usedFromIndexes = [];
          var first = table[0][0].fromIndex;

          // Start with table[0][0], the lowest cost action.  Then, find the lowest
          // cost actions starting from table[0][0].toIndex, and so forth.
          for (i = 0; i < sensLen; i++) {
            for (var j = 0; j < sensLen; j++) {
              if (i === sensLen - 1 && table[from][j].toIndex === first || i !== sensLen - 1 && usedFromIndexes.indexOf(table[from][j].toIndex) === -1) {

                this.actions.push(table[from][j].action);
                usedFromIndexes.push(from);

                from = table[from][j].toIndex;

                break;
              }
            }
          }

          if (this.settings.random) {
            // start from somewhere other than the beginning.
            var start = Math.floor(Math.random() * sensLen);

            for (i = 0; i < start; i++) {
              this.actions.push(this.actions.shift());
            }
          }
        } else {
          var sens = this.settings.random ? shuffleArr(sentences) : sentences;

          this.actions = this.actions.concat(sens.map(function (x, i) {
            var prevIndex = i === 0 ? sensLen - 1 : i - 1;

            return _this4._computeActionsToChange(sens[prevIndex], x);
          }));
        }
      }

      /**
       * Called in an infinite setTimeout loop.  Dequeues an action, performs it,
       * and enqueues it onto the end of the self.actions array.
       * Then calls setTimeout on itself, with self.settings.interval.
       */

    }, {
      key: "_sentenceLoop",
      value: function _sentenceLoop() {
        var _this5 = this;

        var actions = this.actions,
            interval = this["settings"].interval;


        var nextAction = this.actions.shift();

        if (!nextAction) {
          console.log(nextAction, actions);
          throw "returned null action";
        }

        this._applyAction(nextAction);
        actions.push(nextAction);

        clearTimeout(this.highestTimeoutId);

        this.highestTimeoutId = setTimeout(function () {
          _this5._sentenceLoop();
        }, interval);
      }

      /**
       * Removes the word from the sentence.
       *
       * @param {Object} removeAction - the removal to perform
       * @param {int} removeAction.fromIndex - the index of the existing word
       */

    }, {
      key: "_removeAction",
      value: function _removeAction(removeAction) {
        var fromClass = this.fromClass,
            wrapperSelector = this.wrapperSelector,
            visibleClass = this.visibleClass,
            invisibleClass = this.invisibleClass,
            verbose = this["settings"].verbose;


        var fromIndexClass = fromClass + removeAction.fromIndex;

        var animationContext = {
          fromIndexClass: fromIndexClass,
          word: document.querySelector(wrapperSelector + " ." + fromIndexClass),
          visible: document.querySelector(wrapperSelector + " ." + fromIndexClass + visibleClass),
          invisible: document.querySelector(wrapperSelector + " ." + fromIndexClass + invisibleClass),
          newText: "" // We'll animate to zero width
        };

        if (verbose) {
          console.log("remove", animationContext);
        }

        new Animation("remove", this, animationContext);
      }

      /**
       * Perform the given insertions
       *
       * @param {Object[]} insertions - the insertions to perform
       * @param {int} insertions.toIndex - the index of the element to add
       * @param {string} insertions.toWord - the word to insert
       */

    }, {
      key: "_performInsertions",
      value: function _performInsertions(insertions) {
        var _this6 = this;

        var toClass = this.toClass,
            wrapper = this.wrapper,
            wrapperSelector = this.wrapperSelector,
            visibleClass = this.visibleClass,
            invisibleClass = this.invisibleClass,
            _settings3 = this["settings"],
            namespace = _settings3.namespace,
            speed = _settings3.speed,
            verbose = _settings3.verbose;


        setTimeout(function () {
          insertions.forEach(function (insertAction) {

            /* Insert new node (no text yet) */
            var html = _wordTemplate(namespace, insertAction.toIndex);

            if (insertAction.toIndex === 0) {
              wrapper.insertAdjacentHTML("afterbegin", html);
            } else {
              var selector = wrapperSelector + " ." + toClass + (insertAction.toIndex - 1);
              var prevSibling = document.querySelector(selector);

              prevSibling.insertAdjacentHTML("afterend", html);
            }

            /*  Startup animations */
            var toIndexClass = toClass + insertAction.toIndex;

            var animationContext = {
              toIndexClass: toIndexClass,
              word: document.querySelector(wrapperSelector + " ." + toIndexClass),
              visible: document.querySelector(wrapperSelector + " ." + toIndexClass + visibleClass),
              invisible: document.querySelector(wrapperSelector + " ." + toIndexClass + invisibleClass),
              newText: insertAction.toWord
            };

            if (verbose) {
              console.log("insert", animationContext);
            }

            new Animation("insert", _this6, animationContext);
          });
        }, speed);
      }

      /**
       * Perform the given substitution
       *
       * @param {Object} subAction - the substitution to perform
       * @param {int} subAction.fromIndex - the index of the element to change
       * @param {string} subAction.fromWord - the word to sub
       * @param {int} subAction.toIndex - the index to give the new word
       * @param {string} subAction.toWord - the word to sub with
       */

    }, {
      key: "_subAction",
      value: function _subAction(subAction) {
        var fromClass = this.fromClass,
            toClass = this.toClass,
            wrapperSelector = this.wrapperSelector,
            visibleClass = this.visibleClass,
            invisibleClass = this.invisibleClass,
            verbose = this["settings"].verbose;


        var fromIndexClass = fromClass + subAction.fromIndex;

        var animationContext = {
          fromIndexClass: fromIndexClass,
          toIndexClass: toClass + subAction.toIndex,
          word: document.querySelector(wrapperSelector + " ." + fromIndexClass),
          visible: document.querySelector(wrapperSelector + " ." + fromIndexClass + visibleClass),
          invisible: document.querySelector(wrapperSelector + " ." + fromIndexClass + invisibleClass),
          newText: subAction.toWord
        };

        if (verbose) {
          console.log("sub", animationContext);
        }

        new Animation("sub", this, animationContext);
      }

      /**
       * Perform the given keep action.
       *
       * @param {Object} keepAction - the keep action to perform
       * @param {int} keepAction.fromIndex - the index of the word to re-label
       * @param {int} keepAction.toIndex - the index to label this word
       */

    }, {
      key: "_keepAction",
      value: function _keepAction(keepAction) {
        var fromClass = this.fromClass,
            toClass = this.toClass,
            wrapperSelector = this.wrapperSelector,
            verbose = this["settings"].verbose;


        var fromIndexClass = fromClass + keepAction.fromIndex;

        var animationContext = {
          fromIndexClass: fromIndexClass,
          toIndexClass: toClass + keepAction.toIndex,
          word: document.querySelector(wrapperSelector + " ." + fromIndexClass)
        };

        if (verbose) {
          console.log("keep", animationContext);
        }

        new Animation("keep", this, animationContext);
      }

      /**
       * Apply `action`, by performing the necessary substitutions, removals, keeps,
       * and insertions.
       */

    }, {
      key: "_applyAction",
      value: function _applyAction(action) {
        var _this7 = this;

        var fromClass = this.fromClass,
            toClass = this.toClass,
            _settings4 = this["settings"],
            namespace = _settings4.namespace,
            verbose = _settings4.verbose;


        var words = document.getElementsByClassName(namespace + "-word");

        Array.from(words).forEach(function (elem) {
          if (verbose) {
            console.log("replacing to- with from- for:", elem);
          }

          elem.className = elem.className.replace(toClass, fromClass);
        });

        action.sub.map(function (subAction) {
          _this7._subAction(subAction);
        });

        action.remove.map(function (removeAction) {
          _this7._removeAction(removeAction);
        });

        action.keep.map(function (keepAction) {
          _this7._keepAction(keepAction);
        });

        this._performInsertions(action.insert);
      }
    }]);

    return Sub;
  }();

  window.Sub = Sub;
})(window);
