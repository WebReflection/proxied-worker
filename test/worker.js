importScripts('../server.js');

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
