// ১. সুপাবেস কানেকশন সেটআপ
const SUPABASE_URL = 'https://kuecacvhadqzywvkmauo.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ২. নতুন পণ্য যোগ করার ফর্ম সাবমিট হ্যান্ডলার
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const title = document.getElementById('title').value;
    const price = parseFloat(document.getElementById('price').value); 
    const description = document.getElementById('description').value;
    const image_url = document.getElementById('imageUrl').value.trim() || null;

    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = 'সেভ হচ্ছে...';
    submitBtn.disabled = true;

    const { data, error } = await supabase
        .from('products')
        .insert([{ title, price, description, image_url }]);

    submitBtn.innerText = 'ডাটাবেজে লোড করুন';
    submitBtn.disabled = false;

    if (error) {
        alert('পণ্য যোগ করতে সমস্যা হয়েছে: ' + error.message);
        console.error(error);
    } else {
        alert('পণ্যটি সফলভাবে ডাটাবেজে যোগ করা হয়েছে! 🎉');
        document.getElementById('productForm').reset();
    }
});

// ৩. সুপাবেস থেকে অর্ডারগুলো নিয়ে এসে টেবিলে দেখানোর ফাংশন
async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('id', { ascending: false }); // নতুন অর্ডারগুলো সবার উপরে দেখাবে

        if (error) throw error;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding: 15px; text-align: center; color: #999;">বর্তমানে কোনো অর্ডার নেই।</td></tr>`;
            return;
        }

        tbody.innerHTML = '';

        orders.forEach(order => {
            let itemsText = '';
            if (Array.isArray(order.items)) {
                itemsText = order.items.map(item => `${item.title} (${item.quantity}টি)`).join(', ');
            } else {
                itemsText = '(কোনো পণ্যের তথ্য নেই)';
            }

            const row = `
                <tr style="border-bottom: 1px solid #ddd; background-color: #fff;">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${order.customer_name}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${order.phone_number}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; color: #555;">${order.delivery_address}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; color: #28a745; font-weight: 500;">${itemsText}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-align: right; color: #d9534f;">৳${order.total_amount}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                        <button type="button" onclick="printSingleOrder('${order.customer_name}', '${order.phone_number}', '${order.delivery_address}', '${itemsText}', '${order.total_amount}')" style="background-color: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">🖨️ প্রিন্ট</button>
                        <button type="button" onclick="deleteOrder('${order.id}')" style="background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">✓ সম্পন্ন</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error('অর্ডার লোড করতে সমস্যা:', error.message);
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 15px; text-align: center; color: red;">অর্ডার লোড করা যায়নি! (লগইন করা না থাকলে আগে লগইন করুন)</td></tr>`;
    }
}

// ৪. অর্ডার ডেলিভারি সম্পন্ন হলে তালিকা থেকে মুছে ফেলার ফাংশন
async function deleteOrder(orderId) {
    const confirmDelete = confirm("আপনি কি নিশ্চিত যে এই অর্ডারটি ডেলিভারি সম্পন্ন হয়েছে এবং তালিকা থেকে মুছতে চান?");
    if (!confirmDelete) return;

    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

    if (error) {
        alert('অর্ডারটি মুছতে সমস্যা হয়েছে: ' + error.message);
    } else {
        alert('অর্ডারটি সম্পন্ন হিসেবে তালিকা থেকে সরানো হয়েছে! ✅');
        loadOrders(); // টেবিল রিফ্রেশ করা
    }
}

// ৫. মেমো প্রিন্ট করার ফাংশন
function printSingleOrder(name, phone, address, items, total) {
    const printWindow = window.open('', '_blank', 'width=700,height=700');
    
    let tableRowsHtml = '';
    let itemArray = items.split(', ');
    
    itemArray.forEach((item, index) => {
        tableRowsHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; text-align: left;">${item}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">-</td>
            </tr>
        `;
    });

    const invoiceHtml = `
        <html>
        <head>
            <title>খান সুপার শপ - ক্যাশ মেমো</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; line-height: 1.6; }
                .invoice-box { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); border-radius: 8px; }
                .header { text-align: center; border-bottom: 3px double #28a745; padding-bottom: 15px; margin-bottom: 20px; }
                .shop-title { color: #28a745; margin: 0; font-size: 28px; font-weight: bold; }
                .customer-info { margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745; }
                .customer-info p { margin: 5px 0; font-size: 15px; }
                .item-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                .item-table th { background-color: #28a745; color: white; padding: 10px; font-size: 15px; }
                .total-row { font-size: 18px; font-weight: bold; color: #d9534f; background: #fff5f5; }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <h1 class="shop-title">খান সুপার শপ</h1>
                    <p style="margin: 5px 0; color: #666; font-size: 14px;">কাস্টমার ডেলিভারি ক্যাশ মেমো</p>
                </div>
                
                <div class="customer-info">
                    <p><strong>গ্রাহকের নাম:</strong> ${name}</p>
                    <p><strong>মোবাইল নাম্বার:</strong> ${phone}</p>
                    <p><strong>ডেলিভারি ঠিকানা:</strong> ${address}</p>
                </div>
                
                <table class="item-table">
                    <thead>
                        <tr>
                            <th style="width: 15%; text-align: center;">ক্র.নং</th>
                            <th style="width: 55%; text-align: left;">পণ্যের বিবরণ ও পরিমাণ</th>
                            <th style="width: 30%; text-align: right;">মূল্য (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                        <tr class="total-row">
                            <td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #28a745;">সর্বমোট বিল:</td>
                            <td style="padding: 12px; text-align: right; border-top: 2px solid #28a745;">৳${total}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="text-align: center; margin-top: 30px; font-size: 13px; color: #777;">
                    <p>খান সুপার শপ থেকে কেনাকাটা করার জন্য ধন্যবাদ!</p>
                </div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
}

// পেজ লোড হওয়ার সাথে সাথে অর্ডারগুলো লোড করার চেষ্টা করবে
window.addEventListener('DOMContentLoaded', loadOrders);
