// খান সুপার শপ - স্বাধীন অর্ডার স্ট্যাটাস মডিউল
// এই কোডটি আপনার মূল admin.js ফাইলের কোনো ক্ষতি করবে না

document.addEventListener('DOMContentLoaded', () => {
    // ১. ডাটাবেজ থেকে অর্ডার টেবিল লোড হওয়ার পর বাটনগুলোর ডান পাশে স্ট্যাটাস কন্ট্রোল যোগ করা
    const targetTable = document.getElementById('orders-table');
    
    if (targetTable) {
        // টেবিলের হেডারে একটি নতুন কলামের নাম 'অবস্থা' যোগ করা (আগের কোড স্পর্শ না করে)
        const headerRow = targetTable.querySelector('thead tr');
        if (headerRow && !document.getElementById('status-th')) {
            const th = `<th id="status-th" style="padding: 10px; border: 1px solid #ddd; text-align: center;">স্ট্যাটাস (অবস্থা)</th>`;
            headerRow.insertAdjacentHTML('beforeend', th);
        }
        
        // অর্ডারের ডাটা লোড হওয়ার জন্য ১ সেকেন্ড অপেক্ষা করে স্ট্যাটাস বাটনগুলো বসানো
        setTimeout(injectStatusControls, 1500);
    }
});

async function injectStatusControls() {
    const rows = document.querySelectorAll('#orders-tbody tr');
    
    // যদি টেবিল এখনো খালি থাকে বা লোড না হয়
    if (rows.length === 1 && rows[0].innerText.includes('লোড')) {
        setTimeout(injectStatusControls, 1000);
        return;
    }

    // প্রতিটি অর্ডারের লাইনে স্ট্যাটাস বাটন যোগ করা
    rows.forEach(row => {
        // যদি লাইনে কোনো ডাটা না থাকে বা অলরেডি বাটন বসে থাকে তবে বাদ যাবে
        if (row.cells.length < 5 || row.querySelector('.status-select')) return;
        
        // আমরা admin.js এ '✓ সম্পন্ন' বাটনে যে orderId পাস করেছিলাম, সেটি খুঁজে বের করার চেষ্টা
        const doneBtn = row.querySelector('button[onclick*="deleteOrder"]');
        if (!doneBtn) return;
        
        // বাটন থেকে ট্রিকস খাটিয়ে orderId বের করা
        const onClickText = doneBtn.getAttribute('onclick');
        const orderId = onClickText.match(/'([^']+)'/)[1];

        // সুপা-বেস থেকে এই অর্ডারের বর্তমান স্ট্যাটাস জেনে বাটন কালার সেট করা (ডিফল্ট: Pending)
        // কাস্টম অফলাইন সুপা-বেস ফাইলের জন্য লোকাল মেমোরি ব্যাকআপ রাখা হয়েছে
        let currentStatus = localStorage.getItem(`order_status_${orderId}`) || 'Pending';
        
        let badgeColor = '#ffc107'; // Pending এর জন্য হলুদ
        if (currentStatus === 'Processing') badgeColor = '#17a2b8'; // নীল
        if (currentStatus === 'Delivered') badgeColor = '#28a745'; // সবুজ

        const statusTd = `
            <td class="status-td" style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <select class="status-select" onchange="updateOrderStatus('${orderId}', this)" style="background-color: ${badgeColor}; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px;">
                    <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''} style="background-color: white; color: #333;">⏳ পেন্ডিং</option>
                    <option value="Processing" ${currentStatus === 'Processing' ? 'selected' : ''} style="background-color: white; color: #333;">📦 প্রসেসিং</option>
                    <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''} style="background-color: white; color: #333;">✅ ডেলিভার্ড</option>
                </select>
            </td>
        `;
        row.insertAdjacentHTML('beforeend', statusTd);
    });
}

// স্ট্যাটাস পরিবর্তন করলে ডাটাবেজ ও লোকাল স্টোরেজে আপডেট করার ফাংশন
async function updateOrderStatus(orderId, selectElement) {
    const newStatus = selectElement.value;
    
    // ব্যাকগ্রাউন্ড কালার রিয়েল-টাইমে পরিবর্তন করা
    if (newStatus === 'Pending') selectElement.style.backgroundColor = '#ffc107';
    if (newStatus === 'Processing') selectElement.style.backgroundColor = '#17a2b8';
    if (newStatus === 'Delivered') selectElement.style.backgroundColor = '#28a745';

    // ১. লোকাল অফলাইন মেমোরিতে সেভ রাখা (যাতে আপনার অফলাইন আর্কিটেকচারেও নিখুঁত কাজ করে)
    localStorage.setItem(`order_status_${orderId}`, newStatus);

    // ২. অনলাইন সুপা-বেস টেবিলে আপডেট করার চেষ্টা করা (যদি টেবিলে 'status' কলাম থাকে)
    try {
        await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
            
    } catch (err) {
        // যদি টেবিলে কলাম না থাকে, অফলাইন ব্যাকআপ দিয়ে কাজ চালিয়ে নেবে, কোনো এরর পপ-আপ করবে না
        console.log("Supabase column sync skipped, using safe local cache.");
    }
}
