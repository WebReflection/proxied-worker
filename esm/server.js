/*! (c) Andrea Giammarchi - ISC */

const APPLY = 'apply';
const GET = 'get';
const NEW = 'new';

let uid = 0;

/**
 * Exports a namespace object with methods, properties, or classes.
 * @param {object} Namespace the exported namespace.
 */
globalThis.ProxiedWorker = function ProxiedWorker(Namespace) {
  const instances = new WeakMap;

  addEventListener('connect', ({ports = []}) => {
    for (const port of ports) {
      port.addEventListener('message', message.bind(port));
      port.start();
    }
  });

  addEventListener('message', message.bind(globalThis));

  async function loopThrough(_, $, list) {
    const action = list.shift();
    let {length} = list;

    if (action !== GET)
      length--;
    if (action === APPLY)
      length--;

    for (let i = 0; i < length; i++)
      $ = await $[list[i]];

    if (action === NEW) {
      const instance = new $(...list.pop().map(args, _));
      instances.get(this).set($ = String(uid++), instance);
    }
    else if (action === APPLY) {
      $ = await $[list[length]](...list.pop().map(args, _));
    }

    return $;
  }

  async function message(event) {
    const {source, data: {id, list}} = event;
    if (!/^proxied-worker:([^:]*?):-?\d+$/.test(id))
      return;

    const instance = RegExp.$1;
    const bus = source || this;

    if (!instances.has(this))
      instances.set(this, new Map);

    let result, error;
    if (instance.length) {
      const ref = instances.get(this);
      if (list.length) {
        try {
          result = await loopThrough.call(this, bus, ref.get(instance), list);
        }
        catch ({message}) {
          error = message;
        }
      }
      else {
        ref.delete(instance);
        return;
      }
    }
    else {
      try {
        result = await loopThrough.call(this, bus, Namespace, list);
      }
      catch ({message}) {
        error = message;
      }
    }

    bus.postMessage({id, result, error});
  }
};

const cbs = new Map;
function args(id) {
  if (typeof id === 'string') {
    if (/^proxied-worker:cb:/.test(id)) {
      if (!cbs.has(id))
        cbs.set(id, (...args) => { this.postMessage({id, args}); });
      return cbs.get(id);
    }
    return id.slice(1);
  }
  return id;
}
