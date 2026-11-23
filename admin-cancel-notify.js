(function () {
    const URL = "https://kuecacvhadqzywvkmauo.supabase.co";
    const KEY = "sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI";
    const headers = {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json'
    };

    // ১. অ্যাডমিন প্যানেলের উপরে নোটিফিকেশন বক্স তৈরি করা
    const banner = document.createElement('div');
    banner.id = 'admin-cancel-alert-box';
    banner.style.cssText = 'display:none; position:sticky; top:0; z-index:99999; background:#d32f2f; color:#fff; padding:12px 16px; font-family:sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.25); border-bottom:3px solid #b71c1c;';
    document.body.prepend(banner);

    let knownCancelledIds = JSON.parse(localStorage.getItem('seen_cancelled_orders') || '[]');
    let beepPlayedIds = [];

    // ২. Supabase থেকে বাতিল হওয়া অর্ডার চেক করা
    async function checkCancelledOrders() {
        try {
            const res = await fetch(`${URL}/rest/v1/orders?status=eq.cancelled&select=*&order=id.desc`, { headers });
            if (!res.ok) return;
            const cancelledOrders = await res.json();

            if (!cancelledOrders || cancelledOrders.length === 0) {
                banner.style.display = 'none';
                return;
            }

            // টেবিলে বাতিল অর্ডারগুলো হাইলাইট করা
            highlightCancelledRows(cancelledOrders);

            // যেগুলো এখনো দেখা হয়নি (Unseen) শুধু সেগুলো ফিল্টার করা
            const unseenCancels = cancelledOrders.filter(o => !knownCancelledIds.includes(o.id));

            // সব বাতিল অর্ডার দেখা হয়ে গেলে ব্যানার বন্ধ রাখা
            if (unseenCancels.length === 0) {
                banner.style.display = 'none';
                return;
            }

            // একদম নতুন অর্ডারের জন্য একবারই শব্দ বাজানো
            const brandNew = unseenCancels.filter(o => !beepPlayedIds.includes(o.id));
            if (brandNew.length > 0) {
                playAlertBeep();
                brandNew.forEach(o => beepPlayedIds.push(o.id));
            }

            // সর্বশেষ না দেখা বাতিল অর্ডারটি নেওয়া
            const latest = unseenCancels.at(0);
            banner.style.display = 'block';
            banner.innerHTML = `
                <div style="max-width:1100px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div style="font-size:14px; line-height:1.5;">
                        <strong>🚨 অর্ডার বাতিলের নোটিফিকেশন:</strong> নতুন <strong>${unseenCancels.length}টি</strong> অর্ডার কাস্টমার বাতিল করেছেন। 
                        <span style="background:rgba(0,0,0,0.25); padding:2px 8px; border-radius:4px; margin-left:5px;">
                            সর্বশেষ: অর্ডার #${latest.id} (${latest.customer_name || 'গ্রাহক'} - ৳${latest.total_amount || 0})
                        </span>
                    </div>
                    <button id="dismiss-cancel-banner" style="background:#fff; color:#d32f2f; border:none; padding:5px 12px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:12px;">
                        ✓ দেখেছি (বন্ধ করুন)
                    </button>
                </div>
            `;

            document.getElementById('dismiss-cancel-banner').onclick = function () {
                knownCancelledIds = cancelledOrders.map(o => o.id);
                localStorage.setItem('seen_cancelled_orders', JSON.stringify(knownCancelledIds));
                banner.style.display = 'none';
            };
        } catch (err) {
            console.error('Cancel check error:', err);
        }
    }

    function highlightCancelledRows(cancelledOrders) {
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(tr => {
            const rowText = tr.innerText;
            cancelledOrders.forEach(order => {
                const matchById = new RegExp(`(^|\\s|#)${order.id}(\\s|$)`).test(rowText);
                const matchByDetails = order.delivery_address && rowText.includes(order.delivery_address) && rowText.includes(String(order.total_amount));

                if ((matchById || matchByDetails) && !tr.dataset.markedCancelled) {
                    tr.dataset.markedCancelled = 'true';
                    tr.style.backgroundColor = '#ffebee';
                    tr.style.color = '#b71c1c';

                    const buttons = tr.querySelectorAll('button');
                    buttons.forEach(btn => {
                        if (btn.innerText.includes('সম্পন্ন')) {
                            btn.style.display = 'none';
                        }
                    });

                    const lastCell = tr.lastElementChild;
                    if (lastCell) {
                        const badge = document.createElement('span');
                        badge.innerText = '❌ কাস্টমার বাতিল করেছে';
                        badge.style.cssText = 'display:inline-block; background:#d32f2f; color:#fff; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; margin-top:4px;';
                        lastCell.appendChild(badge);
                    }
                }
            });
        });
    }

    function playAlertBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {}
    }

    setTimeout(checkCancelledOrders, 1000);
    setInterval(checkCancelledOrders, 5000);
})();
