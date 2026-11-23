(function() {
  const SUPABASE_URL = 'https://kuecacvhadqzywvkmauo.supabase.co'; 
  const SUPABASE_ANON_KEY = 'sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI';
  window.addEventListener("DOMContentLoaded", () => {
    const priceInput = document.getElementById("price");
    if (!priceInput) return;

    // মূল্য (৳) ঘরের ঠিক নিচে স্টক ইনপুট ঘর তৈরি করা
    const label = document.createElement("label");
    label.innerText = "স্টক পরিমাণ (কেজি বা পিস)";
    
    const stockInput = document.createElement("input");
    stockInput.type = "number";
    stockInput.step = "any";
    stockInput.id = "addon_stock";
    stockInput.placeholder = "যেমন: 50 (খালি রাখলে আনলিমিটেড)";
    stockInput.style.padding = "10px";

    priceInput.insertAdjacentElement("afterend", stockInput);
    priceInput.insertAdjacentElement("afterend", label);

    // ফর্ম সাবমিট হলে নতুন পণ্যের সাথে স্টকও সেভ করা
    const form = document.getElementById("productForm");
    if (form) {
      form.addEventListener("submit", () => {
        const titleVal = document.getElementById("title")?.value.trim();
        const stockVal = document.getElementById("addon_stock")?.value.trim();

        if (titleVal && stockVal !== "") {
          const numStock = Number(stockVal);
          // মূল ফর্ম ডাটাবেজে পণ্য সেভ করার ২ সেকেন্ড পর স্টক আপডেট করা
          setTimeout(async () => {
            try {
              const headers = {
                'apikey': ADDON_SB_KEY,
                'Authorization': 'Bearer ' + ADDON_SB_KEY,
                'Content-Type': 'application/json'
              };
              // সর্বশেষ যোগ হওয়া পণ্যটির ID খুঁজে বের করা
              const res = await fetch(`${ADDON_SB_URL}/rest/v1/products?title=eq.${encodeURIComponent(titleVal)}&order=id.desc&limit=1`, { headers });
              const data = await res.json();
              
              if (data && data.length > 0) {
                await fetch(`${ADDON_SB_URL}/rest/v1/products?id=eq.${data[0].id}`, {
                  method: 'PATCH',
                  headers: headers,
                  body: JSON.stringify({ 
                    stock: numStock,
                    in_stock: numStock > 0
                  })
                });
              }
            } catch (e) {
              console.error("স্টক সেভ এরর:", e);
            }
          }, 2000);
        }
      });
    }
  });
})();
