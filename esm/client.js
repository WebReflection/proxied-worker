/*! (c) Andrea Giammarchi - ISC */

let uid = 0;

const post = (port, instance, list, $ = o => o) => new Promise((ok, err) => {
  let id = `proxied-worker:${instance}:${uid++}`;
  port.addEventListener('message', function message({
    data: {id: wid, result, error}
  }) {
    if (wid === id) {
      port.removeEventListener('message', message);
      if (error != null)
        err(new Error(error));
      else
        ok($(result));
    }
  });
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
  Worker = globalThis.Worker
) {

  const create = (id, list) => new Proxy(Proxied.bind({id, list}), handler);

  const registry = new FinalizationRegistry(instance => {
    port.postMessage({id: `proxied-worker:${instance}:-0`, list: []});
  });

  const worker = new Worker(path, options);
  const port = worker.port || worker;
  if (port !== worker)
    port.start();

  const handler = {
    apply(target, _, args) {
      const {id, list} = target();
      list[list.length - 1] += '.apply';
      list.push(args);
      return post(port, id, list);
    },
    construct(target, args) {
      const {id, list} = target();
      list[list.length - 1] += '.new';
      list.push(args);
      return post(port, id, list, result => {
        const proxy = create(result, []);
        registry.register(proxy, result);
        return proxy;
      });
    },
    get(target, key) {
      const {id, list} = target();
      switch (key) {
        case 'toJSON':
          return () => ({id, list});
        case 'then':
          return list.length ?
            (ok, err) => post(port, id, list).then(ok, err) :
            void 0;
      }
      return create(id, list.concat(key));
    }
  };

  return create('', []);
};

function Proxied() {
  return this;
}
