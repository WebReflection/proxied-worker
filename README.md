# proxied-worker DEPRECATED - See [coincident](https://github.com/WebReflection/coincident#coincidentserver)

<sup>**Social Media Photo by [Ricardo Gomez Angel](https://unsplash.com/@ripato) on [Unsplash](https://unsplash.com/)**</sup>

A tiny utility to asynchronously drive a namespace exposed through a Shared/Service/Worker:

  * property access
  * functions invokes
  * instances creation ...
  * ... and instances methods invokes, or properties access

Instances reflected on the client are automatically cleared up on the worker though a dedicated *FinalizationRegistry*.

It is also possible, since `v0.5.0`, to use functions as arguments, although these are stored "*forever*", so use this feature with caution.
Bear in mind, the context is currently not propagated from the Worker, so if it's strictly needed, bind the listener before passing it as-is.


### Related + NodeJS

This module is a modern simplification of [workway](https://github.com/WebReflection/workway#readme), heavily inspired by [electroff](https://github.com/WebReflection/electroff#readme), but also **[available for NodeJS too](https://github.com/WebReflection/proxied-node#readme)** as a safer, lighter, and easier alternative.


## Compatibility / Requirements

This module works with latest browsers, as long as the following APIs are available:

  * [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)
  * [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
  * [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker)

**[Live Demo](https://webreflection.github.io/proxied-worker/test/)**

## API

The exported namespace provides a mechanism to await any part of it, including a top level `addEventListener` and `removeEventListener`, to allow listening to custom `postMessage` notifications from the Service/Shared/Worker.

See [worker.js](./test/worker.js) to better understand how this works.


## Example

```js
// client.js
import ProxiedWorker from 'https://unpkg.com/proxied-worker/client';

// point at the file that exports a namespace
const nmsp = ProxiedWorker('./worker.js');

// custom notifications from the Worker
nmsp.addEventListener('message', ({data: {action}}) => {
  if (action === 'greetings')
    console.log('Worker said hello 👋');
});

// v0.5.0+ use listenres like features
nmsp.on('listener', (action, type) => {
  console.log(action, 'called with type', type);
});

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
  on(type, callback) {
    setTimeout(() => {
      callback('Event', type);
    });
  },
  async delayed() {
    console.log('context', this.test);
    postMessage({action: 'greetings'});
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


## As SharedWorker

The `ProxiedWorker` signature is similar to a `Worker` one, plus an extra third argument that is the constructor to use.

In order to have a `SharedWorker`, this code might be used:

```js
// client.js
import ProxiedWorker from 'https://unpkg.com/proxied-worker/client';
const nmsp = ProxiedWorker('./shared-worker.js', {type: 'module'}, SharedWorker);

// shared-worker.js
import ProxiedWorker from 'https://unpkg.com/proxied-worker/module';
ProxiedWorker({
  // ...
});
```


## As ServiceWorker

Similarly to a `SharedWorker`, it is also possible to register and use a `ServiceWorker` to compute heavy tasks.

```js
// client.js
import ProxiedWorker from 'https://unpkg.com/proxied-worker/client';
const nmsp = ProxiedWorker('./service-worker.js', {scope: '/'}, ServiceWorker);

// service-worker.js
importScripts('https://unpkg.com/proxied-worker/server');

ProxiedWorker({
  // ...
});
```
