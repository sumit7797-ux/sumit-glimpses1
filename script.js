const $=id=>document.getElementById(id),UPI="6295305574@ptyes";
let db=null,user=null,assets=null,cur=null,unsub=null,rating=0,isAdmin=false;
// 3D tilt
document.querySelectorAll('.tilt').forEach(c=>{c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`rotateY(${x*18}deg) rotateX(${-y*18}deg) translateZ(10px)`});c.addEventListener('pointerleave',()=>c.style.transform='')});
// stars
for(let i=1;i<=5;i++){const b=document.createElement('button');b.textContent='⭐';b.onclick=()=>{rating=i;[...$('stars').children].forEach((s,j)=>s.classList.toggle('on',j<i))};$('stars').appendChild(b)}
(function(){firebase.initializeApp(FB);db=firebase.firestore();const st=firebase.storage();
assets={upload:async f=>{const r=st.ref('uploads/'+Date.now()+'_'+f.name.replace(/[^\w.]/g,'_'));await r.put(f);return{url:await r.getDownloadURL()}}};
loadSamples();const al=$('adminLink');al.classList.remove('hide');al.textContent='Admin login';al.href='#';
al.onclick=e=>{if(!isAdmin){e.preventDefault();firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())}};
firebase.auth().onAuthStateChanged(u=>{if(u&&u.email===ADMIN_EMAIL){isAdmin=true;$('admin').classList.remove('hide');al.textContent='Admin';al.href='#admin';loadAdmin();loadSamples()}})})();
function gen(){return 'GLM-'+Math.floor(1000+Math.random()*9000)}
// ---- samples
let soundOn=false;
const sobs=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){document.querySelectorAll('#sgrid video').forEach(x=>{if(x!==v)x.pause()});v.muted=!soundOn;v.play().catch(()=>{v.muted=true;v.play().catch(()=>{})})}else v.pause()}),{threshold:.6});
function applySound(){document.querySelectorAll('#sgrid video').forEach(v=>v.muted=!soundOn);$('snd').textContent=soundOn?'🔊 Sound on':'🔇 Sound off'}
$('snd').onclick=()=>{soundOn=!soundOn;applySound()};
function loadSamples(){if(window._su)window._su();window._su=db.collection('samples').onSnapshot(s=>{const g=$('sgrid');g.innerHTML='';const docs=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.at-a.at);$('sempty').classList.toggle('hide',docs.length>0);
docs.forEach(o=>{const c=document.createElement('div');c.className='tilt sm';let m;if(o.kind==='image'){m=document.createElement('img');m.src=o.url}else{m=document.createElement('video');m.src=o.url;m.loop=true;m.muted=true;m.playsInline=true;m.controls=true;m.setAttribute('controlsList','nodownload');sobs.observe(m)}
const t=document.createElement('p');t.textContent=o.title||'';c.append(m,t);
if(isAdmin){const b=document.createElement('button');b.className='btn ghost';b.style.padding='4px 12px';b.textContent='🗑 Remove';b.onclick=()=>db.collection('samples').doc(o.id).delete();c.appendChild(b)}
g.appendChild(c)});applySound()})}
$('sadd').onclick=async()=>{const f=$('sf').files[0];if(!f){$('smsg').textContent='Choose a file first.';return}$('smsg').textContent='Uploading…';
try{const r=await assets.upload(f);await db.collection('samples').doc('s'+Date.now()).set({title:$('st').value.trim(),url:r.url,kind:f.type.startsWith('image')?'image':'video',at:Date.now()});$('smsg').textContent='Sample added ✔';$('st').value='';$('sf').value=''}catch(e){$('smsg').textContent='Failed: '+(e.message||'error')}};
// ---- client
$('go').onclick=open;$('code').onkeydown=e=>{if(e.key==='Enter')open()};
async function open(){const c=$('code').value.trim().toUpperCase();if(!c)return;if(!db){$('pmsg').textContent='Portal not available right now — please sign in and retry.';return}
$('pmsg').textContent='Checking…';try{const s=await db.collection('orders').doc(c).get();if(!s.exists){$('pmsg').textContent='Code not found. Please check and try again.';return}
$('pmsg').textContent='';cur=c;if(unsub)unsub();unsub=db.collection('orders').doc(c).onSnapshot(sn=>render(sn.data()))}catch(e){$('pmsg').textContent='Could not open. Try again.'}}
let lastUrl='';
function render(o){if(!o)return;$('view').classList.remove('hide');$('vt').textContent=o.title||('Video for '+o.client);
const paid=!!o.paid;$('vb').textContent=paid?'✅ Unlocked':'🔒 Preview 50%';$('vb').className='badge '+(paid?'b-ok':'b-lock');
const v=$('vid');if(lastUrl!==o.url){lastUrl=o.url;v.src=o.url}
$('paybox').classList.toggle('hide',paid);$('thanks').classList.toggle('hide',!paid);$('cn').textContent=o.client||'friend';
$('amt').textContent=o.price;if(!paid){const link=`upi://pay?pa=${UPI}&pn=${encodeURIComponent('Sumit Kumar Shaw')}&am=${o.price}&cu=INR&tn=${encodeURIComponent('Sumit Glimpses '+cur)}`;
$('qr').innerHTML='';new QRCode($('qr'),{text:link,width:170,height:170});$('upilink').href=link}
if(o.utr&&!paid)$('paymsg').textContent='✔ Transaction ID sent. Sumit will verify and unlock your video shortly.';
if(paid)$('lock').style.display='none';v.dataset.paid=paid?'1':''}
const v=$('vid');
function guard(){if(v.dataset.paid||!v.duration)return;const half=v.duration/2;if(v.currentTime>=half){v.pause();v.currentTime=Math.max(0,half-.3);$('lock').style.display='flex'}else $('lock').style.display='none'}
v.addEventListener('timeupdate',guard);v.addEventListener('seeking',guard);v.addEventListener('contextmenu',e=>e.preventDefault());
$('sendutr').onclick=async()=>{const u=$('utr').value.trim();if(u.length<6){$('paymsg').textContent='Please enter a valid transaction ID.';return}
try{await db.collection('claims').doc(cur).set({utr:u,at:Date.now()});$('paymsg').textContent='✔ Sent! Sumit will verify and unlock your video.'}catch(e){$('paymsg').textContent='Could not send. Try again.'}};
$('sendfb').onclick=async()=>{if(!rating){$('fbmsg').textContent='Please choose a star rating.';return}
try{await db.collection('feedback').doc(cur).set({rating,text:$('fb').value,at:Date.now()});$('fbmsg').textContent='💖 Thank you for your feedback!'}catch(e){$('fbmsg').textContent='Could not send.'}};
$('dl').onclick=()=>{const a=document.createElement('a');a.href=lastUrl;a.download='SumitGlimpses-'+cur+'.mp4';a.click()};
// ---- admin
$('add').onclick=async()=>{const f=$('af').files[0],n=$('an').value.trim(),p=+$('ap').value;if(!f||!n||!p){$('amsg').textContent='Fill name, price and choose a video.';return}
if(!assets){$('amsg').textContent='Uploads unavailable.';return}$('amsg').textContent='Uploading…';
try{const r=await assets.upload(f);const c=gen();await db.collection('orders').doc(c).set({client:n,price:p,url:r.url,paid:false,title:'Video for '+n,at:Date.now()});$('amsg').textContent='Created! Send this code to '+n+': '+c}catch(e){$('amsg').textContent='Failed: '+(e.message||'upload error')}};
function loadAdmin(){if(!db)return;let orders=[],claims={};
const draw=()=>{$('rows').innerHTML='';orders.sort((a,b)=>b.at-a.at).forEach(o=>{const tr=document.createElement('tr'),cl=claims[o.id];
const cells=[o.id,o.client,'',o.paid?'✅ Paid':(cl?'⏳ Verify':'🔒 Unpaid'),cl?cl.utr:'—'];
cells.forEach((t,i)=>{const td=document.createElement('td');if(i==2){const inp=document.createElement('input');inp.type='number';inp.value=o.price;inp.style.width='90px';inp.onchange=()=>db.collection('orders').doc(o.id).update({price:+inp.value});td.appendChild(inp)}else td.textContent=t;tr.appendChild(td)});
const td=document.createElement('td'),b=document.createElement('button');b.className='btn ghost';b.style.padding='6px 14px';b.textContent=o.paid?'Lock again':'Approve';b.onclick=()=>db.collection('orders').doc(o.id).update({paid:!o.paid});td.appendChild(b);tr.appendChild(td);$('rows').appendChild(tr)})};
db.collection('orders').onSnapshot(s=>{orders=s.docs.map(d=>({id:d.id,...d.data()}));draw()});
db.collection('claims').onSnapshot(s=>{claims={};s.docs.forEach(d=>claims[d.id]=d.data());draw()});
db.collection('feedback').onSnapshot(s=>{if(s.empty)return;$('fbs').textContent='';s.docs.forEach(d=>{const x=d.data(),p=document.createElement('p');p.textContent=d.id+' — '+'⭐'.repeat(x.rating)+' '+(x.text||'');$('fbs').appendChild(p)})})}
