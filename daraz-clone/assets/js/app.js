import { CATEGORIES, BRANDS, loadProducts, saveProducts, loadCart, saveCart, loadUsers, saveUsers, loadSellers, saveSellers, loadAuth, saveAuth, clearAuth } from './data.js';

// Simple client-side router using hash routes
const routes = {};
function route(path, render){ routes[path] = render; }
function navigate(path){ if(location.hash !== `#${path}`) location.hash = `#${path}`; else render(); }
window.navigate = navigate;

function parseRoute(){
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('?')[0].split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(hash.split('?')[1]||''));
  return { hash, parts, query, path: '/' + parts.join('/') };
}

function render(){
  const { parts, path } = parseRoute();
  const el = document.getElementById('view');
  if(path === '/') return el.innerHTML = HomePage();
  if(parts[0] === 'category') return el.innerHTML = CategoryPage(parts[1]||'');
  if(parts[0] === 'product') return el.innerHTML = ProductPage(parts[1]||'');
  if(path === '/cart') return el.innerHTML = CartPage();
  if(path === '/checkout') return el.innerHTML = CheckoutPage();
  if(path === '/login') return el.innerHTML = LoginPage();
  if(path === '/register') return el.innerHTML = RegisterPage();
  if(path === '/seller-register') return el.innerHTML = SellerRegisterPage();
  if(path === '/admin') return el.innerHTML = AdminPage();
  return el.innerHTML = NotFoundPage();
}

window.addEventListener('hashchange', () => { render(); mountInteractive(); });
window.addEventListener('DOMContentLoaded', () => { mountLayout(); render(); mountInteractive(); });

function mountLayout(){
  const auth = loadAuth();
  const header = document.getElementById('header');
  header.innerHTML = Header(auth);
  const footer = document.getElementById('footer');
  footer.innerHTML = Footer();
  attachHeaderListeners();
}

function attachHeaderListeners(){
  const searchForm = document.getElementById('search-form');
  if(searchForm){
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = new FormData(searchForm).get('q').toString().trim();
      navigate(`/category/all?q=${encodeURIComponent(q)}`);
    });
  }
  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){ logoutBtn.onclick = () => { clearAuth(); mountLayout(); render(); mountInteractive(); }; }
}

function mountInteractive(){
  // Banner carousel
  const track = document.querySelector('.banner-track');
  if(track){
    let i = 0; const slides = track.children.length;
    setInterval(()=>{ i = (i+1)%slides; track.style.transform = `translateX(-${i*100}%)`; }, 3500);
  }
  // Add to cart buttons
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-add');
      addToCart(id, 1);
    });
  });
  // Filters
  const filterForm = document.getElementById('filters-form');
  if(filterForm){
    filterForm.addEventListener('change', ()=>{
      const fd = new FormData(filterForm);
      const params = new URLSearchParams();
      for(const [k,v] of fd.entries()){ if(v) params.set(k,v); }
      const { parts } = parseRoute();
      navigate(`/category/${parts[1]||'all'}?${params.toString()}`);
    });
  }
  // Auth forms
  const loginForm = document.getElementById('login-form');
  if(loginForm){ loginForm.addEventListener('submit', onLogin); }
  const registerForm = document.getElementById('register-form');
  if(registerForm){ registerForm.addEventListener('submit', onRegister); }
  const sellerForm = document.getElementById('seller-form');
  if(sellerForm){ sellerForm.addEventListener('submit', onSellerRegister); }
  const checkoutForm = document.getElementById('checkout-form');
  if(checkoutForm){ checkoutForm.addEventListener('submit', onCheckout); }
  // Admin
  const adminProductForm = document.getElementById('admin-product-form');
  if(adminProductForm){ adminProductForm.addEventListener('submit', onAdminSaveProduct); }
  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-del');
      const prods = loadProducts().filter(p=>p.id!==id);
      saveProducts(prods);
      render(); mountInteractive();
    });
  });
  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-edit');
      const p = loadProducts().find(p=>p.id===id);
      const form = document.getElementById('admin-product-form');
      if(p && form){
        for(const k of ['id','title','brand','category','price','discount','description','images']){
          const el = form.querySelector(`[name="${k}"]`);
          if(!el) continue;
          if(k==='images') el.value = p.images.join(', ');
          else el.value = p[k];
        }
        form.scrollIntoView({behavior:'smooth'});
      }
    });
  });
}

// State helpers
function money(n){ return `Rs. ${Number(n).toLocaleString()}`; }
function priceAfter(p){ return Math.round(p.price * (1 - (p.discount||0)/100)); }

function addToCart(productId, qty){
  const cart = loadCart();
  const item = cart.find(i=>i.id===productId);
  if(item) item.qty += qty; else cart.push({ id: productId, qty });
  saveCart(cart);
  toast('Added to cart');
  mountLayout(); // update cart count
}

function toast(msg){
  const t = document.createElement('div');
  t.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded shadow';
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1600);
}

// Header & Footer
function Header(auth){
  const cartCount = loadCart().reduce((a,b)=>a+b.qty,0);
  return `
  <div class="bg-brand text-white">
    <div class="container mx-auto px-4 py-2 flex items-center gap-4">
      <a href="#/" class="font-semibold text-lg">NepKart</a>
      <form id="search-form" class="hidden md:flex flex-1"> 
        <input name="q" placeholder="Search in NepKart" class="w-full px-3 py-2 rounded-l text-gray-800" />
        <button class="bg-white/10 px-4 rounded-r">Search</button>
      </form>
      <nav class="ml-auto flex items-center gap-3 text-sm">
        ${auth?`<span>Hello, ${auth.name}</span><button id="logout-btn" class="underline">Logout</button>`:`<a href="#/login" class="underline">Login</a> <a href="#/register" class="underline">Register</a>`}
        <a href="#/cart" class="relative">Cart <span class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-white text-brand rounded-full">${cartCount}</span></a>
        <a href="#/seller-register" class="underline">Sell on NepKart</a>
        <a href="#/admin" class="underline">Admin</a>
      </nav>
    </div>
  </div>
  <div class="bg-white border-b">
    <div class="container mx-auto px-4 py-2 flex gap-4 overflow-x-auto text-sm">
      ${CATEGORIES.map(c=>`<a class="px-2 py-1 hover:text-brand whitespace-nowrap" href="#/category/${c.slug}">${c.icon} ${c.name}</a>`).join('')}
    </div>
  </div>`;
}

function Footer(){
  return `
  <div class="container mx-auto px-4 py-8 text-sm text-gray-600">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div>
        <div class="font-semibold mb-2">Customer Care</div>
        <div>Help Center</div>
        <div>How to Buy</div>
        <div>Returns & Refunds</div>
      </div>
      <div>
        <div class="font-semibold mb-2">About Us</div>
        <div>About NepKart</div>
        <div>Contact Us</div>
      </div>
      <div>
        <div class="font-semibold mb-2">Payment</div>
        <div>Cash on Delivery</div>
        <div>Cards, eSewa, Khalti</div>
      </div>
      <div>
        <div class="font-semibold mb-2">Follow Us</div>
        <div>Facebook</div>
        <div>Instagram</div>
      </div>
    </div>
    <div class="mt-8 text-center">© ${new Date().getFullYear()} NepKart</div>
  </div>`;
}

// Pages
function HomePage(){
  const prods = loadProducts();
  const flash = prods.filter(p=>p.isFlashDeal).slice(0,12);
  return `
  <section class="container mx-auto px-4 py-4">
    <div class="banner rounded-lg overflow-hidden bg-white">
      <div class="banner-track">
        ${[1,2,3].map(i=>`<div class="banner-slide"><img src="https://picsum.photos/seed/banner-${i}/1600/700" alt="banner ${i}"></div>`).join('')}
      </div>
    </div>
  </section>
  <section class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-semibold">Flash Deals</h2>
      <a class="text-brand" href="#/category/all?flash=1">See all</a>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      ${flash.map(Card).join('')}
    </div>
  </section>
  <section class="container mx-auto px-4 py-6">
    <h2 class="text-xl font-semibold mb-3">Shop by Category</h2>
    <div class="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-3">
      ${CATEGORIES.map(c=>`
        <a class="bg-white p-4 rounded-lg border flex flex-col items-center card-hover" href="#/category/${c.slug}">
          <div class="text-3xl">${c.icon}</div>
          <div class="mt-2 text-sm">${c.name}</div>
        </a>
      `).join('')}
    </div>
  </section>`;
}

function Card(p){
  const after = priceAfter(p);
  return `
  <a href="#/product/${p.id}" class="bg-white rounded-lg border overflow-hidden card-hover flex flex-col">
    <img src="${p.images[0]}" alt="${p.title}" class="aspect-[4/3] object-cover"/>
    <div class="p-3 flex-1 flex flex-col">
      <div class="text-sm line-clamp-2">${p.title}</div>
      <div class="mt-1 font-semibold">${money(after)}</div>
      ${p.discount?`<div class="text-xs text-gray-500 line-through">${money(p.price)}</div>`:''}
      ${p.isFlashDeal?`<div class="mt-1 text-xs inline-block px-2 py-0.5 rounded badge-flash">Flash ${p.discount||10}% OFF</div>`:''}
      <button data-add="${p.id}" class="mt-3 text-sm bg-brand text-white rounded px-3 py-2">Add to Cart</button>
    </div>
  </a>`;
}

function CategoryPage(slug){
  const { query } = parseRoute();
  let prods = loadProducts();
  const title = slug==='all' || !slug ? 'All Products' : (CATEGORIES.find(c=>c.slug===slug)?.name || 'Products');
  if(slug && slug!=='all') prods = prods.filter(p=>p.category===slug);
  if(query.q){ const q=query.q.toLowerCase(); prods = prods.filter(p=>p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)); }
  if(query.min) prods = prods.filter(p=>priceAfter(p) >= Number(query.min));
  if(query.max) prods = prods.filter(p=>priceAfter(p) <= Number(query.max));
  if(query.brand) prods = prods.filter(p=>p.brand===query.brand);
  if(query.flash==='1') prods = prods.filter(p=>p.isFlashDeal);

  return `
  <section class="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
    <aside class="md:col-span-1 bg-white border rounded-lg p-4 h-max">
      <div class="font-semibold mb-2">Filters</div>
      <form id="filters-form" class="space-y-3">
        <div>
          <label class="block text-sm mb-1">Brand</label>
          <select name="brand" class="w-full border rounded px-2 py-1">
            <option value="">All</option>
            ${BRANDS.map(b=>`<option ${query.brand===b?'selected':''}>${b}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Min Price</label>
          <input name="min" type="number" min="0" value="${query.min||''}" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label class="block text-sm mb-1">Max Price</label>
          <input name="max" type="number" min="0" value="${query.max||''}" class="w-full border rounded px-2 py-1" />
        </div>
      </form>
    </aside>
    <div class="md:col-span-3">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-semibold">${title}</h1>
        <div class="text-sm text-gray-600">${prods.length} items</div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        ${prods.map(Card).join('')}
      </div>
    </div>
  </section>`;
}

function ProductPage(id){
  const p = loadProducts().find(p=>p.id===id);
  if(!p) return NotFoundPage();
  const after = priceAfter(p);
  return `
  <section class="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white border rounded-lg p-3">
      <img src="${p.images[0]}" alt="${p.title}" class="w-full rounded" />
      <div class="mt-3 grid grid-cols-3 gap-2">${p.images.map(img=>`<img src="${img}" class="rounded border"/>`).join('')}</div>
    </div>
    <div class="bg-white border rounded-lg p-4">
      <h1 class="text-2xl font-semibold">${p.title}</h1>
      <div class="mt-2 flex items-center gap-2">
        <div class="text-2xl font-bold text-brand">${money(after)}</div>
        ${p.discount?`<div class="text-sm text-gray-500 line-through">${money(p.price)}</div>`:''}
        <div class="text-sm">${p.discount}% OFF</div>
      </div>
      <div class="mt-2 text-sm text-gray-600">Brand: ${p.brand} • Rating: ⭐ ${p.rating}</div>
      <p class="mt-4 leading-relaxed text-gray-700">${p.description}</p>
      <div class="mt-6 flex gap-3">
        <button data-add="${p.id}" class="bg-brand text-white rounded px-4 py-2">Add to Cart</button>
        <a href="#/checkout" class="border border-brand text-brand rounded px-4 py-2">Buy Now</a>
      </div>
    </div>
  </section>`;
}

function CartPage(){
  const prods = loadProducts();
  const cart = loadCart();
  const items = cart.map(i=>({ ...i, product: prods.find(p=>p.id===i.id) })).filter(x=>x.product);
  const subtotal = items.reduce((s,x)=> s + priceAfter(x.product)*x.qty, 0);
  return `
  <section class="container mx-auto px-4 py-6">
    <h1 class="text-xl font-semibold mb-4">Shopping Cart</h1>
    ${items.length?`<div class="grid md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-4">
        ${items.map(x=>`
          <div class="bg-white border rounded-lg p-3 flex items-center gap-3">
            <img src="${x.product.images[0]}" class="w-20 h-20 object-cover rounded"/>
            <div class="flex-1">
              <div class="text-sm">${x.product.title}</div>
              <div class="text-brand font-semibold">${money(priceAfter(x.product))}</div>
              <div class="text-xs text-gray-500">Qty: ${x.qty}</div>
            </div>
            <button class="text-sm underline" data-del="${x.product.id}">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="bg-white border rounded-lg p-4 h-max">
        <div class="font-semibold mb-2">Order Summary</div>
        <div class="flex justify-between"><span>Subtotal</span><span>${money(subtotal)}</span></div>
        <a href="#/checkout" class="mt-4 block text-center bg-brand text-white rounded px-4 py-2">Proceed to Checkout</a>
      </div>
    </div>`:`<div class="bg-white border rounded-lg p-6 text-center">Your cart is empty. <a href="#/" class="text-brand underline">Continue shopping</a></div>`}
  </section>`;
}

function CheckoutPage(){
  const auth = loadAuth();
  const prods = loadProducts();
  const items = loadCart().map(i=>({ ...i, product: prods.find(p=>p.id===i.id) })).filter(x=>x.product);
  const total = items.reduce((s,x)=> s + priceAfter(x.product)*x.qty, 0);
  return `
  <section class="container mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
    <div class="md:col-span-2 bg-white border rounded-lg p-4">
      <h1 class="text-xl font-semibold mb-4">Secure Checkout</h1>
      ${auth?`<div class="mb-4 text-sm">Logged in as <strong>${auth.email}</strong></div>`:`<div class="mb-4 text-sm">Guest checkout • <a class="text-brand underline" href="#/login">Login</a></div>`}
      <form id="checkout-form" class="grid grid-cols-2 gap-3">
        <input name="name" required placeholder="Full Name" class="border rounded px-3 py-2 col-span-2 md:col-span-1" />
        <input name="email" type="email" required placeholder="Email" class="border rounded px-3 py-2 col-span-2 md:col-span-1" />
        <input name="phone" required placeholder="Phone" class="border rounded px-3 py-2 col-span-2" />
        <input name="address" required placeholder="Address" class="border rounded px-3 py-2 col-span-2" />
        <select name="payment" required class="border rounded px-3 py-2 col-span-2">
          <option value="cod">Cash on Delivery</option>
          <option value="esewa">eSewa</option>
          <option value="khalti">Khalti</option>
          <option value="card">Card</option>
        </select>
        <button class="bg-brand text-white rounded px-4 py-2 col-span-2">Place Order</button>
      </form>
    </div>
    <div class="bg-white border rounded-lg p-4 h-max">
      <div class="font-semibold mb-2">Order Summary</div>
      ${items.map(x=>`<div class="flex justify-between text-sm"><span>${x.product.title}</span><span>${money(priceAfter(x.product)*x.qty)}</span></div>`).join('')}
      <div class="mt-2 flex justify-between font-semibold"><span>Total</span><span>${money(total)}</span></div>
    </div>
  </section>`;
}

function LoginPage(){
  return `
  <section class="container mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
    <div class="bg-white border rounded-lg p-4">
      <h1 class="text-xl font-semibold mb-4">Login</h1>
      <form id="login-form" class="space-y-3">
        <input name="email" type="email" required placeholder="Email" class="border rounded px-3 py-2 w-full" />
        <input name="password" type="password" required placeholder="Password" class="border rounded px-3 py-2 w-full" />
        <button class="bg-brand text-white rounded px-4 py-2">Login</button>
      </form>
      <div class="text-sm mt-3">New customer? <a href="#/register" class="text-brand underline">Register</a></div>
    </div>
    <div class="bg-white border rounded-lg p-4">
      <h2 class="font-semibold mb-2">Why shop with us?</h2>
      <ul class="list-disc pl-5 text-sm text-gray-600">
        <li>Fast delivery across Nepal</li>
        <li>Secure checkout options</li>
        <li>Top brands and great deals</li>
      </ul>
    </div>
  </section>`;
}

function RegisterPage(){
  return `
  <section class="container mx-auto px-4 py-6">
    <div class="bg-white border rounded-lg p-4 max-w-lg mx-auto">
      <h1 class="text-xl font-semibold mb-4">Create your account</h1>
      <form id="register-form" class="space-y-3">
        <input name="name" required placeholder="Full Name" class="border rounded px-3 py-2 w-full" />
        <input name="email" type="email" required placeholder="Email" class="border rounded px-3 py-2 w-full" />
        <input name="password" type="password" required placeholder="Password" class="border rounded px-3 py-2 w-full" />
        <button class="bg-brand text-white rounded px-4 py-2 w-full">Register</button>
      </form>
      <div class="text-sm mt-3">Already have an account? <a href="#/login" class="text-brand underline">Login</a></div>
    </div>
  </section>`;
}

function SellerRegisterPage(){
  return `
  <section class="container mx-auto px-4 py-6">
    <div class="bg-white border rounded-lg p-4 max-w-xl mx-auto">
      <h1 class="text-xl font-semibold mb-4">Seller Registration</h1>
      <form id="seller-form" class="space-y-3">
        <input name="store" required placeholder="Store Name" class="border rounded px-3 py-2 w-full" />
        <input name="email" type="email" required placeholder="Business Email" class="border rounded px-3 py-2 w-full" />
        <input name="phone" required placeholder="Phone" class="border rounded px-3 py-2 w-full" />
        <textarea name="about" placeholder="About your store" class="border rounded px-3 py-2 w-full"></textarea>
        <button class="bg-brand text-white rounded px-4 py-2 w-full">Register as Seller</button>
      </form>
    </div>
  </section>`;
}

function AdminPage(){
  const prods = loadProducts();
  return `
  <section class="container mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
    <div class="md:col-span-2 bg-white border rounded-lg p-4">
      <h1 class="text-xl font-semibold mb-3">Admin • Products</h1>
      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b">
              <th class="py-2">ID</th>
              <th>Title</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${prods.map(p=>`<tr class="border-b">
              <td class="py-2 pr-2">${p.id}</td>
              <td class="pr-2">${p.title}</td>
              <td class="pr-2">${money(priceAfter(p))}</td>
              <td class="pr-2">${p.stock}</td>
              <td class="text-right whitespace-nowrap">
                <button data-edit="${p.id}" class="text-brand underline mr-2">Edit</button>
                <button data-del="${p.id}" class="text-red-600 underline">Delete</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white border rounded-lg p-4 h-max">
      <div class="font-semibold mb-2">Add / Edit Product</div>
      <form id="admin-product-form" class="space-y-2">
        <input name="id" placeholder="ID (auto if empty)" class="border rounded px-2 py-1 w-full" />
        <input name="title" required placeholder="Title" class="border rounded px-2 py-1 w-full" />
        <input name="brand" required placeholder="Brand" class="border rounded px-2 py-1 w-full" />
        <select name="category" class="border rounded px-2 py-1 w-full">
          ${CATEGORIES.map(c=>`<option value="${c.slug}">${c.name}</option>`).join('')}
        </select>
        <input name="price" type="number" required placeholder="Price" class="border rounded px-2 py-1 w-full" />
        <input name="discount" type="number" placeholder="Discount %" class="border rounded px-2 py-1 w-full" />
        <input name="images" placeholder="Images (comma separated URLs)" class="border rounded px-2 py-1 w-full" />
        <textarea name="description" placeholder="Description" class="border rounded px-2 py-1 w-full"></textarea>
        <button class="bg-brand text-white rounded px-3 py-2 w-full">Save</button>
      </form>
    </div>
  </section>`;
}

function NotFoundPage(){
  return `<div class="container mx-auto px-4 py-10"><div class="bg-white border rounded p-6">Page not found. <a class="text-brand underline" href="#/">Go home</a></div></div>`;
}

// Handlers
function onLogin(e){
  e.preventDefault();
  const fd = new FormData(e.target); const email = fd.get('email'); const password = fd.get('password');
  const users = loadUsers();
  const u = users.find(u=>u.email===email && u.password===password);
  if(!u) return alert('Invalid credentials');
  saveAuth({ id: u.id, name: u.name, email: u.email });
  mountLayout(); navigate('/');
}

function onRegister(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const users = loadUsers();
  if(users.some(u=>u.email===fd.get('email'))) return alert('Email already in use');
  const id = String(Date.now());
  const user = { id, name: fd.get('name'), email: fd.get('email'), password: fd.get('password') };
  users.push(user); saveUsers(users); saveAuth({ id, name: user.name, email: user.email });
  mountLayout(); navigate('/');
}

function onSellerRegister(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const sellers = loadSellers();
  sellers.push({ id: String(Date.now()), store: fd.get('store'), email: fd.get('email'), phone: fd.get('phone'), about: fd.get('about') });
  saveSellers(sellers); alert('Seller application submitted!'); navigate('/');
}

function onCheckout(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  if(!fd.get('name') || !fd.get('address')) return alert('Please fill required fields');
  saveCart([]); mountLayout();
  alert('Order placed! Thank you for shopping with us.');
  navigate('/');
}

function onAdminSaveProduct(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const prods = loadProducts();
  const id = fd.get('id')?.trim() || String(Date.now());
  const existing = prods.find(p=>p.id===id);
  const payload = {
    id,
    title: fd.get('title'),
    brand: fd.get('brand'),
    category: fd.get('category'),
    price: Number(fd.get('price')||0),
    discount: Number(fd.get('discount')||0),
    description: fd.get('description')||'',
    images: (fd.get('images')||'').split(',').map(s=>s.trim()).filter(Boolean),
    rating: existing?.rating || '4.3',
    stock: existing?.stock || 50,
    isFlashDeal: existing?.isFlashDeal || false
  };
  if(existing){ Object.assign(existing, payload); }
  else { prods.unshift(payload); }
  saveProducts(prods);
  (e.target).reset();
  render(); mountInteractive();
}
