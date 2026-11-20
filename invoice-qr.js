(function () {
    const SHOP_LINK = 'https://github.io';

    // প্রিন্ট উইন্ডো (window.open) ইন্টারসেপ্ট করে ২টি QR কোড যুক্ত করা
    const originalWindowOpen = window.open;

    window.open = function (url, name, specs) {
        const printWin = originalWindowOpen.apply(this, arguments);

        if (printWin && (!url || url === '' || url === 'about:blank')) {
            setTimeout(() => {
                try {
                    const doc = printWin.document;
                    if (!doc || !doc.body) return;

                    // মেমো থেকে অর্ডারের তথ্য সংগ্রহ করা
                    const fullText = doc.body.innerText || '';
                    const memoMatch = fullText.match(/মেমো নং:\s*(#\d+)/);
                    const nameMatch = fullText.match(/গ্রাহকের নাম:\s*([^\n]+)/);
                    const phoneMatch = fullText.match(/মোবাইল নাম্বার:\s*([^\n]+)/);
                    const addressMatch = fullText.match(/ডেলিভারি ঠিকানা:\s*([^\n]+)/);
                    const totalMatch = fullText.match(/সর্বমোট বিল:\s*([^\n]+)/);

                    const orderSummary = [
                        'খান সুপার শপ - অর্ডার তথ্য',
                        memoMatch ? `মেমো: ${memoMatch.trim()}` : '',
                        nameMatch ? `গ্রাহক: ${nameMatch.trim()}` : '',
                        phoneMatch ? `মোবাইল: ${phoneMatch.trim()}` : '',
                        addressMatch ? `ঠিকানা: ${addressMatch.trim()}` : '',
                        totalMatch ? `মোট বিল: ${totalMatch.trim()}` : ''
                    ].filter(Boolean).join('\n');

                    // ১. উপরের QR কোড (দোকানের ওয়েবসাইট লিংক)
                    const topQrUrl = `https://qrserver.com{encodeURIComponent(SHOP_LINK)}`;
                    const topQrBox = doc.createElement('div');
                    topQrBox.style.cssText = 'position:absolute; top:12px; right:15px; text-align:center; font-family:sans-serif;';
                    topQrBox.innerHTML = `
                        <img src="${topQrUrl}" style="width:65px; height:65px; border:1px solid #ddd; padding:2px; background:#fff;" />
                        <div style="font-size:9px; color:#2e7d32; font-weight:bold; margin-top:2px;">অনলাইন শপ</div>
                    `;

                    if (getComputedStyle(doc.body).position === 'static') {
                        doc.body.style.position = 'relative';
                    }
                    doc.body.appendChild(topQrBox);

                    // ২. নিচের QR কোড (ওই অর্ডারের বিস্তারিত তথ্য)
                    const bottomQrUrl = `https://qrserver.com{encodeURIComponent(orderSummary)}`;
                    const bottomQrBox = doc.createElement('div');
                    bottomQrBox.style.cssText = 'margin-top:15px; text-align:center; border-top:1px dashed #ccc; padding-top:10px; font-family:sans-serif;';
                    bottomQrBox.innerHTML = `
                        <img src="${bottomQrUrl}" style="width:85px; height:85px; border:1px solid #ddd; padding:3px; background:#fff;" />
                        <div style="font-size:10px; color:#555; margin-top:3px;">অর্ডার ভেরিফিকেশন QR (${memoMatch ? memoMatch : 'ইনভয়েস'})</div>
                    `;
                    doc.body.appendChild(bottomQrBox);

                    // ছবি লোড হওয়া নিশ্চিত করতে সামান্য অপেক্ষা করে প্রিন্ট রিফ্রেশ করা
                    const imgs = doc.querySelectorAll('img');
                    let loadedCount = 0;
                    imgs.forEach(img => {
                        img.onload = () => {
                            loadedCount++;
                            if (loadedCount === imgs.length && typeof printWin.print === 'function') {
                                // যদি আগে থেকেই প্রিন্ট ডায়ালগ না খুলে থাকে তবে খুলবে
                            }
                        };
                    });
                } catch (e) {
                    console.error('QR Inject Error:', e);
                }
            }, 150);
        }

        return printWin;
    };
})();
