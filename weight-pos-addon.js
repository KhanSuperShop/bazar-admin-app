(function() {
  const ADDON_SB_URL = 'https://kuecacvhadqzywvkmauo.supabase.co';
  const ADDON_SB_KEY = 'sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI';

  const originalAddByBarcode = window.addByBarcode;
  const originalCompleteSale = window.completeSale;

  // ১. ওজন-ভিত্তিক বারকোড স্ক্যান লজিক
  window.addByBarcode = function(code) {
    const cleanCode = code.trim();

    if (cleanCode.startsWith("20") && cleanCode.length >= 11 && cleanCode.length <= 13) {
      const prodId = parseInt(cleanCode.substring(2, 6), 10);
      const weightGrams = parseInt(cleanCode.substring(6, 11), 10);

      const product = products.find(p => p.id == prodId);
      if (product && weightGrams > 0) {
        const ratePerKg = Number(product.price) || 0;
        const oldRatePerKg = Number(product.old_price) || ratePerKg;
        
        const calculatedPrice = Math.round((ratePerKg / 1000) * weightGrams);
        const calculatedOldPrice = Math.round((oldRatePerKg / 1000) * weightGrams);

        const weightLabel = weightGrams >= 1000 
          ? (weightGrams / 1000) + "kg" 
          : weightGrams + "g";

        cart.push({
          id: product.id + "-w-" + Date.now(),
          real_product_id: product.id,
          weight_kg: weightGrams / 1000,
          name: `${product.title} (${weightLabel})`,
          price: calculatedPrice,
          old_price: calculatedOldPrice,
          qty: 1
        });

        renderCart();
        const searchBox = document.getElementById("searchInput");
        if (searchBox) searchBox.value = "";
        renderProducts();
        return;
      }
    }

    if (typeof originalAddByBarcode === "function") {
      originalAddByBarcode(code);
    }
  };

  // ২. বিল সেভ হওয়ার সময় সরাসরি Supabase-এ স্টক কমানো
  if (typeof originalCompleteSale === "function") {
    window.completeSale = async function() {
      const soldItems = cart.map(item => ({ ...item }));

      // মূল বিল ও সেভ ফাংশন চালানো
      await originalCompleteSale.apply(this, arguments);

      if (navigator.onLine) {
        const stockDeductions = {};

        soldItems.forEach(item => {
          if (item.isQuick) return;

          const pId = item.real_product_id ? item.real_product_id : item.id;
          const deductAmount = item.weight_kg ? (item.weight_kg * Number(item.qty)) : Number(item.qty);

          if (pId && deductAmount > 0) {
            stockDeductions[pId] = (stockDeductions[pId] || 0) + deductAmount;
          }
        });

        const headers = {
          'apikey': ADDON_SB_KEY,
          'Authorization': 'Bearer ' + ADDON_SB_KEY,
          'Content-Type': 'application/json'
        };

        for (const [prodId, totalDeduct] of Object.entries(stockDeductions)) {
          const product = products.find(p => p.id == prodId);
          if (product && product.stock !== null && product.stock !== undefined && product.stock !== "") {
            const currentStock = Number(product.stock);
            if (!isNaN(currentStock)) {
              const newStock = Math.max(0, Number((currentStock - totalDeduct).toFixed(3)));
              product.stock = newStock;
              product.in_stock = newStock > 0;

              try {
                await fetch(`${ADDON_SB_URL}/rest/v1/rpc/deduct_product_stock`, {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify({ 
                    p_id: Number(prodId),
                    deduct_qty: Number(totalDeduct.toFixed(3))
                  })
                });
              } catch (err) {
                console.error("স্টক আপডেট এরর:", err);
              }
            }
          }
        }
        localStorage.setItem('pos_products', JSON.stringify(products));
      }
    };
  }

  // ৩. POS স্ক্রিনে সরাসরি ওজন বসিয়ে বিল করার বাটন যোগ করা
  window.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput && searchInput.parentNode) {
      const weightBtn = document.createElement("button");
      weightBtn.innerText = "⚖️ খোলা ওজন";
      weightBtn.type = "button";
      weightBtn.style.cssText = "background:#e67e22; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-left:5px; font-weight:bold;";
      weightBtn.onclick = openDirectWeightSale;
      searchInput.parentNode.appendChild(weightBtn);
    }
  });

  function openDirectWeightSale() {
    const prodQuery = prompt("পণ্যের নাম বা কোড লিখুন (যেমন: চিনি বা 246):");
    if (!prodQuery) return;
    const product = products.find(p => 
      (p.title && p.title.toLowerCase().includes(prodQuery.toLowerCase())) || 
      p.id.toString() === prodQuery.trim()
    );
    if (!product) return alert("পণ্যটি খুঁজে পাওয়া যায়নি!");

    const grams = parseInt(prompt(`"${product.title}" (৳${product.price}/কেজি) - কত গ্রাম নিবেন? (যেমন: 500)`));
    if (!grams || grams <= 0) return;

    const paddedId = String(product.id).padStart(4, '0');
    const paddedWeight = String(grams).padStart(5, '0');
    window.addByBarcode(`20${paddedId}${paddedWeight}0`);
  }
})();
