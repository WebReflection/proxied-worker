/*! (c) Andrea Giammarchi - ISC */

const APPLY = '.apply';
const NEW = '.new';

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

  addEventListener('message', message.bind(self));

  async function loopThrough($, list) {
    for (let i = 0, {length} = list; i < length; i++) {
      if (list[i].endsWith(NEW)) {
        const instance = new $[list[i].slice(0, -NEW.length)](...list[++i]);
        instances.get(this).set($ = String(uid++), instance);
      }
      else if (list[i].endsWith(APPLY))
        $ = await $[list[i].slice(0, -APPLY.length)](...list[++i]);
      else
        $ = await $[list[i]];
    }
    return $;
  }

  async function message({data: {id, list}}) {
    if (!/^proxied-worker:([^:]*?):-?\d+$/.test(id))
      return;

    if (!instances.has(this))
      instances.set(this, new Map);

    const instance = RegExp.$1;
    let result, error;
    if (instance.length) {
      const ref = instances.get(this);
      if (list.length) {
        try {
          result = await loopThrough.call(this, ref.get(instance), list);
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
        result = await loopThrough.call(this, Namespace, list);
      }
      catch ({message}) {
        error = message;
      }
    }
    this.postMessage({id, result, error});
  }
};
