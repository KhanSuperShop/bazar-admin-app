// খান সুপার শপ - স্বাধীন সেলস ড্যাশবোর্ড মডিউল
// এই কোডটি আপনার মূল admin.js বা status.js ফাইলের কোনো ক্ষতি করবে না

document.addEventListener('DOMContentLoaded', () => {
    const ordersHeader = document.querySelector('.orders-container h2');
    
    if (ordersHeader) {
        // ১. অর্ডারের টেবিলের ওপরে দুটি সুন্দর সেলস কার্ড কার্ড তৈরি করা
        const dashboardHtml = `
            <div class="sales-dashboard" style="display: flex; gap: 15px; margin: 15px 0;">
                <div class="sales-card" style="flex: 1; background: linear-gradient(135deg, #28a745, #218838); color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: normal; opacity: 0.9;">আজকের মোট বিক্রি</h3>
                    <p id="today-sales" style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold;">৳ ০</p>
                </div>
                <div class="sales-card" style="flex: 1; background: linear-gradient(135deg, #007bff, #0069d9); color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: normal; opacity: 0.9;">এই মাসের মোট বিক্রি</h3>
                    <p id="month-sales" style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold;">৳ ০</p>
                </div>
            </div>
        `;
        // 'গ্রাহকদের অর্ডারসমূহ' লেখার ঠিক নিচে বক্স দুটি বসে যাবে
        ordersHeader.insertAdjacentHTML('afterend', dashboardHtml);
        
        // অর্ডারের ডাটা টেবিল লোড হওয়ার জন্য ১.৫ সেকেন্ড অপেক্ষা করে হিসাব শুরু করবে
        setTimeout(calculateSales, 1500);
    }
});

async function calculateSales() {
    try {
        // সুপা-বেসের 'orders' টেবিল থেকে সব ডেটা আনা হচ্ছে হিসাবের জন্য
        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_amount, created_at');

        if (error) throw error;

        let todayTotal = 0;
        let monthTotal = 0;

        // বর্তমান তারিখ এবং মাসের তথ্য নেওয়া (২০২৬ সালের বর্তমান সময় অনুযায়ী)
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // যেমন: "2026-11-02"
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        if (orders && orders.length > 0) {
            orders.forEach(order => {
                const orderPrice = Number(order.total_amount) || 0;
                const orderDate = new Date(order.created_at);
                
                const orderDateStr = orderDate.toISOString().split('T')[0];
                const orderYear = orderDate.getFullYear();
                const orderMonth = orderDate.getMonth();

                // আজকের বিক্রির হিসাব
                if (orderDateStr === todayStr) {
                    todayTotal += orderPrice;
                }

                // এই মাসের বিক্রির হিসাব
                if (orderYear === currentYear && orderMonth === currentMonth) {
                    monthTotal += orderPrice;
                }
            });
        }

        // স্ক্রিনে টাকা আপডেট করা
        document.getElementById('today-sales').innerText = `৳ ${todayTotal.toLocaleString()}`;
        document.getElementById('month-sales').innerText = `৳ ${monthTotal.toLocaleString()}`;

    } catch (err) {
        console.error("সেলস ড্যাশবোর্ড হিসাব করতে সমস্যা:", err.message);
        // কোনো কারণে ডাটাবেজ কানেক্ট না হলে স্ক্রিনের টেবিল থেকে সরাসরি হিসাব করার অফলাইন ব্যাকআপ
        calculateSalesFromTable();
    }
}

// অফলাইন ব্যাকআপ ফাংশন (টেবিল রিড করে হিসাব করবে)
function calculateSalesFromTable() {
    const rows = document.querySelectorAll('#orders-tbody tr');
    let tableTotal = 0;

    rows.forEach(row => {
        if (row.cells.length >= 5) {
            // মোট বিলের কলাম (৫ম কলাম) থেকে টাকা নেওয়া
            const priceText = row.cells[4].innerText.replace(/[^0-9]/g, '');
            tableTotal += Number(priceText) || 0;
        }
    });

    // সুপা-বেস অফলাইন থাকলে টেবিলের মোট টাকাই মাসে ও আজ দেখাবে
    document.getElementById('today-sales').innerText = `৳ ${tableTotal.toLocaleString()}`;
    document.getElementById('month-sales').innerText = `৳ ${tableTotal.toLocaleString()}`;
}
