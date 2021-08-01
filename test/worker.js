importScripts('../esm/server.js')

const isServiceWorker = 'clients' in self;
const clients = [];

// Example: ServiceWorker interaction
if (isServiceWorker)
  addEventListener('activate', event => {
    event.waitUntil(clients.claim());
  });
// SharedWorker fallback
else
  addEventListener('connect', ({source}) => {
    clients.push(source);
  });

ProxiedWorker({
  test: 'OK',
  sum(a, b) {
    return a + b;
  },
  on(type, cb) {
    setTimeout(cb, 500, type);
  },
  notify() {
    setTimeout(
      async () => {
        console.log('notifying');
        const data = {id: 'notify', args: [1, 2, 3]};
        // ServiceWorker claimed clients
        if (isServiceWorker) {
          for (const client of await self.clients.matchAll({type: 'all'}))
            client.postMessage(data);
        }
        // SharedWorker claimed clients
        else if (clients.length) {
          for (const client of clients)
            client.postMessage(data);
        }
        // Worker fallback
        else
          postMessage(data);
      },
      1000
    );
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
