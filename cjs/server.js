'use strict';
/*! (c) Andrea Giammarchi - ISC */

const APPLY = '.apply';
const NEW = '.new';

let uid = 0;

/**
 * Exports a namespace object with methods, properties, or classes.
 * @param {object} Namespace the exported namespace.
 */
globalThis.ProxiedWorker = function ProxiedWorker(Namespace) {
  const instances = new Map;

  const loopThrough = async ($, list) => {
    for (let i = 0, {length} = list; i < length; i++) {
      if (list[i].endsWith(NEW)) {
        const instance = new $[list[i].slice(0, -NEW.length)](...list[++i]);
        instances.set($ = String(uid++), instance);
      }
      else if (list[i].endsWith(APPLY))
        $ = await $[list[i].slice(0, -APPLY.length)](...list[++i]);
      else
        $ = await $[list[i]];
    }
    return $;
  };

  addEventListener('message', async ({data: {id, list}}) => {
    if (!/^proxied-worker:([^:]*?):-?\d+$/.test(id))
      return;

    const instance = RegExp.$1;
    let result, error;
    if (instance.length) {
      if (list.length) {
        try {
          result = await loopThrough(instances.get(instance), list);
        }
        catch ({message}) {
          error = message;
        }
      }
      else {
        instances.delete(instance);
        return;
      }
    }
    else {
      try {
        result = await loopThrough(Namespace, list);
      }
      catch ({message}) {
        error = message;
      }
    }
    postMessage({id, result, error});
  });
};
