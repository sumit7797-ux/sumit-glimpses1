// Shared by client and admin pages: same Firebase project = both pages are connected.
const $=id=>document.getElementById(id);
firebase.initializeApp(FB);
const db=firebase.firestore();
const _st=firebase.storage();
const assets={upload:async f=>{const r=_st.ref('uploads/'+Date.now()+'_'+f.name.replace(/[^\w.]/g,'_'));await r.put(f);return{url:await r.getDownloadURL()}}};
