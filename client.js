/*! (c) Andrea Giammarchi - ISC */
let e=0;const t=(t,n,r,s=(e=>e))=>new Promise(((i,o)=>{let l=`proxied-worker:${n}:${e++}`;t.addEventListener("message",(function e({data:{id:n,result:r,error:u}}){n===l&&(t.removeEventListener("message",e),null!=u?o(new Error(u)):i(s(r)))})),t.postMessage({id:l,list:r})}));function n(e,n=globalThis.Worker){const s=(e,t)=>new Proxy(r.bind({id:e,list:t}),l),i=new FinalizationRegistry((e=>{o.postMessage({id:`proxied-worker:${e}:0`,list:[]})})),o=new n(e),l={apply(e,n,r){const{id:s,list:i}=e();return i[i.length-1]+=".apply",i.push(r),t(o,s,i)},construct(e,n){const{id:r,list:l}=e();return l[l.length-1]+=".new",l.push(n),t(o,r,l,(e=>{const t=s(e,[]);return i.register(t,e),t}))},get(e,n){const{id:r,list:i}=e();switch(n){case"toJSON":return()=>({id:r,list:i});case"then":return i.length?(e,n)=>t(o,r,i).then(e,n):void 0}return s(r,i.concat(n))}};return s("",[])}function r(){return this}export default n;