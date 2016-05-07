/* */
"format cjs";
(function(global) {

  "use strict";

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
  function _sortAnnotatedAction(annotatedAction1, annotatedAction2) {
    return annotatedAction1.action.cost - annotatedAction2.action.cost;
  }

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
    var start, end, endChar;
    for (start = 0, end = 0; end < rawSentence.length; end++) {
      endChar = rawSentence.charAt(end);

      /**
       * Characters that should "detach" from strings are:
       *   ().,/![]*;:{}=?"+ or whitespace
       * Characters that remain that remain a part of the word include:
       *   -#$%^&_`~'
       */
      if (endChar.match(/[\.,"\/!\?\*\+;:{}=()\[\]\s]/g)) {
        // Append the word we've been building
        if (end > start) {
          if (endChar.match(/\s/g)) {
            components.push(rawSentence.slice(start, end) + "&nbsp;");
          } else {
            components.push(rawSentence.slice(start, end));
          }
        }

        // If the character is not whitespace, then it is a special character
        // and should be split off into its own string
        if (!endChar.match(/\s/g)) {
          if (end +1 < rawSentence.length && rawSentence.charAt(end + 1).match(/\s/g)) {
            components.push(endChar + "&nbsp;");
          } else {
            components.push(endChar);
          }
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

  /**
   * Find the CSS transition end event that we should listen for.
   *
   * @returns {string} t - the transition string
   */
  function _whichTransitionEndEvent() {
    var t;
    var el = document.createElement("fakeelement");
    var transitions = {
      "WebkitTransition": "webkitTransitionEnd",
      "MozTransition": "transitionend",
      "MSTransition": "msTransitionEnd",
      "OTransition": "otransitionend",
      "transition": "transitionend",
    };
    for (t in transitions) {
      if (transitions.hasOwnProperty(t)) {
        if (el.style[t] !== undefined) {
          return transitions[t];
        }
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
  function _wordTemplate(namespace, idx) {
    return (
      "<div class=\"" + namespace + "-to-idx-" + idx + " " + namespace + "-word\">" +
      "<span class=\"" + namespace + "-visible\" style=\"opacity: 0\"></span>" +
      "<span class=\"" + namespace + "-invisible\" style=\"width: 0px\"></span>" +
      // "<span>&nbsp;</span>" +
      "</div>"
    );
  }

  /**
   * Inject CSS needed to make the transitions work in the <head>.
   *
   * @param {string} namespace - the namespace associated with this library,
   *                             which should be prepended to classnames.
   * @param {number} transitionSpeed - the speed for CSS transitions.
   * @param {number} height - the outerHeight of the wrapper.
   */
  function _injectStyle(namespace, transitionSpeed, height) {
    var css =
      "." + namespace + "-invisible { visibility: hidden; }\n" +
      "." + namespace + "-animating {\n" +
      "  -webkit-transition: " + transitionSpeed + "s all linear;\n" +
      "  -moz-transition: " + transitionSpeed + "s all linear;\n" +
      "  -o-transition: " + transitionSpeed + "s all linear;\n" +
      "  transition: " + transitionSpeed + "s all linear; }\n" +
      "." + namespace + "-text-width-calculation {\n" +
      "  position: absolute;\n" +
      "  visibility: hidden;\n" +
      "  height: auto;\n" +
      "  width: auto;\n" +
      "  display: inline-block;\n" +
      "  white-space: nowrap; }" +
      "." + namespace + " {\n" +
      "  margin: 0;}\n" +
      "  ." + namespace + " ." + namespace + "-punctuation { margin-left: -0.3rem; }\n" +
      "  ." + namespace + " ." + namespace + "-word {\n" +
      "    display: inline;\n" +
      "    position: relative;\n" +
      "    text-align: center;\n" +
      "    height: " + height + "px;\n" +
      "    white-space: nowrap;\n" +
      "    overflow: hidden;}\n" +
      "    ." + namespace + " ." + namespace + "-word span {\n" +
      "      top: 0;\n" +
      "      position: relative;\n" +
      "      overflow: hidden;\n" +
      "      height: 1px;\n" +
      // "      white-space: nowrap;\n" +
      "      display: inline-block;}\n" +
      "      ." + namespace + " ." + namespace + "-word ." + namespace + "-visible {\n" +
      "        position: absolute;\n" +
      "        display: inline;\n" +
      "        height: " + height + "px;\n" +
      "        top: 0;\n" +
      "        bottom: 0;\n" +
      "        right:0;\n" +
      "        left: 0;}";
    var head = document.head || document.getElementsByTagName("head")[0];
    var style = document.createElement("style");

    style.type = "text/css";
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

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
   * @param {bool} options._testing - true if testing.  sentences will be
   *                                  ignored
   */
  function Sub(rawSentences, options) {
    var self = this;
    var opts = options || {};
    self.settings = {
      containerId: opts.containerId || "sub",
      namespace: opts.namespace || "sub",
      interval: opts.interval || 5000,
      speed: opts.speed || 200,
      verbose: (opts.verbose !== undefined) ? opts.verbose : false,
      random: (opts.random !== undefined) ? opts.random : false,
      best: (opts.best !== undefined) ? opts.best : true,
      _testing: (opts._testing !== undefined) ? opts._testing : false,
    };
    self.wrapper = document.getElementById(self.settings.containerId);
    _injectStyle(self.settings.namespace, self.settings.speed / 1000, self.wrapper.offsetHeight);
    self.highestTimeoutId = 0;
    self.currentState = null;
    self.actions = [];
    self.invisibleClass = " ." + self.settings.namespace + "-invisible";
    self.visibleClass = " ." + self.settings.namespace + "-visible";
    self.fromClass = self.settings.namespace + "-from-idx-";
    self.toClass = self.settings.namespace + "-to-idx-";
    self.wrapperSelector = "#" + self.settings.namespace;
    self._setupContainer();
    if (!self.settings._testing) {
      self._setSentences(self._parseSentences(rawSentences));
    }
    return this;
  }

  /**
   * Parse the array of raw sentence strings into an array of arrays of words.
   *
   * @param {string[]} rawSentences the sentences to parse
   * @returns {string[][]} sentences the
   */
  Sub.prototype._parseSentences = function(rawSentences) {
    if (!rawSentences || typeof rawSentences !== "object") {
      throw "rawSentences must be an array of strings.";
    }
    return rawSentences.map(_parseSentence);
  };

  /**
   * Find the container for the sentences, empty out any HTML that might be
   * inside, and then give it the namespace class.  It will be the root element
   * for any changes we might make.
   */
  Sub.prototype._setupContainer = function() {
    var self = this;
    var container = document.getElementById(self.settings.containerId);
    if (!container) {
      throw "Cannot find element with id:" + self.settings.containerId;
    }
    container.innerHTML = "";
    container.className = self.settings.namespace;
  };

  /**
   * Run the sentence loop.  If we haven't successfully populated self.actions,
   * we delay the running until we have.
   */
  Sub.prototype.run = function() {
    var self = this;

    // We haven't finished generating self.actions yet, so delay running
    if (!self.actions) {
      setTimeout(function() {
        self.run();
      }, 20);
    }

    var action = self._computeActionsToChange([], self.actions[0].from);
    if (!action) {
      console.log(action);
      throw "returned null action";
    }
    self._applyAction(action);
    self.highestTimeoutId = setTimeout(function() {
      self._sentenceLoop();
    }, self.settings.interval);
  };

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
  Sub.prototype._computeActionsToChange = function(from, to) {
    var self = this;
    if (self.settings.verbose) { console.log("_computeActionsToChange: ", from, to); }
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
    var __computeActionsToCange = function(fromIndex, toIndex, lookAhead) {
      var i;
      lookAhead = lookAhead || false;

      // End of from list
      if (fromIndex >= from.length) {
        if (!lookAhead) {
          for (i = toIndex; i < to.length; i++) {
            actions.insert.push({
              toWord: to[i],
              toIndex: i
            });
          }
        }
        // base case, each insert costs 1
        return to.length - toIndex;
      }

      // End of to list
      if (toIndex >= to.length) {
        if (!lookAhead) {
          for (i = fromIndex; i < from.length; i++) {
            actions.remove.push({
              fromWord: from[i],
              fromIndex: i
            });
          }
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
        if(foundIndex === -1) {
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

      if (foundIndex > futureIndex && futureIndex !== -1 ) {
        actions.sub.push({
          fromWord: from[fromIndex],
          toWord: to[toIndex],
          fromIndex: fromIndex,
          toIndex: toIndex
        });
        // Sub costs 1
        return __computeActionsToCange(fromIndex + 1, toIndex + 1) + 1;
      }

      // foundIndex < futureIndex
      for (i = fromIndex; i < foundIndex; i++) {
        actions.remove.push({
          fromWord: from[i],
          fromIndex: i
        });
      }
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
  };

  /**
   * Generate self.actions.  If self.settings.best is true, we order the
   * actions to rotate between sentences with minimal insertions, removals, and
   * changes.  If self.settings.random is true, the sentences will appear in a
   * random order.  If both are set, the sequence will be optimal, but will
   * start from a random position in the sequence.
   *
   * @param {string[][]} sentences - sentences to be converted to actions
   */
  Sub.prototype._setSentences = function(sentences) {
    var self = this;
    var i, j, prevIndex;
    if (sentences.length === 0) {
      self.actions = [];
    }

    if (self.settings.best) {
      /* Because who says the Traveling Salesman Problem isn't releveant? */

      // compute a table of values table[fromIndex][toIndex] = {
      //   fromIndex: fromIndex,
      //   toIndex: toIndex,
      //   action: the action from sentences[fromIndex] to sentences[toIndex]
      // }
      var table = sentences.map(function(from, fromIndex) {
        return sentences.map(function(to, toIndex) {
          if (fromIndex === toIndex) {
            return {
              action: { cost: Number.MAX_VALUE },
              fromIndex: fromIndex,
              toIndex: toIndex
            };
          }
          var action = self._computeActionsToChange(sentences[fromIndex],
                                                    sentences[toIndex]);
          return {
            action: action,
            fromIndex: fromIndex,
            toIndex: toIndex
          };
        });
      });
      var usedFromIndexes = [];
      var from = 0;

      // sort each rows by cost, then sort the rows by lowest cost in that row
      table.sort(function(row1, row2) {
        row1.sort(_sortAnnotatedAction);
        row2.sort(_sortAnnotatedAction);
        return row1[0].cost - row2[0].cost;
      });

      var first = table[0][0].fromIndex;

      // Start with table[0][0], the lowest cost action.  Then, find the lowest
      // cost actions starting from table[0][0].toIndex, and so forth.
      for (i = 0; i < sentences.length; i++) {
        for (j = 0; j < sentences.length; j++) {
          if ((i === sentences.length - 1 && table[from][j].toIndex === first) ||
            (i !== sentences.length - 1 && usedFromIndexes.indexOf(table[from][j].toIndex) === -1)) {
            self.actions.push(table[from][j].action);
            usedFromIndexes.push(from);
            from = table[from][j].toIndex;
            break;
          }
        }
      }

      if(self.settings.random) {
        // start from somewhere other than the beginning.
        var start = Math.floor(Math.random() * (sentences.length));
        for (i = 0; i < start; i++) {
          self.actions.push(self.actions.shift());
        }
      }

    } else {

      if (self.settings.random) {
        // shuffle the sentences
        sentences.sort(function() { return 0.5 - Math.random(); });
      }

      for (i = 0; i < sentences.length; i++) {
        prevIndex = (i === 0) ? (sentences.length - 1) : i - 1;
        self.actions.push(self._computeActionsToChange(sentences[prevIndex],
                                                       sentences[i]));
      }
    }
  };

  /**
   * Called in an infinite setTimeout loop.  Dequeues an action, performs it,
   * and enqueues it onto the end of the self.actions array.
   * Then calls setTimeout on itself, with self.settings.interval.
   */
  Sub.prototype._sentenceLoop = function() {
    var self = this;
    var nextAction = self.actions.shift();
    if (!nextAction) {
      console.log(nextAction, self.actions);
      throw "returned null action";
    }
    self._applyAction(nextAction);
    self.actions.push(nextAction);
    clearTimeout(self.highestTimeoutId);
    self.highestTimeoutId = setTimeout(function() {
      self._sentenceLoop();
    }, self.settings.interval);
  };

  /**
   * Apply `action`, by performing the necessary substitutions, removals, keeps,
   * and insertions.
   */
  Sub.prototype._applyAction = function(action) {
    var self = this;
    var words = document.getElementsByClassName(self.settings.namespace + '-word');
    [].forEach.call(words, function(elem) {
      if (self.settings.verbose) { console.log('replacing to- with from- for:', elem)}
      elem.className = elem.className.replace(self.toClass, self.fromClass);
    });
    action.sub.map(function(subAction) {
      self._subAction(subAction);
    });
    action.remove.map(function(removeAction) {
      self._removeAction(removeAction);
    });
    action.keep.map(function(keepAction) {
      self._keepAction(keepAction);
    });
    self._performInsertions(action.insert);
  };

  /**
   * Removes the word from the sentence.
   *
   * @param {Object} removeAction - the removal to perform
   * @param {int} removeAction.fromIndex - the index of the existing word
   */
  Sub.prototype._removeAction = function(removeAction) {
    var self = this;
    var fromIndexClass = self.fromClass + removeAction.fromIndex;
    var animationContext = {
      fromIndexClass: fromIndexClass,
      word: document.querySelector(self.wrapperSelector + " ." + fromIndexClass),
      visible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.visibleClass),
      invisible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.invisibleClass),
      newText: "" // We'll animate to zero width
    };
    if (self.settings.verbose) { console.log("remove", animationContext); }
    new Animation("remove", self, animationContext);
  };

  /**
   * Perform the given insertions
   *
   * @param {Object[]} insertions - the insertions to perform
   * @param {int} insertions.toIndex - the index of the element to add
   * @param {string} insertions.toWord - the word to insert
   */
  Sub.prototype._performInsertions = function(insertions) {
    var self = this;
    setTimeout(function () {
      insertions.forEach(function(insertAction) {

        /* Insert new node (no text yet) */
        var html = _wordTemplate(self.settings.namespace, insertAction.toIndex);
        if (insertAction.toIndex === 0) {
          self.wrapper.insertAdjacentHTML("afterbegin", html);
        } else {
          var selector = self.wrapperSelector + " ." + self.toClass + (insertAction.toIndex - 1);
          var prevSibling = document.querySelector(selector);
          prevSibling.insertAdjacentHTML("afterend", html);
        }

        /*  Startup animations */
        var toIndexClass = self.toClass + insertAction.toIndex;
        var animationContext = {
          toIndexClass: toIndexClass,
          word: document.querySelector(self.wrapperSelector + " ." + toIndexClass),
          visible: document.querySelector(self.wrapperSelector + " ." + toIndexClass + self.visibleClass),
          invisible: document.querySelector(self.wrapperSelector + " ." + toIndexClass + self.invisibleClass),
          newText: insertAction.toWord
        };

        if (self.settings.verbose) { console.log("insert", animationContext); }
        new Animation("insert", self, animationContext);
      });
    }, self.settings.speed);
  };

  /**
   * Perform the given substitution
   *
   * @param {Object} subAction - the substitution to perform
   * @param {int} subAction.fromIndex - the index of the element to change
   * @param {string} subAction.fromWord - the word to sub
   * @param {int} subAction.toIndex - the index to give the new word
   * @param {string} subAction.toWord - the word to sub with
   */
  Sub.prototype._subAction = function(subAction) {
    var self = this;
    var fromIndexClass = self.fromClass + subAction.fromIndex;
    var animationContext = {
      fromIndexClass: fromIndexClass,
      toIndexClass: self.toClass + subAction.toIndex,
      word: document.querySelector(self.wrapperSelector + " ." + fromIndexClass),
      visible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.visibleClass),
      invisible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.invisibleClass),
      newText: subAction.toWord
    };
    if (self.settings.verbose) { console.log("sub", animationContext); }
    new Animation("sub", self, animationContext);
  };

  /**
   * Perform the given keep action.
   *
   * @param {Object} keepAction - the keep action to perform
   * @param {int} keepAction.fromIndex - the index of the word to re-label
   * @param {int} keepAction.toIndex - the index to label this word
   */
  Sub.prototype._keepAction = function(keepAction) {
    var self = this;
    var fromIndexClass = self.fromClass + keepAction.fromIndex;
    var animationContext = {
      fromIndexClass: fromIndexClass,
      toIndexClass: self.toClass + keepAction.toIndex,
      word: document.querySelector(self.wrapperSelector + " ." + fromIndexClass),
    };

    if (self.settings.verbose) { console.log("keep", animationContext); }
    new Animation("keep", self, animationContext);
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
  function Animation(animation, sub, animationContext) {
    var self = this;
    self.sub = sub;
    self.ctx = animationContext;
    self.transitionEnd = _whichTransitionEndEvent();
    self.animatingClass = " " + self.sub.settings.namespace + "-animating";
    if (animation === "remove") {
      self.steps = [
        function() {self._fadeOut();},
        function() {self._setWidth();},
        function() {self._removeElement();}
      ];
    } else if (animation === "sub") {
      self.steps = [
        function() {self._reIndex();},
        function() {self._fadeOut();},
        function() {self._setWidth();},
        function() {self._setTextAndFadeIn();},
        function() {self._cleanUp();}];
    } else if (animation === "insert") {
      self.steps = [
        function() {self._setWidth();},
        function() {self._setTextAndFadeIn();},
        function() {self._cleanUp();}];
    } else if (animation === "keep") {
      self.steps = [
        function() {self._reIndex();}
      ];
    } else {
      console.log("Unknown animation: ", animation);
    }
    self.steps[0](); // dequeue an run the first task.
  }

  /**
   * Change the index class of the word.
   */
  Animation.prototype._reIndex = function() {
    var self = this;
    var ctx = self.ctx;
    // if (self.sub.settings.verbose) { console.log("_reIndex"); }

    // Perform substitution if needed
    if (self.sub.settings.verbose) {console.log("_reIndex ", ctx.word.innerText, " from ",  ctx.fromIndexClass, " to ", ctx.toIndexClass); }
    ctx.word.className = ctx.word.className.replace(ctx.fromIndexClass, ctx.toIndexClass);

    // run next step if there is one
    self.steps.shift(); // pop _reIndex
    if (self.steps.length > 0) {
      self.steps[0]();
    }
  };

  /**
   * Fade out this word
   */
  Animation.prototype._fadeOut = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.sub.settings.verbose) { console.log("_fadeOut"); }

    /* Hold the containerId width, and fade out */
    ctx.visible.className += self.animatingClass;
    self.steps.shift(); // pop _fadeOut
    ctx.visible.addEventListener(self.transitionEnd, self.steps[0], false);
    ctx.invisible.style.width = ctx.invisible.offsetWidth + "px";
    ctx.visible.style.opacity = 0;
  };

  /**
   * Set with width of this word to the width of ctx.newText.
   */
  Animation.prototype._setWidth = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.sub.settings.verbose) { console.log("_setWidth"); }
    /* Animate the width */
    ctx.visible.className = ctx.visible.className.replace(self.animatingClass, "");
    ctx.invisible.className += self.animatingClass;
    ctx.visible.removeEventListener(self.transitionEnd, self.steps[0], false);
    self.steps.shift(); // pop _setWidth
    ctx.invisible.addEventListener(self.transitionEnd, self.steps[0], false);
    var newWidth = self._calculateWordWidth(
      ctx.newText,
      self.sub.wrapper.tagName,
      self.sub.wrapper.className.split(" ")
    );
    setTimeout(function() {
      ctx.invisible.style.width = newWidth + "px";
    }, 5);
  };

  /**
   * Remove this element from the DOM
   */
  Animation.prototype._removeElement = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.sub.settings.verbose) { console.log("_removeElement"); }

    /* Remove this word */
    ctx.invisible.removeEventListener(self.transitionEnd, self.steps[0], false);
    self.sub.wrapper.removeChild(ctx.word);
  };

  /**
   * Set the text of this element to ctx.newText and fade it in.
   */
  Animation.prototype._setTextAndFadeIn = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.sub.settings.verbose) { console.log("_setTextAndFadeIn"); }
    /* Sub the text then fade in */
    ctx.invisible.className = ctx.invisible.className.replace(self.animatingClass, "");
    ctx.visible.className += self.animatingClass;
    ctx.invisible.removeEventListener(self.transitionEnd, self.steps[0], false);
    self.steps.shift(); // pop _setTextAndFadeIn
    ctx.visible.addEventListener(self.transitionEnd, self.steps[0], false);
    ctx.visible.innerHTML = ctx.newText;
    ctx.invisible.innerHTML = ctx.newText;
    ctx.visible.style.opacity = 1;
  };

  /**
   * Remove animation classes, remove event listeners, and set widths to "auto"
   */
  Animation.prototype._cleanUp = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.sub.settings.verbose) { console.log("_cleanUp"); }

    /* Clean Up */
    ctx.invisible.className = ctx.invisible.className.replace(self.animatingClass, "");
    ctx.visible.className = ctx.visible.className.replace(self.animatingClass, "");
    ctx.visible.removeEventListener(self.transitionEnd, self.steps[0], false);
    ctx.invisible.style.width = "auto";
  };

  /**
   * Find the width that an element with a given tag and classes would have if
   * it contained the passed text.
   *
   * @param {string} text - the text to get the width of
   * @param {string} tag - the tag that the text will be put in
   * @param {string[]} classes - an array of classes associated with this
   *                             element.
   */
  Animation.prototype._calculateWordWidth = function(text, tag, classes) {
    var self = this;
    var elem = document.createElement(tag);
    classes = classes || [];
    classes.push(self.sub.settings.namespace + "-text-width-calculation");
    elem.setAttribute("class", classes.join(" "));
    elem.innerHTML = text;
    document.body.appendChild(elem);
    /* Get a decimal number of the form 12.455 */
    var width = parseFloat(window.getComputedStyle(elem, null).width);
    elem.parentNode.removeChild(elem);
    return width;
  };

  if (typeof define === 'function' && define.amd) {
    define(Sub);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sub;
  } else {
    global.Sub = Sub;
  }
}(this));
