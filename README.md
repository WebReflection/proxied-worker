# proxied-worker

<sup>**Social Media Photo by [Ricardo Gomez Angel](https://unsplash.com/@ripato) on [Unsplash](https://unsplash.com/)**</sup>

A tiny utility to asynchronously drive a namespace exposed through a Worker:

  * property access
  * functions invokes
  * instances creation ...
  * ... and instances methods invokes, or properties access

Instances reflected on the client are automatically cleared up on the worker though a dedicated *FinalizationRegistry*.


## Compatibility / Requirements

This module works with latest browsers, as long as the following APIs are available:

  * [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)
  * [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
  * [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker)

**[Live Demo](https://webreflection.github.io/proxied-worker/test/)**


## Example

```js
// client.js
import ProxiedWorker from 'https://unpkg.com/proxied-worker/client';

// point at the file that exports a namespace
const nmsp = ProxiedWorker('./worker.js');

// access its properties
console.log(await nmsp.test);

// or its helpers
console.log(await nmsp.sum(1, 2));
await nmsp.delayed();

// or create instances
const instance = await new nmsp.Class('🍻');
// and invoke their methods
console.log(await instance.sum(1, 2));

// - - - - - - - - - - - - - - - - - - - - - - 

// worker.js
importScripts('https://unpkg.com/proxied-worker/server');

ProxiedWorker({
  test: 'OK',
  sum(a, b) {
    return a + b;
  },
  async delayed() {
    console.log('context', this.test);
    return await new Promise($ => setTimeout($, 500, Math.random()));
  },
  Class: class {
    constructor(name) {
      this.name = name;
    }
    sum(a, b) {
      console.log(this.name, a, b);
      return a + b;
    }
  }
});
```

Alternatively, if the browser supports workers as module:

```js
// client.js
import ProxiedWorker from 'https://unpkg.com/proxied-worker/client';
const nmsp = ProxiedWorker('./worker.js', {type: 'module'});

// worker.js
import ProxiedWorker from 'https://unpkg.com/proxied-worker/module';
ProxiedWorker({
  // ...
});
```
