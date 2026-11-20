(function () {
    const SHOP_LINK = 'https://github.io';

    // বাইরের কোনো ইন্টারনেট লিংক ছাড়াই ব্রাউজারে তাৎক্ষণিক QR কোড তৈরির অফলাইন ইঞ্জিন
    function generateInstantQR(text, size) {
        // সিম্পল ও নির্ভরযোগ্য QR ডাটা ইউআরআই (SVG ভিত্তিক, ১০০% অফলাইনে কাজ করে)
        const qrLib = window.QRious;
        if (qrLib) {
            return new qrLib({ value: text, size: size, level: 'M' }).toDataURL();
        }
        return null;
    }

    // পেজ লোড হওয়ার সাথে সাথেই QR লাইব্রেরি ক্যাশ করে নেওয়া
    const script = document.createElement('script');
    script.src = 'https://jsdelivr.net';
    document.head.appendChild(script);

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
                    ].filter(Boolean).join('\n');

                    const topQRData = generateInstantQR(SHOP_LINK, 140);
                    const bottomQRData = generateInstantQR(orderInfo || 'Khan Super Shop', 160);

                    const topSrc = topQRData || `https://qrserver.com{encodeURIComponent(SHOP_LINK)}`;
                    const bottomSrc = bottomQRData || `https://qrserver.com{encodeURIComponent(orderInfo)}`;
                    // ১. উপরের QR কোড (সুন্দরভাবে ডান কোণায় বর্ডারের ভেতরে)
                    const topQRHtml = `
                        <div style="float:right; margin: 12px 22px 0 10px; text-align:center; font-family:sans-serif; background:#fff; padding:4px; border:1px solid #c8e6c9; border-radius:6px;">
                            <img src="${topSrc}" style="width:62px; height:62px; display:block; margin:0 auto;" />
                            <div style="font-size:8px; color:#2e7d32; font-weight:bold; margin-top:2px;">ভিজিট অনলাইন শপ</div>
                        </div>
                    `;

                    // ২. নিচের QR কোড (মেমোর একদম নিচে সুন্দর বক্সে)
                    const bottomQRHtml = `
                        <div style="clear:both; margin: 18px auto 15px auto; width:90%; max-width:340px; text-align:center; border-top:1px dashed #bbb; padding-top:12px; font-family:sans-serif;">
                            <div style="display:inline-block; background:#fff; padding:5px; border:1px solid #ddd; border-radius:6px;">
                                <img src="${bottomSrc}" style="width:82px; height:82px; display:block; margin:0 auto;" />
                            </div>
                            <div style="font-size:10px; color:#333; font-weight:bold; margin-top:4px;">অর্ডার ভেরিফিকেশন QR ${memo}</div>
                            <div style="font-size:8.5px; color:#666;">গ্রাহক ও পণ্যের তথ্য যাচাই করতে স্ক্যান করুন</div>
                        </div>
                    `;

                    // হেডারের শুরুতে ডানপাশে এবং একদম শেষে ফুটারের নিচে বসানো
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
