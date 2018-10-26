substituteteacher.js ([demo][sub])
===========================

[![Build status](https://travis-ci.org/schlosser/substituteteacher.js.svg)](https://travis-ci.org/schlosser/substituteteacher.js)

[![Substitute Teacher](http://static.schlosser.io/ss/sub/sub.gif)][sub]

`substituteteacher.js` will rotate through a series of sentences, transitioning between each one.

## Quick Start

`substituteteacher.js` is easy to use. Add the script to your page, provide a target container and call `run()`.

#### Step 0: Install

[Download the latest release][download] or install from npm:

```bash
npm install substitute-teacher --save-dev
```

#### Step 1: Add the `substituteteacher.min.js` file

```html
<script src="substituteteacher.min.js"></script>
```

#### Step 2: Create your container element

```html
<div id="sub">Fallback Text</div>
```

#### Step 3: Init substituteteacher.js

```javascript
var sub = new Sub([
    "A daring JavaScript library for substitute teachers",
    "A hilarious JavaScript library for awesome taglines",
    "A svelte JavaScript library for sweet taglines",
    "A super fun and wholesome JavaScript library for sliding fun",
    "A JavaScript library for word substitution"
]).run();
```

## API

### Sub(_sentences_, [_options_])

The `Sub` constructor create a new instance of sub. The `sentences` parameter should be a list of sentence strings.  Customize the instance by passing the `options` parameter. The example below uses all options and their defaults:

```javascript
var opts = {
  containerId: "sub",
  namespace: "sub",
  interval: 5000,
  speed: 200,
  mobileWidth: null,
  verbose: false,
  random: false,
  best: true,
  clearOriginalContent: true,
};
var sub = new Sub([
    "A daring JavaScript library for subsitute teachers",
    "A hilarious JavaScript library for awesome taglines",
    "A svelte JavaScript library for sweet taglines",
    "A badass JavaScript library for sliding fun",
    "A JavaScript library for word substitution"
], opts).run();
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `containerId` | Id of the injection point for HTML | `"sub"`
| `namespace` | Namespace to prepend to classes used internally | `"sub"`
| `interval` | Number of milliseconds between each change | `5000`
| `speed` | Number of milliseconds that each step of the animation should take | `200`
| `mobileWidth` | If defined, the minimum screen size at which to enable the library | `null` 
| `verbose` | True to enable console logging | `false`
| `random` | True if the first sentence to appear should be random | `false`
| `best` | True if the sentences should be ordered to minimize the number of changes performed | `true`
| `clearOriginalContent` | True to empty container and fade in the substitute teacher, false to seamlessly transition from the original content to the first item. This only works if `random` is `false` | `true`

### run()

Starts the rotation between sentences, and attaches resize handlers (for disabling the library on small screens if `mobileWidth` is defined).

### stop()

Stops the rotation between sentences, and remove resize handlers.

[download]: https://github.com/schlosser/substituteteacher.js/releases/download/v0.4/substituteteacher.min.js
[sub]: http://schlosser.github.io/substituteteacher.js/
