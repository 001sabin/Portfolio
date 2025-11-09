// Seed data: categories, brands, products
export const CATEGORIES = [
  { slug: 'electronics', name: 'Electronics', icon: '💻' },
  { slug: 'fashion', name: 'Fashion', icon: '👗' },
  { slug: 'groceries', name: 'Groceries', icon: '🛒' },
  { slug: 'home', name: 'Home & Living', icon: '🏠' },
  { slug: 'beauty', name: 'Beauty', icon: '💄' },
  { slug: 'sports', name: 'Sports', icon: '🏅' }
];

export const BRANDS = ['Samsung','Apple','Xiaomi','Sony','LG','Nike','Adidas','Puma','Unilever','Nestle','Philips','Dell','HP'];

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[rand(0, arr.length-1)]; }

const LOREM = [
  'Top quality and best value for your needs.',
  'Limited-time flash deal with massive discounts.',
  'Durable, stylish, and made for daily use.',
  'Customer-favorite with excellent reviews.',
  'Fast shipping and local warranty included.'
];

function imgUrl(id){ return `https://picsum.photos/seed/daraz-${id}/600/400`; }

function generateProducts(n=48){
  const items=[];
  for(let i=1;i<=n;i++){
    const cat = pick(CATEGORIES);
    const brand = pick(BRANDS);
    const price = rand(199, 99999);
    const discount = [0,5,10,15,20,25,30][rand(0,6)];
    items.push({
      id: String(i),
      title: `${brand} ${cat.name} Item ${i}`,
      brand,
      category: cat.slug,
      price,
      discount,
      rating: (Math.random()*2+3).toFixed(1),
      stock: rand(5, 200),
      description: `${pick(LOREM)} ${pick(LOREM)}`,
      images: [imgUrl(i), imgUrl(i+100), imgUrl(i+200)],
      isFlashDeal: Math.random() < 0.25
    });
  }
  return items;
}

const STORAGE_KEYS = {
  products: 'dz_products',
  users: 'dz_users',
  cart: 'dz_cart',
  auth: 'dz_auth',
  sellers: 'dz_sellers'
};

function ensureSeed(){
  if(!localStorage.getItem(STORAGE_KEYS.products)){
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(generateProducts()));
  }
  if(!localStorage.getItem(STORAGE_KEYS.users)){
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([]));
  }
  if(!localStorage.getItem(STORAGE_KEYS.sellers)){
    localStorage.setItem(STORAGE_KEYS.sellers, JSON.stringify([]));
  }
  if(!localStorage.getItem(STORAGE_KEYS.cart)){
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([]));
  }
}

ensureSeed();

export const KEYS = STORAGE_KEYS;
export function loadProducts(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.products)||'[]'); }
export function saveProducts(p){ localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(p)); }
export function loadCart(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)||'[]'); }
export function saveCart(c){ localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(c)); }
export function loadUsers(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.users)||'[]'); }
export function saveUsers(u){ localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(u)); }
export function loadSellers(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.sellers)||'[]'); }
export function saveSellers(s){ localStorage.setItem(STORAGE_KEYS.sellers, JSON.stringify(s)); }
export function loadAuth(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS.auth)||'null'); }
export function saveAuth(a){ localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(a)); }
export function clearAuth(){ localStorage.removeItem(STORAGE_KEYS.auth); }
