// স্বয়ংক্রিয়ভাবে অর্ডার টেবিলে স্ট্যাটাস ড্রপডাউন যোগ করার কোড
const orderTableObserver = new MutationObserver(() => {
    const rows = document.querySelectorAll('#orders-tbody tr');
    rows.forEach((row, idx) => {
        // যদি আগেই ড্রপডাউন যোগ হয়ে থাকে তবে আর যোগ করবে না
        if (row.querySelector('.status-dropdown')) return;
        
        const actionCell = row.cells[5];
        if (!actionCell || typeof globalOrdersData === 'undefined' || !globalOrdersData[idx]) return;

        const order = globalOrdersData[idx];
        
        // পুরনো লাল '✓ সম্পন্ন' বাটনটি লুকিয়ে রাখা
        const buttons = actionCell.querySelectorAll('button');
        if (buttons.length > 1) buttons[1].style.display = 'none';

        // নতুন রঙিন স্ট্যাটাস ড্রপডাউন তৈরি
        const select = document.createElement('select');
        select.className = 'status-dropdown';
        const isDelivered = order.status === 'Delivered';
        
        select.style.cssText = `padding: 4px 6px; border-radius: 4px; font-weight: bold; font-size: 12px; cursor: pointer; margin-top: 4px; display: block; width: 100%; background-color: ${isDelivered ? '#28a745' : '#ffc107'}; color: ${isDelivered ? 'white' : '#333'}; border: 1px solid #ccc;`;

        select.innerHTML = `
            <option value="Pending" ${order.status === 'Pending' || !order.status ? 'selected' : ''}>⏳ পেন্ডিং</option>
            <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>📦 কনফার্মড</option>
            <option value="Delivered" ${isDelivered ? 'selected' : ''}>✅ ডেলিভারড</option>
        `;

        // স্ট্যাটাস পরিবর্তন করলে সুপাবেসে আপডেট হবে
        select.onchange = async function() {
            const newStatus = this.value;
            const { error } = await sbClient
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);

            if (error) {
                alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: ' + error.message);
            } else {
                loadOrders();
            }
        };

        actionCell.appendChild(select);
    });
});

// অর্ডার টেবিলের ওপর নজর রাখা
const targetTbody = document.getElementById('orders-tbody');
if (targetTbody) {
    orderTableObserver.observe(targetTbody, { childList: true });
}
