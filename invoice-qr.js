(function () {
    const SHOP_LINK = 'https://khansupershop.github.io/bazar-live-app/';

    // দ্রুত QR কোড তৈরির জন্য Google/QRious লাইব্রেরি লোড করা
    const qrScript = document.createElement('script');
    qrScript.src = 'https://cloudflare.com';
    document.head.appendChild(qrScript);

    function generateQRDataURL(text, size) {
        if (window.QRious) {
            const qr = new window.QRious({
                value: text,
                size: size,
                level: 'M'
            });
            return qr.toDataURL();
        }
        return `https://qrserver.com{size}x${size}&data=${encodeURIComponent(text)}`;
    }

    const originalWindowOpen = window.open;

    window.open = function (url, name, specs) {
        const printWin = originalWindowOpen.apply(this, arguments);

        if (printWin && (!url || url === '' || url === 'about:blank')) {
            // মূল কোডের print() কলটিকে সাময়িকভাবে আটকে রাখা যাতে আগে QR কোড বসে যায়
            const origPrint = printWin.print;
            let qrInjected = false;

            function injectQRCodes() {
                if (qrInjected) return;
                const doc = printWin.document;
                if (!doc || !doc.body || !doc.body.innerText.trim()) return;
                qrInjected = true;

                try {
                    const fullText = doc.body.innerText || '';
                    const memoMatch = fullText.match(/মেমো নং:\s*(#\d+)/);
                    const nameMatch = fullText.match(/গ্রাহকের নাম:\s*([^\n]+)/);
                    const phoneMatch = fullText.match(/মোবাইল নাম্বার:\s*([^\n]+)/);
                    const addressMatch = fullText.match(/ডেলিভারি ঠিকানা:\s*([^\n]+)/);
                    const totalMatch = fullText.match(/সর্বমোট বিল:\s*([^\n]+)/);

                    const memoNo = memoMatch ? memoMatch.split(':').pop().trim() : '';
                    const cName = nameMatch ? nameMatch.split(':').pop().trim() : '';
                    const cPhone = phoneMatch ? phoneMatch.split(':').pop().trim() : '';
                    const cAddr = addressMatch ? addressMatch.split(':').pop().trim() : '';
                    const cTotal = totalMatch ? totalMatch.split(':').pop().trim() : '';

                    const orderSummary = [
                        'Khan Super Shop',
                        memoNo ? `Memo: ${memoNo}` : '',
                        cName ? `Name: ${cName}` : '',
                        cPhone ? `Phone: ${cPhone}` : '',
                        cAddr ? `Address: ${cAddr}` : '',
                        cTotal ? `Total: ${cTotal}` : ''
                    ].filter(Boolean).join('\n');

                    // ১. উপরের QR কোড (দোকানের ওয়েবসাইট লিংক)
                    const topQrImg = generateQRDataURL(SHOP_LINK, 120);
                    const topQrBox = doc.createElement('div');
                    topQrBox.style.cssText = 'position:absolute; top:10px; right:15px; text-align:center; font-family:sans-serif;';
                    topQrBox.innerHTML = `
                        <img src="${topQrImg}" style="width:62px; height:62px; border:1px solid #ccc; padding:2px; background:#fff;" />
                        <div style="font-size:9px; color:#2e7d32; font-weight:bold; margin-top:2px;">অনলাইন শপ</div>
                    `;
                    doc.body.style.position = 'relative';
                    doc.body.appendChild(topQrBox);

                    // ২. নিচের QR কোড (ওই অর্ডারের বিস্তারিত তথ্য)
                    const bottomQrImg = generateQRDataURL(orderSummary, 150);
                    const bottomQrBox = doc.createElement('div');
                    bottomQrBox.style.cssText = 'margin-top:15px; text-align:center; border-top:1px dashed #ccc; padding-top:10px; font-family:sans-serif;';
                    bottomQrBox.innerHTML = `
                        <img src="${bottomQrImg}" style="width:85px; height:85px; border:1px solid #ccc; padding:3px; background:#fff;" />
                        <div style="font-size:10px; color:#444; margin-top:3px; font-weight:bold;">অর্ডার তথ্য যাচাই QR ${memoNo}</div>
                    `;
                    doc.body.appendChild(bottomQrBox);
                } catch (e) {
                    console.error('QR Error:', e);
                }
            }

            printWin.print = function () {
                injectQRCodes();
                setTimeout(() => {
                    origPrint.call(printWin);
                }, 250);
            };

            // ব্যাকআপ হিসেবে ৪০০ms পর চেক করা
            setTimeout(injectQRCodes, 400);
        }

        return printWin;
    };
})();
