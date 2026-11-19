// ১. সুপাবেস কানেকশন সেটআপ
const SUPABASE_URL = 'https://kuecacvhadqzywvkmauo.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI'; 

function getAuthHeaders() {
    const token = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token') || SUPABASE_ANON_KEY;
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}


// লোকাল supabase.js-এর বদলে সরাসরি টোকেন-সাপোর্টেড ক্লায়েন্ট
const _db = {
    from: (table) => ({
        select: async (cols = '*') => {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}`, { headers: getAuthHeaders() });
            const data = await res.json();
            return res.ok ? { data, error: null } : { data: null, error: data };
        },
        insert: async (rows) => {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(rows)
            });
            const data = await res.json();
            return res.ok ? { data, error: null } : { data: null, error: data };
        },
        update: (values) => ({
            eq: async (col, val) => {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(values)
                });
                const data = await res.json();
                return res.ok ? { data, error: null } : { data: null, error: data };
            }
        }),
        delete: () => ({
            eq: async (col, val) => {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                return res.ok ? { error: null } : { error: await res.json() };
            }
        })
    })
};

const IMGBB_API_KEY = 'd36eb6591370ae7f9089d85875e56b22'; 

let loadedOrdersMap = {};
let globalOrdersData = [];

// ২. সরাসরি ডিভাইস থেকে ছবি আপলোড হ্যান্ডলার
const imageFileInput = document.getElementById('imageFile');
if (imageFileInput) {
    imageFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const urlInput = document.getElementById('imageUrl');
        const statusText = document.getElementById('upload-status');
        if (statusText) statusText.innerText = 'ছবি আপলোড হচ্ছে, অপেক্ষা করুন...';

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch("https://imgbb.com" + IMGBB_API_KEY, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                urlInput.value = data.data.url;
                if (statusText) statusText.innerText = '✅ ছবি সফলভাবে আপলোড হয়েছে!';
            } else {
                if (statusText) statusText.innerText = '❌ ছবি আপলোড ব্যর্থ হয়েছে!';
            }
        } catch (err) {
            console.error(err);
            if (statusText) statusText.innerText = '❌ ইন্টারনেট বা সার্ভার সমস্যা!';
        }
    });
}

// ৩. নতুন পণ্য যোগ করার ফর্ম সাবমিট হ্যান্ডলার
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const title = document.getElementById('title').value;
        const price = parseFloat(document.getElementById('price').value); 
        const description = document.getElementById('description').value;
        const image_url = document.getElementById('imageUrl').value.trim() || null;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerText = 'সেভ হচ্ছে...';
        submitBtn.disabled = true;

        const { error } = await _db
            .from('products')
            .insert([{ title, price, description, image_url }]);

        submitBtn.innerText = 'ডাটাবেজে লোড করুন';
        submitBtn.disabled = false;

        if (error) {
            alert('পণ্য যোগ করতে সমস্যা হয়েছে: ' + error.message);
        } else {
            alert('পণ্যটি সফলভাবে ডাটাবেজে যোগ করা হয়েছে! 🎉');
            productForm.reset();
            const statusText = document.getElementById('upload-status');
            if (statusText) statusText.innerText = '';
            loadAdminProducts();
        }
    });
}

// ৪. সকল পণ্যের তালিকা লোড, এডিট এবং ডিলিট ফাংশন
async function loadAdminProducts() {
    const list = document.getElementById('admin-product-list');
    if (!list) return;

    const { data: products, error } = await _db
        .from('products')
        .select('*');

    if (error || !products) {
        list.innerHTML = `<tr><td colspan="4" style="padding:10px; color:red;">পণ্য লোড করা যায়নি!</td></tr>`;
        return;
    }

    // নতুন পণ্যগুলো আগে দেখানোর জন্য রিভার্স করা হলো
    const sortedProducts = [...products].sort((a, b) => b.id - a.id);

       list.innerHTML = sortedProducts.map(p => {
        const isInStock = p.in_stock !== false;
        const stockBtnColor = isInStock ? '#16a34a' : '#d97706';
        const stockBtnText = isInStock ? '✅ স্টকে আছে' : '❌ স্টক শেষ';

        return `
        <tr style="border-bottom: 1px solid #ddd; background: #fff;">
            <td style="padding: 8px; text-align: center;">
                <img src="${p.image_url || 'https://placeholder.com'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
            </td>
            <td style="padding: 8px; font-weight: 500;">${p.title}</td>
           <td style="padding: 8px; font-weight: bold; color: #16a34a;">
    ${p.old_price && Number(p.old_price) > Number(p.price) 
        ? `<del style="color:#888; font-size:12px;">৳${p.old_price}</del> ৳${p.price} <span style="background:#fef2f2; color:#dc2626; font-size:11px; padding:1px 5px; border-radius:4px;">-${Math.round(((p.old_price - p.price) / p.old_price) * 100)}%</span>` 
        : `৳${p.price}`}
        <td style="padding: 8px; text-align: center;">
                <button type="button" onclick="toggleProductStock(${p.id}, ${isInStock})" style="background:${stockBtnColor}; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom:3px;">${stockBtnText}</button>
                <button type="button" onclick="editProduct(${p.id}, '${String(p.title).replace(/'/g, "\\'")}', ${p.price})" style="background:#2563eb; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">✏️ এডিট</button>
                <button type="button" onclick="deleteProduct(${p.id})" style="background:#dc2626; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');
}

async function editProduct(id, oldTitle, oldPrice) {
    const newTitle = prompt("পণ্যের নতুন নাম লিখুন:", oldTitle);
    if (newTitle === null || newTitle.trim() === "") return;

    const newPrice = prompt("বর্তমান বিক্রয় মূল্য (৳) লিখুন:", oldPrice);
    if (newPrice === null || isNaN(newPrice) || Number(newPrice) <= 0) {
        return alert("সঠিক সংখ্যায় মূল্য লিখুন!");
    }

    const oldCutPrice = prompt("আগের কাটা দাম (ডিসকাউন্ট দেখাতে চাইলে লিখুন, না চাইলে ফাঁকা রেখে OK দিন):", "");
    const updateData = { 
        title: newTitle.trim(), 
        price: Number(newPrice),
        old_price: (oldCutPrice && !isNaN(oldCutPrice) && Number(oldCutPrice) > Number(newPrice)) ? Number(oldCutPrice) : null
    };

    const { error } = await _db
        .from('products')
        .update(updateData)
        .eq('id', id);

    if (error) {
        alert("আপডেট ব্যর্থ হয়েছে: " + error.message);
    } else {
        alert("পণ্য সফলভাবে আপডেট হয়েছে! ✅");
        loadAdminProducts();
    }
}

// ৫. দোকানের সাধারণ সেটিংস লোড ও আপডেট (অটো-কলাম ডিটেক্ট সহ)
let existingSettingsId = 1;
let existingSettingsKeys = [];

async function loadShopSettings() {
    const settingsForm = document.getElementById('shopSettingsForm');
    if (!settingsForm) return;

    const { data, error } = await _db.from('shop_settings').select('*');
    if (data && data.length > 0 && !error) {
        const s = data[0];
        existingSettingsId = s.id || 1;
        existingSettingsKeys = Object.keys(s);
        console.log('আপনার shop_settings টেবিলের কলামসমূহ:', existingSettingsKeys);

        if (document.getElementById('set-shop-name')) document.getElementById('set-shop-name').value = s.shop_name || s.name || 'খান সুপার শপ';
        if (document.getElementById('set-shop-phone')) document.getElementById('set-shop-phone').value = s.phone || s.shop_phone || s.mobile || '';
        if (document.getElementById('set-shop-address')) document.getElementById('set-shop-address').value = s.address || s.shop_address || s.location || '';
        if (document.getElementById('set-banner-text')) document.getElementById('set-banner-text').value = s.banner_text || s.offer_text || s.notice || '';
    }
}

const shopSettingsForm = document.getElementById('shopSettingsForm');
if (shopSettingsForm) {
    shopSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameVal = document.getElementById('set-shop-name').value;
        const phoneVal = document.getElementById('set-shop-phone').value;
        const addrVal = document.getElementById('set-shop-address').value;
        const bannerVal = document.getElementById('set-banner-text').value;

        // আপনার ডাটাবেজে ঠিক যে যে কলাম আছে, শুধুমাত্র সেগুলোতেই ডাটা পাঠাবে
        const payload = {};
        if (existingSettingsKeys.includes('shop_name')) payload.shop_name = nameVal;
        if (existingSettingsKeys.includes('name')) payload.name = nameVal;
        if (existingSettingsKeys.includes('phone')) payload.phone = phoneVal;
        if (existingSettingsKeys.includes('shop_phone')) payload.shop_phone = phoneVal;
        if (existingSettingsKeys.includes('mobile')) payload.mobile = phoneVal;
        if (existingSettingsKeys.includes('address')) payload.address = addrVal;
        if (existingSettingsKeys.includes('shop_address')) payload.shop_address = addrVal;
        if (existingSettingsKeys.includes('banner_text')) payload.banner_text = bannerVal;
        if (existingSettingsKeys.includes('offer_text')) payload.offer_text = bannerVal;
        if (existingSettingsKeys.includes('notice')) payload.notice = bannerVal;

        const { error } = await _db.from('shop_settings').update(payload).eq('id', existingSettingsId);
        if (error) alert('সেটিংস সেভ হয়নি: ' + error.message);
        else alert('দোকানের সেটিংস সফলভাবে আপডেট হয়েছে! 🎉');
    });
}


// ৬. সুপাবেস থেকে অর্ডার লোড ও বিক্রির হিসাব
async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    
    try {
        const { data: orders, error } = await _db
            .from('orders')
            .select('*');

        if (error) throw error;
        
        const sortedOrders = Array.isArray(orders) ? [...orders].sort((a, b) => b.id - a.id) : [];
        globalOrdersData = sortedOrders;
        calculateSales();

        if (sortedOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding: 15px; text-align: center; color: #999;">বর্তমানে কোনো অর্ডার নেই।</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        loadedOrdersMap = {};

        sortedOrders.forEach(order => {
            loadedOrdersMap[order.id] = order;
            const itemsText = Array.isArray(order.items) 
                ? order.items.map(item => `${item.title} (${item.quantity}টি)`).join(', ')
                : '(কোনো পণ্যের তথ্য নেই)';

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #ddd; background-color: #fff;">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${order.customer_name}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${order.phone_number}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; color: #555;">${order.delivery_address}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; color: #28a745; font-weight: 500;">${itemsText}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-align: right; color: #d9534f;">৳${order.total_amount}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                        <button type="button" onclick="printOrderById('${order.id}')" style="background-color: #007bff; color: white; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 4px;">🖨️ প্রিন্ট</button>
                        <button type="button" onclick="deleteOrder('${order.id}')" style="background-color: #dc3545; color: white; border: none; padding: 5px 9px; border-radius: 4px; cursor: pointer; font-size: 12px;">✓ সম্পন্ন</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('অর্ডার লোড করতে সমস্যা:', error.message);
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 15px; text-align: center; color: red;">অর্ডার লোড করা যায়নি! আগে লগইন করুন।</td></tr>`;
    }
}

async function deleteOrder(orderId) {
    if (!confirm("আপনি কি নিশ্চিত যে এই অর্ডারটি ডেলিভারি সম্পন্ন হয়েছে?")) return;
    const { error } = await _db.from('orders').delete().eq('id', orderId);
    if (error) alert('সমস্যা হয়েছে: ' + error.message);
    else {
        alert('অর্ডারটি সম্পন্ন হয়েছে! ✅');
        loadOrders();
    }
}

// ৭. প্রফেশনাল ইনভয়েস / ক্যাশ মেমো প্রিন্ট ফাংশন
function printOrderById(orderId) {
    const order = loadedOrdersMap[orderId];
    if (!order) return;

    const printWindow = window.open('', '_blank', 'width=750,height=800');
    const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('bn-BD') : new Date().toLocaleDateString('bn-BD');
    
    let tableRowsHtml = '';
    if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item, index) => {
            const qty = Number(item.quantity) || 1;
            const unitPrice = Number(item.price) || (order.items.length === 1 ? (Number(order.total_amount) / qty) : 0);
            const subtotal = unitPrice * qty;
            const priceFormula = unitPrice > 0 ? `${unitPrice} × ${qty} = ৳${subtotal}` : `৳${order.total_amount}`;

            tableRowsHtml += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px; text-align: center;">${index + 1}</td>
                    <td style="padding: 10px; text-align: left;">${item.title} (${qty}টি)</td>
                    <td style="padding: 10px; text-align: right; font-weight: 600;">${priceFormula}</td>
                </tr>
            `;
        });
    }

    const invoiceHtml = `
        <html>
        <head>
            <title>খান সুপার শপ - ইনভয়েস #${order.id}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 25px; color: #1f2937; }
                .invoice-box { max-width: 620px; margin: auto; padding: 25px; border: 1px solid #d1d5db; border-radius: 10px; }
                .header { text-align: center; border-bottom: 3px double #16a34a; padding-bottom: 12px; margin-bottom: 18px; }
                .shop-title { color: #16a34a; margin: 0; font-size: 30px; font-weight: bold; }
                .meta-grid { display: flex; justify-content: space-between; background: #f9fafb; padding: 14px; border-left: 4px solid #16a34a; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
                .meta-grid p { margin: 4px 0; }
                .item-table { width: 100%; border-collapse: collapse; font-size: 15px; }
                .item-table th { background: #16a34a; color: white; padding: 10px; }
                .total-box { margin-top: 15px; background: #fef2f2; padding: 12px 15px; border-top: 2px solid #16a34a; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #dc2626; }
                .signatures { display: flex; justify-content: space-between; margin-top: 45px; font-size: 13px; color: #4b5563; }
                .sig-line { border-top: 1px dashed #9ca3af; padding-top: 5px; width: 140px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <h1 class="shop-title">খান সুপার শপ</h1>
                    <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">তাজা ও মানসম্মত নিত্যপণ্যের বিশ্বস্ত প্রতিষ্ঠান</p>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">কাস্টমার ডেলিভারি ক্যাশ মেমো</p>
                </div>
                
                <div class="meta-grid">
                    <div>
                        <p><strong>গ্রাহকের নাম:</strong> ${order.customer_name}</p>
                        <p><strong>মোবাইল নাম্বার:</strong> ${order.phone_number}</p>
                        <p><strong>ডেলিভারি ঠিকানা:</strong> ${order.delivery_address}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>মেমো নং:</strong> #${order.id}</p>
                        <p><strong>তারিখ:</strong> ${orderDate}</p>
                        <p><strong>পেমেন্ট:</strong> ক্যাশ অন ডেলিভারি</p>
                    </div>
                </div>
                
                <table class="item-table">
                    <thead>
                        <tr>
                            <th style="width: 12%; text-align: center;">ক্র.নং</th>
                            <th style="width: 53%; text-align: left;">পণ্যের বিবরণ ও পরিমাণ</th>
                            <th style="width: 35%; text-align: right;">মূল্য (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>

                <div class="total-box">
                    <span>সর্বমোট বিল:</span>
                    <span>৳${order.total_amount} টাকা</span>
                </div>

                <div class="signatures">
                    <div class="sig-line">গ্রাহকের স্বাক্ষর</div>
                    <div class="sig-line">কর্তৃপক্ষের স্বাক্ষর</div>
                </div>

                <p style="text-align: center; margin-top: 25px; font-size: 13px; color: #6b7280;">খান সুপার শপ থেকে কেনাকাটা করার জন্য আন্তরিক ধন্যবাদ!</p>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
}

// ৮. বিক্রির হিসাব ও Excel এক্সপোর্ট
function calculateSales() {
    let todayTotal = 0;
    let monthTotal = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    globalOrdersData.forEach(order => {
        const amount = Number(order.total_amount) || 0;
        if (order.created_at) {
            const orderDate = new Date(order.created_at);
            if (orderDate.toISOString().split('T')[0] === todayStr) todayTotal += amount;
            if (orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth()) monthTotal += amount;
        }
    });

    if (document.getElementById('today-sales')) document.getElementById('today-sales').innerText = todayTotal;
    if (document.getElementById('month-sales')) document.getElementById('month-sales').innerText = monthTotal;
}

function exportOrdersToCSV() {
    if (!globalOrdersData.length) return alert('এক্সপোর্ট করার মতো কোনো অর্ডার নেই!');
    let csvContent = "\uFEFFনাম,মোবাইল,ঠিকানা,পণ্যসমূহ,মোট বিল\n";
    globalOrdersData.forEach(order => {
        const itemsStr = Array.isArray(order.items) ? order.items.map(i => `${i.title} (${i.quantity}টি)`).join(' | ') : '';
        csvContent += `"${order.customer_name}","${order.phone_number}","${order.delivery_address}","${itemsStr}",${order.total_amount}\n`;
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `khan_super_shop_orders_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

window.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    loadAdminProducts();
    loadShopSettings();
});
// অ্যাডমিন লগইন ফাংশন
// সরাসরি Supabase Auth API দিয়ে অ্যাডমিন লগইন
async function adminLogin() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    
    if (!email || !password) return alert('ইমেইল এবং পাসওয়ার্ড দিন!');

    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            alert('লগইন ব্যর্থ হয়েছে: ' + (data.error_description || data.msg || 'ভুল ইমেইল বা পাসওয়ার্ড'));
            return;
        }

        // টোকেন সেভ করা যাতে ডাটাবেজে পণ্য যোগ, এডিট ও ডিলিট করা যায়
        localStorage.setItem('sb-access-token', data.access_token);
        if (_db && _db.headers) {
            _db.headers['Authorization'] = `Bearer ${data.access_token}`;
        }

        alert('লগইন সফল হয়েছে! ✅');
        document.getElementById('login-section').style.display = 'none';
        loadOrders();
        loadAdminProducts();
        loadShopSettings();
    } catch (err) {
        alert('সার্ভার কানেকশন সমস্যা: ' + err.message);
    }
}
async function toggleProductStock(id, currentStatus) {
    const newStatus = !currentStatus;
    const { error } = await _db
        .from('products')
        .update({ in_stock: newStatus })
        .eq('id', id);

    if (error) {
        alert("স্টক আপডেট ব্যর্থ হয়েছে: " + error.message);
    } else {
        loadAdminProducts();
    }
}
async function adminLogin() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const keepSignedIn = document.getElementById('keep-signed-in')?.checked;
    
    if (!email || !password) return alert('ইমেইল এবং পাসওয়ার্ড দিন!');

    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            alert('লগইন ব্যর্থ হয়েছে: ' + (data.error_description || data.msg || 'ভুল ইমেইল বা পাসওয়ার্ড'));
            return;
        }

        // টিক মার্ক দেওয়া থাকলে স্থায়ীভাবে (localStorage), নাহলে সাময়িকভাবে (sessionStorage) সেভ হবে
        if (keepSignedIn) {
            localStorage.setItem('sb-access-token', data.access_token);
            sessionStorage.removeItem('sb-access-token');
        } else {
            sessionStorage.setItem('sb-access-token', data.access_token);
            localStorage.removeItem('sb-access-token');
        }

        alert('লগইন সফল হয়েছে! ✅');
        checkSavedSession();
        loadOrders();
        loadAdminProducts();
        loadShopSettings();
    } catch (err) {
        alert('সার্ভার কানেকশন সমস্যা: ' + err.message);
    }
}

function checkSavedSession() {
    const savedToken = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
    const loginBox = document.getElementById('login-section');
    const logoutBtn = document.getElementById('logout-btn');
    const mainDashboard = document.querySelector('main');

    if (savedToken) {
        if (loginBox) loginBox.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (mainDashboard) mainDashboard.style.display = 'block';
    } else {
        if (loginBox) loginBox.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (mainDashboard) mainDashboard.style.display = 'none';
    }
}

function adminLogout() {
    if (!confirm("আপনি কি নিশ্চিত যে লগআউট করতে চান?")) return;
    localStorage.removeItem('sb-access-token');
    sessionStorage.removeItem('sb-access-token');
    alert("সফলভাবে লগআউট হয়েছে! 👋");
    checkSavedSession();
}
window.addEventListener('DOMContentLoaded', checkSavedSession);
