/*! (c) Andrea Giammarchi - ISC */

const {navigator, ServiceWorker, SharedWorker, Worker} = globalThis;
const {isArray} = Array;

const ids = [];
const cbs = [];

const callbacks = ({data: {id, args}}) => {
  if (isArray(args)) {
    const i = ids.indexOf(id);
    if (-1 < i)
      cbs[i](...args);
  }
};

const worker = $ => $ instanceof ServiceWorker ? navigator.serviceWorker : $;

let uid = 0;
const post = (
  port, instance, list,
  args = null,
  $ = o => o
) => new Promise((ok, err) => {
  let id = `proxied-worker:${instance}:${uid++}`;
  const target = worker(port);
  target.addEventListener('message', function message({
    data: {id: wid, result, error}
  }) {
    if (wid === id) {
      target.removeEventListener('message', message);
      if (error != null)
        err(new Error(error));
      else
        ok($(result));
    }
  });
  if (isArray(args)) {
    list.push(args);
    for (let i = 0, {length} = args; i < length; i++) {
      switch (typeof args[i]) {
        case 'string':
          args[i] = '$' + args[i];
          break;
        case 'function':
          target.addEventListener('message', callbacks);
          let index = cbs.indexOf(args[i]);
          if (index < 0) {
            index = cbs.push(args[i]) - 1;
            ids[index] = `proxied-worker:cb:${uid++ + Math.random()}`;
          }
          args[i] = ids[index];
          break;
      }
    }
  }
  port.postMessage({id, list});
});

/**
 * Returns a proxied namespace that can await every property, method,
 * or create instances within the Worker.
 * @param {string} path the Worker file that exports the namespace.
 * @returns {Proxy}
 */
export default function ProxiedWorker(
  path,
  options = {type: 'classic'},
  Kind = Worker
) {

  const create = (id, list) => new Proxy(Proxied.bind({id, list}), handler);

  const registry = new FinalizationRegistry(instance => {
    bus.then(port => port.postMessage({
      id: `proxied-worker:${instance}:-0`,
      list: []
    }));
  });

  const bus = new Promise($ => {
    if (Kind === SharedWorker) {
      const {port} = new Kind(path, options);
      port.start();
      $(port);
    }
    else if (Kind === ServiceWorker)
      navigator.serviceWorker.register(path, options).then(
        ({installing, waiting, active}) => $(installing || waiting || active)
      );
    else
      $(new Kind(path, options));
  });

  const cbs = new WeakMap;

  const handler = {
    apply(target, _, args) {
      const {id, list} = target();
      list[list.length - 1] += '.apply';
      for (let i = 0, {length} = args; i < length; i++) {
        if (typeof args[i] === 'function') {
          if (!cbs.has(target))
            cbs.set(target, new Map);
          const bound = cbs.get(target);
          if (!bound.has(args[i]))
            bound.set(args[i], args[i].bind(_));
          args[i] = bound.get(args[i]);
        }
      }
      return bus.then(port => post(port, id, list, args));
    },
    construct(target, args) {
      const {id, list} = target();
      list[list.length - 1] += '.new';
      return bus.then(port => post(port, id, list, args, result => {
        const proxy = create(result, []);
        registry.register(proxy, result);
        return proxy;
      }));
    },
    get(target, key) {
      const {id, list} = target();
      const {length} = list;
      switch (key) {
        case 'then':
          return length ?
            (ok, err) => bus.then(port => post(port, id, list).then(ok, err)) :
            void 0;
        case 'addEventListener':
        case 'removeEventListener':
          if (!length && !id)
            return (...args) => bus.then(port => {
              worker(port)[key](...args);
            });
      }
      return create(id, list.concat(key));
    }
  };

  return create('', []);
};

function Proxied() {
  return this;
}
