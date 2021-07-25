/*! (c) Andrea Giammarchi - ISC */

let uid = 0;

const post = (worker, instance, list, $ = o => o) => new Promise((ok, err) => {
  let id = `proxied-worker:${instance}:${uid++}`;
  worker.addEventListener('message', function message({
    data: {id: wid, result, error}
  }) {
    if (wid === id) {
      worker.removeEventListener('message', message);
      if (error != null)
        err(new Error(error));
      else
        ok($(result));
    }
  });
  worker.postMessage({id, list});
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
    worker.postMessage({id: `proxied-worker:${instance}:-0`, list: []});
  });

  const worker = new Worker(path, options);

  const handler = {
    apply(target, _, args) {
      const {id, list} = target();
      list[list.length - 1] += '.apply';
      list.push(args);
      return post(worker, id, list);
    },
    construct(target, args) {
      const {id, list} = target();
      list[list.length - 1] += '.new';
      list.push(args);
      return post(worker, id, list, result => {
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
            (ok, err) => post(worker, id, list).then(ok, err) :
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
