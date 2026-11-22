(function() {
  // ১. মূল addByBarcode ফাংশনটি নিরাপদে সংরক্ষণ করা
  const originalAddByBarcode = window.addByBarcode;

  // ২. ওজন-ভিত্তিক বারকোড পড়ার নতুন লজিক যুক্ত করা
  window.addByBarcode = function(code) {
    const cleanCode = code.trim();

    // যদি বারকোডটি '20' দিয়ে শুরু হয় এবং ১২ বা ১৩ সংখ্যার হয় (ওজন-ভিত্তিক স্টিকার)
    if (cleanCode.startsWith("20") && (cleanCode.length === 12 || cleanCode.length === 13)) {
      const prodId = parseInt(cleanCode.substring(2, 6), 10);      // ৪ সংখ্যার প্রোডাক্ট ID
      const weightGrams = parseInt(cleanCode.substring(6, 11), 10); // ৫ সংখ্যার ওজন (গ্রামে)

      const product = products.find(p => p.id == prodId);
      if (product && weightGrams > 0) {
        const ratePerKg = Number(product.price) || 0;
        const oldRatePerKg = Number(product.old_price) || ratePerKg;
        
        // লাইভ দাম হিসাব
        const calculatedPrice = Math.round((ratePerKg / 1000) * weightGrams);
        const calculatedOldPrice = Math.round((oldRatePerKg / 1000) * weightGrams);

        // ওজন টেক্সট ফরম্যাট (যেমন: 500g বা 1.5kg)
        const weightLabel = weightGrams >= 1000 
          ? (weightGrams / 1000) + "kg" 
          : weightGrams + "g";

        // কার্টে ইউনিক আইটেম হিসেবে যোগ করা (যাতে ভিন্ন ওজনের প্যাকেট আলাদা থাকে)
        cart.push({
          id: product.id + "-w-" + Date.now(),
          name: `${product.title} (${weightLabel})`,
          price: calculatedPrice,
          old_price: calculatedOldPrice,
          qty: 1
        });

        renderCart();
        const searchBox = document.getElementById("searchInput");
        if (searchBox) searchBox.value = "";
        renderProducts();
        return; // কাজ শেষ, মূল ফাংশনে যাওয়ার দরকার নেই
      }
    }

    // যদি সাধারণ বারকোড হয়, তবে আপনার মূল কোডই কাজ করবে
    if (typeof originalAddByBarcode === "function") {
      originalAddByBarcode(code);
    }
  };

  // ৩. ব্যাকআপ অপশন: POS স্ক্রিনে সরাসরি ওজন বসিয়ে বিল করার বাটন যোগ করা
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
    const prodQuery = prompt("পণ্যের নাম বা কোড লিখুন (যেমন: আলু বা 15):");
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
    window.addByBarcode(`20${paddedId}${paddedWeight}`);
  }
})();
