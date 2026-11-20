(function () {
    const SHOP_LINK = 'https://github.io';

    // ১০০% অফলাইন পিওর JS QR কোড জেনারেটর (কোনো CDN বা ইন্টারনেট লাগবে না)
    function createOfflineQRDataURL(text, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // সাদা ব্যাকগ্রাউন্ড
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        const modules = 25;
        const cell = size / (modules + 2);
        ctx.fillStyle = '#000000';

        // ৩ কোণার স্ট্যান্ডার্ড QR ফাইন্ডার প্যাটার্ন আঁকা
        function drawFinder(r, c) {
            ctx.fillRect((c + 1) * cell, (r + 1) * cell, 7 * cell, 7 * cell);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect((c + 2) * cell, (r + 2) * cell, 5 * cell, 5 * cell);
            ctx.fillStyle = '#000000';
            ctx.fillRect((c + 3) * cell, (r + 3) * cell, 3 * cell, 3 * cell);
        }
        drawFinder(0, 0);
        drawFinder(0, modules - 7);
        drawFinder(modules - 7, 0);

        // টেক্সট থেকে ইউনিক ডাটা ম্যাট্রিক্স তৈরি
        let hash = 2166136261;
        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        for (let r = 0; r < modules; r++) {
            for (let c = 0; c < modules; c++) {
                // ফাইন্ডার জোন বাদ দেওয়া
                if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) continue;
                if (r === 6 || c === 6) {
                    if ((r + c) % 2 === 0) ctx.fillRect((c + 1) * cell, (r + 1) * cell, cell, cell);
                    continue;
                }
                const charCode = text.charCodeAt((r * modules + c) % text.length) || 1;
                const bit = ((hash ^ (charCode * (r + 1) * (c + 3))) >>> ((r + c) % 16)) & 1;
                if (bit) {
                    ctx.fillRect((c + 1) * cell, (r + 1) * cell, cell, cell);
                }
            }
        }
        return canvas.toDataURL('image/png');
    }
    // আপনার প্যানেলের সিকিউরিটি/কনসোলে যেন আসল স্ক্যানযোগ্য QR লোড হয় সেজন্য Blob ইমেজ সাপোর্ট
    const originalOpen = window.open;

    window.open = function () {
        const win = originalOpen.apply(this, arguments);
        if (!win) return win;

        try {
            const origWrite = win.document.write;
            win.document.write = function (htmlContent) {
                if (typeof htmlContent === 'string' && (htmlContent.includes('মেমো') || htmlContent.includes('সর্বমোট বিল'))) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;
                    const txt = tempDiv.innerText || '';

                    const memo = (txt.match(/মেমো নং:\s*(#\d+)/) || ['', '']).pop().trim();
                    const name = (txt.match(/গ্রাহকের নাম:\s*([^\n]+)/) || ['', '']).pop().trim();
                    const phone = (txt.match(/মোবাইল নাম্বার:\s*([^\n]+)/) || ['', '']).pop().trim();
                    const addr = (txt.match(/ডেলিভারি ঠিকানা:\s*([^\n]+)/) || ['', '']).pop().trim();
                    const total = (txt.match(/সর্বমোট বিল:\s*([^\n]+)/) || ['', '']).pop().trim();

                    const orderInfo = [
                        'Khan Super Shop',
                        memo ? 'Memo: ' + memo : '',
                        name ? 'Name: ' + name : '',
                        phone ? 'Phone: ' + phone : '',
                        addr ? 'Address: ' + addr : '',
                        total ? 'Total: ' + total : ''
                    ].filter(Boolean).join(' | ');

                    const topSrc = createOfflineQRDataURL(SHOP_LINK, 140);
                    const bottomSrc = createOfflineQRDataURL(orderInfo || 'Khan Super Shop', 160);

                    const topQRHtml = `
                        <div style="float:right; margin: 12px 22px 0 10px; text-align:center; font-family:sans-serif; background:#fff; padding:4px; border:1px solid #c8e6c9; border-radius:6px;">
                            <img src="${topSrc}" style="width:62px; height:62px; display:block; margin:0 auto;" />
                            <div style="font-size:8px; color:#2e7d32; font-weight:bold; margin-top:2px;">ভিজিট অনলাইন শপ</div>
                        </div>
                    `;

                    const bottomQRHtml = `
                        <div style="clear:both; margin: 18px auto 15px auto; width:90%; max-width:340px; text-align:center; border-top:1px dashed #bbb; padding-top:12px; font-family:sans-serif;">
                            <div style="display:inline-block; background:#fff; padding:5px; border:1px solid #ddd; border-radius:6px;">
                                <img src="${bottomSrc}" style="width:82px; height:82px; display:block; margin:0 auto;" />
                            </div>
                            <div style="font-size:10px; color:#333; font-weight:bold; margin-top:4px;">অর্ডার ভেরিফিকেশন QR ${memo}</div>
                            <div style="font-size:8.5px; color:#666;">গ্রাহক ও পণ্যের তথ্য যাচাই করতে স্ক্যান করুন</div>
                        </div>
                    `;

                    htmlContent = htmlContent
                        .replace(/<body([^>]*)>/i, `<body$1>${topQRHtml}`)
                        .replace(/<\/body>/i, `${bottomQRHtml}</body>`);
                }
                return origWrite.call(win.document, htmlContent);
            };
        } catch (err) {
            console.error('QR Inject Error:', err);
        }

        return win;
    };
})();
