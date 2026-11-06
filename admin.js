const $=s=>document.querySelector(s), money=n=>'Rs. '+Number(n||0).toLocaleString('en-PK');
const read=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k));return x??d}catch(e){return d}};
let products=read('luxoriaProducts',[]),orders=read('luxoriaOrders',[]),blogs=read('luxoriaBlogs',null),history=read('luxoriaAdminHistory',[]),localPreviewMode=false;
if(!products.length){products=Array.from({length:24},(_,i)=>({id:i+1,name:['Aeris','Darkshade','Royal','pleasure'][i%4],category:['Unisex','Unisex','Men','Women'][i%4],price:[1850,2000,2200,2200][i%4],description:'A considered signature fragrance.',tag:'Signature',image:`${[1,13,15,26][i%4]}${i%4===3?'.jpeg':'.png'}`,stock:10,sold:0}));save('luxoriaProducts',products)}
if(!blogs)blogs=[{title:'How to discover your signature scent',body:'Your signature scent should feel natural to your style. Begin with notes you already enjoy, then explore one new family at a time.',image:'perfume-16.svg',category:'DISCOVERY'},{title:'Understanding fragrance notes',body:'Many fragrances unfold in layers: a first impression, a heart and a lasting base.',image:'perfume-08.svg',category:'SCENT NOTES'},{title:'Choosing perfume for the occasion',body:'Light, fresh profiles can suit daytime routines, while richer woods, amber and spice can feel especially inviting in the evening.',image:'perfume-14.svg',category:'STYLE GUIDE'}];
let serverSaveQueue=Promise.resolve();
function save(k,v){
 localStorage.setItem(k,JSON.stringify(v));
 const map={'luxoriaProducts':'products','luxoriaBlogs':'blogs','luxoriaPageContent':'pages','luxoriaAnnouncement':'announcement','luxoriaOrders':'orders','luxoriaAdminHistory':'history','luxoriaSiteImages':'images'};
 const key=map[k]; if(!key || localPreviewMode)return;
 serverSaveQueue=serverSaveQueue.then(()=>fetch('api.php?action=save',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,value:v})}))
 .then(r=>r.json()).then(x=>{if(!x.ok)showToast(x.error||'Could not sync to live server')})
 .catch(()=>showToast('Server connection failed. Changes are not live yet.'));
}
async function uploadImage(file){
 const fd=new FormData();fd.append('image',file);
 const r=await fetch('api.php?action=upload',{method:'POST',credentials:'same-origin',body:fd});
 const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Image upload failed');return j.url;
}
async function loadRemote(){
 const r=await fetch('api.php?action=admin-data',{credentials:'same-origin',cache:'no-store'});
 const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Could not load dashboard data');
 products=j.products||[];blogs=j.blogs||[];orders=j.orders||[];history=j.history||[];
 localStorage.setItem('luxoriaProducts',JSON.stringify(products));
 localStorage.setItem('luxoriaBlogs',JSON.stringify(blogs));
 localStorage.setItem('luxoriaPageContent',JSON.stringify(j.pages||{}));
 localStorage.setItem('luxoriaAnnouncement',j.announcement||'');
 localStorage.setItem('luxoriaOrders',JSON.stringify(orders));
 localStorage.setItem('luxoriaAdminHistory',JSON.stringify(history));
 localStorage.setItem('luxoriaSiteImages',JSON.stringify(j.images||{}));
}
function log(action,detail){history.unshift({action,detail,date:new Date().toLocaleString()});history=history.slice(0,250);save('luxoriaAdminHistory',history)}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function img(p){return String(p.image||'').startsWith('data:')?p.image:'assets/'+(p.image||'luxoria-logo.svg')}
function showToast(t){let x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
function saveProducts(){save('luxoriaProducts',products)}
function activate(){ $('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');const status=$('.live-dot');if(status)status.textContent=localPreviewMode?'LOCAL PREVIEW':'LIVE STORE';const foot=$('.main footer');if(foot)foot.textContent=localPreviewMode?'Local preview · Changes and test orders are saved in this browser':'Luxoria Scents Admin · Changes are saved to the live store';render('overview')}
function activateLocalPreview(){
 localPreviewMode=true;
 products=read('luxoriaProducts',products);
 orders=read('luxoriaOrders',orders);
 blogs=read('luxoriaBlogs',blogs||[]);
 history=read('luxoriaAdminHistory',history);
 activate();
 showToast('Local preview mode: orders and edits are saved in this browser only.');
}
$('#loginForm').addEventListener('submit',async e=>{
 e.preventDefault();$('#loginError').textContent='';
 try{
  const r=await fetch('api.php?action=login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#adminPassword').value})});
  const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||'Login failed');
  await loadRemote();activate();
 }catch(err){
  const host=window.location.hostname;
  if(host==='localhost'||host==='127.0.0.1'||host==='::1') activateLocalPreview();
  else $('#loginError').textContent=err.message||'Unable to connect to server.';
 }
});
(async()=>{
 try{
  const r=await fetch('api.php?action=status',{credentials:'same-origin'});
  const j=await r.json();
  if(j.ok){await loadRemote();activate();}
 }catch(e){
  const host=window.location.hostname;
  if(host==='localhost'||host==='127.0.0.1'||host==='::1') activateLocalPreview();
 }
})();
$('#logout').onclick=async()=>{try{await fetch('api.php?action=logout',{method:'POST',credentials:'same-origin'})}catch(e){}location.reload()};
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x===b));render(b.dataset.view)});
$('#topViewSite').onclick=()=>window.open('index.html','_blank');
function pageHead(title,sub,button=''){return `<div class="page-head"><div><h3>${title}</h3><p>${sub}</p></div>${button}</div>`}
function stat(label,value,note){return `<div class="stat"><span class="label">${label}</span><strong>${value}</strong><small>${note}</small></div>`}
function recentOrders(){return orders.slice(0,6).map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.customer)}</td><td>${money(o.total)}</td><td>${o.qty}</td><td><span class="pill green">${esc(o.status||'New Order')}</span></td><td>${esc(o.date)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No confirmed sales recorded yet.</td></tr>'}
function overview(){let revenue=orders.reduce((n,o)=>n+Number(o.total),0),sold=orders.reduce((n,o)=>n+Number(o.qty),0),low=products.filter(p=>Number(p.stock)<=5).length;return pageHead('Store Overview','A quick look at your Luxoria Scents performance.')+`<div class="stats">${stat('Total Revenue',money(revenue),'From confirmed orders')}${stat('Units Sold',sold,'Across all recorded orders')}${stat('Products',products.length,'In your catalogue')}${stat('Low Stock',low,'Products with 5 or fewer units')}</div><div class="grid-two"><section class="panel"><h3>Recent Sales</h3><div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Qty</th><th>Status</th><th>Date</th></tr></thead><tbody>${recentOrders()}</tbody></table></div><p style="margin-top:18px"><button class="btn small" onclick="render('orders')">Manage Orders →</button></p></section><section class="panel"><h3>Inventory Snapshot</h3>${products.slice().sort((a,b)=>a.stock-b.stock).slice(0,6).map(p=>`<div style="margin:15px 0"><div style="display:flex;justify-content:space-between;font-size:11px"><b>${esc(p.name)}</b><span class="muted">${p.stock} units</span></div><div class="bar"><i style="width:${Math.min(100,Math.max(3,p.stock*5))}%"></i></div></div>`).join('')}<button class="btn small" onclick="render('inventory')">View Inventory →</button></section></div>`}
function productRows(list){return list.map(p=>`<tr><td><div class="product-cell"><img src="${img(p)}"><div><b>${esc(p.name)}</b><div class="muted">#${p.id}</div></div></div></td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td>${p.stock<=0?'<span class="pill red">Out of stock</span>':p.stock<=5?'<span class="pill">Low stock</span>':'<span class="pill green">In stock</span>'}</td><td>${p.sold||0}</td><td><div class="actions"><button class="btn small" onclick="editProduct(${p.id})">Edit</button><button class="btn small danger" onclick="deleteProduct(${p.id})">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="6" class="empty">No products found.</td></tr>'}
function productsView(){return pageHead('Products','Add, edit and manage your fragrance catalogue.','<button class="btn gold" onclick="editProduct()">＋ Add Product</button>')+`<div class="toolbar"><input id="productSearch" placeholder="Search products..."><select id="productFilter"><option value="">All categories</option><option>Men</option><option>Women</option><option>Unisex</option></select></div><section class="panel table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Units Sold</th><th>Actions</th></tr></thead><tbody id="productRows">${productRows(products)}</tbody></table></section>`}
function bindProductSearch(){let draw=()=>{let q=($('#productSearch')?.value||'').toLowerCase(),c=$('#productFilter')?.value||'';$('#productRows').innerHTML=productRows(products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(q)&&(!c||p.category.toLowerCase()===c.toLowerCase())))};$('#productSearch').oninput=draw;$('#productFilter').onchange=draw}
function editProduct(id){let p=products.find(x=>x.id===id)||{id:null,name:'',category:'Unisex',price:0,description:'',tag:'New',image:'',stock:0,sold:0};$('#modalContent').innerHTML=`<h2>${id?'Edit Product':'Add New Product'}</h2><form id="productForm"><div class="form-grid"><label>Product Name<input name="name" required value="${esc(p.name)}"></label><label>Category<select name="category"><option ${p.category.toLowerCase()==='men'?'selected':''}>Men</option><option ${p.category.toLowerCase()==='women'?'selected':''}>Women</option><option ${p.category.toLowerCase()==='unisex'?'selected':''}>Unisex</option></select></label><label>Price (PKR)<input name="price" type="number" min="0" required value="${p.price}"></label><label>Stock Quantity<input name="stock" type="number" min="0" required value="${p.stock??0}"></label><label>Product Tag<input name="tag" value="${esc(p.tag||'')}"></label><label>Image File<input name="imageFile" type="file" accept="image/*"></label><label class="wide">Description<textarea name="description">${esc(p.description||'')}</textarea></label><div class="wide"><img id="imagePreview" class="image-preview" src="${p.image?img(p):'assets/luxoria-logo.svg'}"><p class="muted">Upload a new product image or keep the current one.</p></div></div><button class="btn gold">Save Product</button></form>`;openModal();let image=p.image;$('#productForm [name=imageFile]').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{showToast('Uploading image...');image=await uploadImage(f);$('#imagePreview').src=image;showToast('Image uploaded')}catch(err){showToast(err.message)}};$('#productForm').onsubmit=e=>{e.preventDefault();let f=new FormData(e.currentTarget),data={...p,name:f.get('name').trim(),category:f.get('category'),price:Number(f.get('price')),stock:Number(f.get('stock')),tag:f.get('tag'),description:f.get('description'),image:image||'perfume-01.svg'};if(p.id){products=products.map(x=>x.id===p.id?data:x);log('Product updated',data.name)}else{data.id=Math.max(0,...products.map(x=>Number(x.id)||0))+1;data.sold=0;products.unshift(data);log('Product added',data.name)}saveProducts();closeModal();render('products');showToast('Product saved successfully')}}
function deleteProduct(id){let p=products.find(x=>x.id===id);if(!p||!confirm(`Delete ${p.name}?`))return;products=products.filter(x=>x.id!==id);saveProducts();log('Product deleted',p.name);render('products');showToast('Product deleted')}
function inventory(){let rows=products.slice().sort((a,b)=>a.stock-b.stock).map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${p.stock<=0?'<span class="pill red">Out of stock</span>':p.stock<=5?'<span class="pill">Low stock</span>':'<span class="pill green">In stock</span>'}</td><td><input aria-label="Stock quantity" id="stock-${p.id}" type="number" min="0" value="${p.stock}" style="width:85px;margin:0;padding:7px"></td><td><button class="btn small" onclick="updateStock(${p.id})">Update</button></td></tr>`).join('');return pageHead('Inventory','Keep stock levels accurate and identify products that need restocking.')+`<section class="panel table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Status</th><th>Quantity</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></section>`}
function updateStock(id){let p=products.find(x=>x.id===id),v=Number($('#stock-'+id).value);if(v<0||!Number.isFinite(v))return; p.stock=v;saveProducts();log('Stock updated',`${p.name}: ${v} units`);render('inventory');showToast('Stock updated')}
function ordersView(){
 let revenue=orders.reduce((n,o)=>n+Number(o.total),0),qty=orders.reduce((n,o)=>n+Number(o.qty),0);
 return pageHead('Orders & Sales','Website orders are saved automatically. Review customer, delivery and order details.','<button class="btn gold" onclick="newOrder()">＋ Record Sale</button>')+
 `<div class="stats">${stat('Total Revenue',money(revenue),'From recorded orders')}${stat('Orders',orders.length,'Total recorded orders')}${stat('Units Sold',qty,'Total quantity')}${stat('Average Order',money(orders.length?revenue/orders.length:0),'Per recorded order')}</div>
 <section class="panel table-wrap"><table><thead><tr><th>Order ID</th><th>Customer & Contact</th><th>Delivery Address</th><th>Products</th><th>Qty</th><th>Total</th><th>Date</th><th></th></tr></thead><tbody>
 ${orders.map(o=>`<tr>
 <td><b>${esc(o.id)}</b><div class="muted">${esc(o.status||'Confirmed')}</div></td>
 <td><b>${esc(o.customer)}</b><div class="muted">${esc(o.email||'')}</div><div class="muted">${esc(o.phone||'')}</div></td>
 <td>${esc(o.address||'—')}<div class="muted">${esc(o.city||'')}${o.postal?' · '+esc(o.postal):''}</div></td>
 <td>${esc((o.items||[]).map(i=>i.name+' × '+i.qty).join(', '))}<div class="muted">${esc(o.payment||'')}</div>${o.note?`<div class="muted">Note: ${esc(o.note)}</div>`:''}</td>
 <td>${Number(o.qty||0)}</td><td>${money(o.total)}</td><td>${esc(o.date||'')}</td>
 <td><button class="btn small danger" onclick="deleteOrder('${esc(o.id)}')">Remove</button></td>
 </tr>`).join('')||'<tr><td colspan="8" class="empty">No orders received yet. Website orders will appear here automatically.</td></tr>'}
 </tbody></table></section>`;
}
function newOrder(){if(!products.length){showToast('Add a product first');return}$('#modalContent').innerHTML=`<h2>Record Confirmed Sale</h2><form id="orderForm"><div class="form-grid"><label>Customer Name<input name="customer" required placeholder="Customer name"></label><label>Order Date<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label class="wide">Product<select name="product">${products.map(p=>`<option value="${p.id}" ${p.stock<=0?'disabled':''}>${esc(p.name)} — ${money(p.price)} (${p.stock} in stock)</option>`).join('')}</select></label><label>Quantity<input name="qty" type="number" min="1" value="1" required></label><label>Payment / Note<input name="note" placeholder="Paid / COD / Reference"></label></div><p class="content-note">Saving this sale increases units sold, reduces stock and adds the order to your sales history.</p><button class="btn gold">Save Confirmed Sale</button></form>`;openModal();$('#orderForm').onsubmit=e=>{e.preventDefault();let f=new FormData(e.currentTarget),p=products.find(x=>x.id===Number(f.get('product'))),q=Number(f.get('qty'));if(!p||q<1||q>p.stock){alert('Quantity is greater than available stock. Please update stock first.');return}p.stock-=q;p.sold=(p.sold||0)+q;let o={id:'LS-'+Date.now().toString().slice(-7),customer:f.get('customer'),date:f.get('date'),note:f.get('note'),items:[{id:p.id,name:p.name,qty:q,price:p.price}],qty:q,total:p.price*q};orders.unshift(o);saveProducts();save('luxoriaOrders',orders);log('Sale recorded',`${p.name} × ${q} — ${money(o.total)}`);closeModal();render('orders');showToast('Sale recorded and stock updated')}}
function deleteOrder(id){if(!confirm('Remove this sales record? Stock will be restored.'))return;let o=orders.find(x=>x.id===id);if(!o)return;o.items.forEach(i=>{let p=products.find(x=>x.id===i.id);if(p){p.stock+=i.qty;p.sold=Math.max(0,(p.sold||0)-i.qty)}});orders=orders.filter(x=>x.id!==id);saveProducts();save('luxoriaOrders',orders);log('Sales record removed',id+' (stock restored)');render('orders')}
function contentView(){let pages=[['home','Home'],['about','About Us'],['story','Our Story'],['mens',"Men's Perfumes"],['womens',"Women's Perfumes"],['unisex','Unisex Fragrances'],['new','New Arrivals'],['best','Best Sellers'],['blogs','Blogs'],['contact','Contact Us'],['faqs','FAQs'],['shipping','Shipping Policy'],['returns','Return Policy'],['privacy','Privacy Policy']];return pageHead('Website Content','Edit page headings, introductions, announcement text and key website images.')+`<div class="grid-two"><section class="panel"><h3>Website Images</h3><p class="muted">Upload images for the homepage banner, About page and Our Story section. Changes publish to the live website.</p><form id="siteImagesForm"><label>Homepage Banner Image<input type="file" name="homeHero" accept="image/*"></label><label>About Us Main Image<input type="file" name="aboutImage" accept="image/*"></label><label>Our Story / Homepage Story Image<input type="file" name="storyImage" accept="image/*"></label><button class="btn gold">Save Website Images</button></form></section><section class="panel"><h3>Announcement Bar</h3><form id="announcementForm"><label>Announcement text<textarea name="announcement">${esc(localStorage.getItem('luxoriaAnnouncement')??'Complimentary fragrance discovery with every order · Crafted for your signature')}</textarea></label><button class="btn gold">Save Announcement</button></form></section><section class="panel"><h3>Page Heading & Intro</h3><form id="pageContentForm"><label>Select Website Page<select name="page">${pages.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('')}</select></label><label>Page Heading<input name="title" placeholder="Enter page heading"></label><label>Intro / Subtitle<textarea name="intro" placeholder="Enter the short introduction shown under the heading"></textarea></label><label>Additional Page Content<textarea name="body" rows="6" placeholder="Add or update page-specific text content"></textarea></label><button class="btn gold">Save Page Content</button></form><p class="content-note">This edits the hero heading and intro text for the selected page. Product catalogue, policies and deeper page sections remain part of the original website layout.</p></section></div>`}
function bindContent(){
 const imageForm=$('#siteImagesForm');
 imageForm.onsubmit=async e=>{
  e.preventDefault();const data=read('luxoriaSiteImages',{});
  for(const key of ['homeHero','aboutImage','storyImage']){
   const file=imageForm.elements[key].files[0];if(!file)continue;
   try{showToast('Uploading '+key+'...');data[key]=await uploadImage(file);}
   catch(err){showToast(err.message);return;}
  }
  save('luxoriaSiteImages',data);log('Website images updated','Homepage, About and Our Story image settings');showToast('Website images saved to live website.');
 };
 $('#announcementForm').onsubmit=e=>{e.preventDefault();let v=new FormData(e.currentTarget).get('announcement');save('luxoriaAnnouncement',v);log('Announcement updated',v);showToast('Announcement saved. Refresh website to view.')};const form=$('#pageContentForm'),page=form.elements.page,store=read('luxoriaPageContent',{});function load(){let v=store[page.value]||{};form.elements.title.value=v.title||'';form.elements.intro.value=v.intro||'';form.elements.body.value=v.body||''}page.onchange=load;load();form.onsubmit=e=>{e.preventDefault();store[page.value]={title:form.elements.title.value.trim(),intro:form.elements.intro.value.trim(),body:form.elements.body.value.trim()};save('luxoriaPageContent',store);log('Page content updated',page.options[page.selectedIndex].text);showToast('Page content saved. Refresh website to view.')}}
function blogsView(){return pageHead('Blog Manager','Publish, edit and remove articles from the Fragrance Journal.','<button class="btn gold" onclick="editBlog()">＋ Add Blog</button>')+`<div class="grid-two">${blogs.map((b,i)=>`<article class="panel"><div class="product-cell"><img src="${String(b.image||'').startsWith('data:')?b.image:'assets/'+(b.image||'perfume-01.svg')}"><div><b>${esc(b.title)}</b><div class="muted">${esc(b.category||'JOURNAL')}</div></div></div><p class="muted">${esc(b.body)}</p><div class="actions"><button class="btn small" onclick="editBlog(${i})">Edit</button><button class="btn small danger" onclick="deleteBlog(${i})">Delete</button></div></article>`).join('')}</div>`}
function editBlog(i){let b=blogs[i]||{title:'',body:'',category:'JOURNAL',image:'perfume-01.svg'};$('#modalContent').innerHTML=`<h2>${i===undefined?'Add Blog':'Edit Blog'}</h2><form id="blogForm"><label>Title<input name="title" required value="${esc(b.title)}"></label><label>Category<input name="category" value="${esc(b.category)}"></label><label>Article Text<textarea name="body" required>${esc(b.body)}</textarea></label><label>Image<input type="file" name="file" accept="image/*"></label><img id="blogPreview" class="image-preview" src="${String(b.image||'').startsWith('data:')?b.image:'assets/'+(b.image||'perfume-01.svg')}"><button class="btn gold">Save Blog</button></form>`;openModal();let image=b.image;$('#blogForm [name=file]').onchange=async e=>{let f=e.target.files[0];if(f){try{showToast('Uploading image...');image=await uploadImage(f);$('#blogPreview').src=image;showToast('Image uploaded')}catch(err){showToast(err.message)}}};$('#blogForm').onsubmit=e=>{e.preventDefault();let f=new FormData(e.currentTarget),item={title:f.get('title'),category:f.get('category'),body:f.get('body'),image};if(i===undefined){blogs.unshift(item);log('Blog added',item.title)}else{blogs[i]=item;log('Blog updated',item.title)}save('luxoriaBlogs',blogs);closeModal();render('blogs');showToast('Blog saved. Refresh website to view.')}}
function deleteBlog(i){if(!confirm('Delete this blog?'))return;log('Blog deleted',blogs[i].title);blogs.splice(i,1);save('luxoriaBlogs',blogs);render('blogs')}

let visitorRefreshTimer=null;
function visitorsView(){
 const html=pageHead('Visitor Analytics','Live website traffic from browsers that have visited your store.')+
 `<div class="stats" id="visitorStats">${stat('Active Visitors','—','Last 2 minutes')}${stat('Today','—','Unique browsers')}${stat('Last 7 Days','—','Unique browsers')}${stat('Last 30 Days','—','Unique browsers')}</div>
 <div class="grid-two"><section class="panel"><h3>Active Devices</h3><div id="visitorDevices" class="muted">Loading visitor data…</div></section>
 <section class="panel"><h3>Most Visited Pages (Currently Active)</h3><div id="visitorPages" class="muted">Loading…</div></section></div>
 <section class="panel"><div class="toolbar"><h3 style="margin:0">Live Visitors</h3><span class="pill green">Auto-refresh · 15 sec</span><button class="btn small" onclick="refreshVisitorAnalytics()">Refresh now</button></div><div class="table-wrap"><table><thead><tr><th>Page</th><th>Device</th><th>Last Seen</th></tr></thead><tbody id="visitorRecent"><tr><td colspan="3" class="empty">Loading…</td></tr></tbody></table></div></section>
 <p class="content-note">Visitor counts use a random browser identifier and page/device information. They do not identify individual people. Active means a browser sent a heartbeat within the last 2 minutes. Country-level location is not collected by this basic version.</p>`;
 setTimeout(()=>{refreshVisitorAnalytics();if(visitorRefreshTimer)clearInterval(visitorRefreshTimer);visitorRefreshTimer=setInterval(()=>{if(document.querySelector('[data-view="visitors"].active')||document.querySelector('#pageTitle')?.textContent==='Visitor Analytics')refreshVisitorAnalytics()},15000)},0);
 return html;
}
async function refreshVisitorAnalytics(){
 const target=$('#visitorRecent');if(!target)return;
 try{
  const r=await fetch('api.php?action=visitor-analytics',{credentials:'same-origin',cache:'no-store'}),j=await r.json();
  if(!r.ok||!j.ok)throw new Error(j.error||'Could not load analytics');
  const cards=[['Active Visitors',j.active,'Last 2 minutes'],['Today',j.today,'Unique browsers'],['Last 7 Days',j.week,'Unique browsers'],['Last 30 Days',j.month,'Unique browsers']];
  $('#visitorStats').innerHTML=cards.map(x=>stat(...x)).join('');
  $('#visitorDevices').innerHTML=`<div class="history-item"><b>Mobile</b><strong>${j.devices.mobile}</strong></div><div class="history-item"><b>Desktop</b><strong>${j.devices.desktop}</strong></div>`;
  $('#visitorPages').innerHTML=(j.pages||[]).map(x=>`<div class="history-item"><span>${esc(x.page)}</span><b>${x.active}</b></div>`).join('')||'<p class="empty">No active pages right now.</p>';
  target.innerHTML=(j.recent||[]).map(v=>`<tr><td>${esc(v.page)}</td><td>${esc(v.device)}</td><td>${new Date(v.last_seen*1000).toLocaleTimeString()}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">No active visitors yet. Open the public website in another browser or device.</td></tr>';
 }catch(e){target.innerHTML=`<tr><td colspan="3" class="empty">${esc(e.message)}</td></tr>`}
}

function historyView(){return pageHead('Activity History','A record of product, stock, order and content changes.')+`<section class="panel">${history.map(h=>`<div class="history-item"><div><b>${esc(h.action)}</b><div class="muted">${esc(h.detail)}</div></div><small>${esc(h.date)}</small></div>`).join('')||'<div class="empty">No activity yet. Changes you make will appear here.</div>'}</section>`}
function openModal(){$('#modal').classList.remove('hidden')}function closeModal(){$('#modal').classList.add('hidden')}$('#closeModal').onclick=closeModal;$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal()});
function render(v){let titles={overview:'Overview',products:'Products',orders:'Orders & Sales',inventory:'Inventory',content:'Website Content',blogs:'Blogs',history:'Activity History',visitors:'Visitor Analytics'};$('#pageTitle').textContent=titles[v]||'Overview';let html=({overview,products:productsView,orders:ordersView,inventory,content:contentView,blogs:blogsView,history:historyView,visitors:visitorsView}[v]||overview)();$('#view').innerHTML=html;if(v==='products')bindProductSearch();if(v==='content')bindContent()}
window.render=render;window.editProduct=editProduct;window.deleteProduct=deleteProduct;window.updateStock=updateStock;window.newOrder=newOrder;window.deleteOrder=deleteOrder;window.editBlog=editBlog;window.deleteBlog=deleteBlog;window.refreshVisitorAnalytics=refreshVisitorAnalytics;
