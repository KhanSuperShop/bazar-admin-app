(function() {
  const SUPABASE_URL = 'https://kuecacvhadqzywvkmauo.supabase.co'; 
 const SUPABASE_ANON_KEY = 'sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI';
  let addonProducts = [];

  window.addEventListener("DOMContentLoaded", () => {
    const priceInput = document.getElementById("price");
    const form = document.getElementById("productForm");
    if (!priceInput || !form) return;

    // ১. নতুন পণ্য যোগ করার ফর্মে স্টক ইনপুট ঘর যোগ করা
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

    form.addEventListener("submit", () => {
      const titleVal = document.getElementById("title")?.value.trim();
      const stockVal = document.getElementById("addon_stock")?.value.trim();

      if (titleVal && stockVal !== "") {
        const numStock = Number(stockVal);
        setTimeout(async () => {
          try {
            const headers = {
              'apikey': ADDON_SB_KEY,
              'Authorization': 'Bearer ' + ADDON_SB_KEY,
              'Content-Type': 'application/json'
            };
            const res = await fetch(`${ADDON_SB_URL}/rest/v1/products?title=eq.${encodeURIComponent(titleVal)}&order=id.desc&limit=1`, { headers });
            const data = await res.json();
            
            if (data && data.length > 0) {
              const latestProd = data.at(0);
              await fetch(`${ADDON_SB_URL}/rest/v1/rpc/set_product_stock`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                  p_id: Number(latestProd.id),
                  new_qty: numStock
                })
              });
              document.getElementById("addon_stock").value = "";
              loadAddonProducts();
            }
          } catch (e) {
            console.error("স্টক সেভ এরর:", e);
          }
        }, 2500);
      }
    });

    // ২. পুরনো পণ্যের দাম ও স্টক একসাথে পরিবর্তনের আলাদা কার্ড তৈরি
    const parentCard = form.closest("div");
    if (parentCard) {
      const quickEditCard = document.createElement("div");
      quickEditCard.style.cssText = "background-color:#fff; padding:20px; border-radius:8px; border:1px solid #ddd;";
      quickEditCard.innerHTML = `
        <h2 style="margin-top:0; color:#333; border-bottom:2px solid #ff9800; padding-bottom:10px; font-size:20px;">⚡ দ্রুত দাম ও স্টক পরিবর্তন</h2>
        <label>পণ্য নির্বাচন করুন</label>
        <select id="addon_edit_select" style="width:100%; padding:10px; margin-bottom:12px; border:1px solid #ccc; border-radius:5px; font-size:14px;">
          <option value="">লোড হচ্ছে...</option>
        </select>
        <div style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label>নতুন দাম (৳)</label>
            <input type="number" step="any" id="addon_edit_price" placeholder="দাম" style="width:100%; padding:10px;">
          </div>
          <div style="flex:1;">
            <label>নতুন স্টক (কেজি/পিস)</label>
            <input type="number" step="any" id="addon_edit_stock" placeholder="স্টক" style="width:100%; padding:10px;">
          </div>
        </div>
        <button type="button" id="addon_save_btn" style="width:100%; background:#ff9800; color:#fff; border:none; padding:12px; border-radius:5px; font-size:15px; font-weight:bold; cursor:pointer;">✔ দাম ও স্টক আপডেট করুন</button>
      `;
      parentCard.insertAdjacentElement("afterend", quickEditCard);

      const selectEl = document.getElementById("addon_edit_select");
      selectEl.addEventListener("change", () => {
        const p = addonProducts.find(item => item.id == selectEl.value);
        if (p) {
          document.getElementById("addon_edit_price").value = p.price ?? "";
          document.getElementById("addon_edit_stock").value = p.stock ?? "";
        } else {
          document.getElementById("addon_edit_price").value = "";
          document.getElementById("addon_edit_stock").value = "";
        }
      });

      document.getElementById("addon_save_btn").addEventListener("click", async () => {
        const pId = selectEl.value;
        const newPrice = Number(document.getElementById("addon_edit_price").value);
        const newStock = Number(document.getElementById("addon_edit_stock").value);

        if (!pId) return alert("আগে একটি পণ্য নির্বাচন করুন!");
        if (isNaN(newPrice) || newPrice < 0) return alert("সঠিক দাম লিখুন!");
        if (isNaN(newStock) || newStock < 0) return alert("সঠিক স্টক পরিমাণ লিখুন!");

        const btn = document.getElementById("addon_save_btn");
        btn.innerText = "আপডেট হচ্ছে...";
        btn.disabled = true;

        try {
          const headers = {
            'apikey': ADDON_SB_KEY,
            'Authorization': 'Bearer ' + ADDON_SB_KEY,
            'Content-Type': 'application/json'
          };
          const res = await fetch(`${ADDON_SB_URL}/rest/v1/rpc/update_product_price_stock`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              p_id: Number(pId),
              new_price: newPrice,
              new_qty: newStock
            })
          });

          if (res.ok) {
            alert("✅ পণ্যের দাম ও স্টক সফলভাবে আপডেট হয়েছে!");
            await loadAddonProducts();
          } else {
            alert("❌ আপডেট হতে সমস্যা হয়েছে। SQL কোডটি রান করা আছে কি না দেখুন।");
          }
        } catch (err) {
          alert("নেটওয়ার্ক সমস্যা: " + err.message);
        } finally {
          btn.innerText = "✔ দাম ও স্টক আপডেট করুন";
          btn.disabled = false;
        }
      });

      loadAddonProducts();
    }
  });

  async function loadAddonProducts() {
    try {
      const headers = {
        'apikey': ADDON_SB_KEY,
        'Authorization': 'Bearer ' + ADDON_SB_KEY
      };
      const res = await fetch(`${ADDON_SB_URL}/rest/v1/products?select=id,title,price,stock&order=title.asc`, { headers });
      addonProducts = await res.json();
      const selectEl = document.getElementById("addon_edit_select");
      if (selectEl) {
        selectEl.innerHTML = '<option value="">-- পণ্য বাছাই করুন --</option>';
        addonProducts.forEach(p => {
          selectEl.innerHTML += `<option value="${p.id}">${p.title} (৳${p.price} | স্টক: ${p.stock ?? 'N/A'})</option>`;
        });
      }
    } catch (e) {
      console.error("পণ্য লোড এরর:", e);
    }
  }
})();
