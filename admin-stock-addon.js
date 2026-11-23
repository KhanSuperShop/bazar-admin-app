(function() {
  var ADDON_SB_URL = "https://kuecacvhadqzywvkmauo.supabase.co";
  var ADDON_SB_KEY = "sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI";
  var addonProducts = [];

  async function loadAddonProducts() {
    var selectEl = document.getElementById("addon_edit_select");
    try {
      var res = await fetch(ADDON_SB_URL + "/rest/v1/products?select=id,title,price,stock&order=title.asc", {
        headers: {
          "apikey": ADDON_SB_KEY,
          "Authorization": "Bearer " + ADDON_SB_KEY
        }
      });
      if (!res.ok) throw new Error("Load failed");
      addonProducts = await res.json();
      if (selectEl) {
        selectEl.innerHTML = '<option value="">-- পণ্য বাছাই করুন --</option>';
        addonProducts.forEach(function(p) {
          var st = (p.stock !== null && p.stock !== undefined) ? p.stock : "N/A";
          selectEl.innerHTML += '<option value="' + p.id + '">' + p.title + ' (৳' + p.price + ' | স্টক: ' + st + ')</option>';
        });
      }
    } catch (e) {
      if (selectEl) selectEl.innerHTML = '<option value="">পণ্য লোড হয়নি, রিফ্রেশ করুন</option>';
    }
  }

  function initAddon() {
    var priceInput = document.getElementById("price");
    var form = document.getElementById("productForm");
    if (!priceInput || !form) return;

    var label = document.createElement("label");
    label.innerText = "স্টক পরিমাণ (কেজি বা পিস)";
    
    var stockInput = document.createElement("input");
    stockInput.type = "number";
    stockInput.step = "any";
    stockInput.id = "addon_stock";
    stockInput.placeholder = "যেমন: 50 (খালি রাখলে আনলিমিটেড)";
    stockInput.style.padding = "10px";

    priceInput.insertAdjacentElement("afterend", stockInput);
    priceInput.insertAdjacentElement("afterend", label);

    form.addEventListener("submit", function() {
      var titleEl = document.getElementById("title");
      var stockEl = document.getElementById("addon_stock");
      var titleVal = titleEl ? titleEl.value.trim() : "";
      var stockVal = stockEl ? stockEl.value.trim() : "";

      if (titleVal && stockVal !== "") {
        var numStock = Number(stockVal);
        setTimeout(async function() {
          try {
            var headers = {
              "apikey": ADDON_SB_KEY,
              "Authorization": "Bearer " + ADDON_SB_KEY,
              "Content-Type": "application/json"
            };
            var res = await fetch(ADDON_SB_URL + "/rest/v1/products?title=eq." + encodeURIComponent(titleVal) + "&order=id.desc&limit=1", { headers: headers });
            var data = await res.json();
            
            if (data && data.length > 0) {
              var latestProd = data.at(0);
              await fetch(ADDON_SB_URL + "/rest/v1/rpc/set_product_stock", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ 
                  p_id: Number(latestProd.id),
                  new_qty: numStock
                })
              });
              if (stockEl) stockEl.value = "";
              loadAddonProducts();
            }
          } catch (e) {}
        }, 2500);
      }
    });

    var parentCard = form.closest("div");
    if (parentCard) {
      var quickEditCard = document.createElement("div");
      quickEditCard.style.cssText = "background-color:#fff; padding:20px; border-radius:8px; border:1px solid #ddd;";
      quickEditCard.innerHTML = 
        '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #ff9800; padding-bottom:10px; margin-bottom:12px;">' +
          '<h2 style="margin:0; color:#333; font-size:20px;">⚡ দ্রুত দাম ও স্টক পরিবর্তন</h2>' +
          '<button type="button" id="addon_reload_btn" style="background:#eee; border:1px solid #ccc; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">🔄</button>' +
        '</div>' +
        '<label>পণ্য নির্বাচন করুন</label>' +
        '<select id="addon_edit_select" style="width:100%; padding:10px; margin-bottom:12px; border:1px solid #ccc; border-radius:5px; font-size:14px;">' +
          '<option value="">লোড হচ্ছে...</option>' +
        '</select>' +
        '<div style="display:flex; gap:10px;">' +
          '<div style="flex:1;">' +
            '<label>নতুন দাম (৳)</label>' +
            '<input type="number" step="any" id="addon_edit_price" placeholder="দাম" style="width:100%; padding:10px;">' +
          '</div>' +
          '<div style="flex:1;">' +
            '<label>নতুন স্টক (কেজি/পিস)</label>' +
            '<input type="number" step="any" id="addon_edit_stock" placeholder="স্টক" style="width:100%; padding:10px;">' +
          '</div>' +
        '</div>' +
        '<button type="button" id="addon_save_btn" style="width:100%; background:#ff9800; color:#fff; border:none; padding:12px; border-radius:5px; font-size:15px; font-weight:bold; cursor:pointer;">✔ দাম ও স্টক আপডেট করুন</button>';
      
      parentCard.insertAdjacentElement("afterend", quickEditCard);

      document.getElementById("addon_reload_btn").addEventListener("click", loadAddonProducts);

      var selectEl = document.getElementById("addon_edit_select");
      selectEl.addEventListener("change", function() {
        var p = addonProducts.find(function(item) { return item.id == selectEl.value; });
        if (p) {
          document.getElementById("addon_edit_price").value = (p.price !== null && p.price !== undefined) ? p.price : "";
          document.getElementById("addon_edit_stock").value = (p.stock !== null && p.stock !== undefined) ? p.stock : "";
        } else {
          document.getElementById("addon_edit_price").value = "";
          document.getElementById("addon_edit_stock").value = "";
        }
      });

      document.getElementById("addon_save_btn").addEventListener("click", async function() {
        var pId = selectEl.value;
        var newPrice = Number(document.getElementById("addon_edit_price").value);
        var newStock = Number(document.getElementById("addon_edit_stock").value);

        if (!pId) return alert("আগে একটি পণ্য নির্বাচন করুন!");
        if (isNaN(newPrice) || newPrice < 0) return alert("সঠিক দাম লিখুন!");
        if (isNaN(newStock) || newStock < 0) return alert("সঠিক স্টক পরিমাণ লিখুন!");

        var btn = document.getElementById("addon_save_btn");
        btn.innerText = "আপডেট হচ্ছে...";
        btn.disabled = true;

        try {
          var headers = {
            "apikey": ADDON_SB_KEY,
            "Authorization": "Bearer " + ADDON_SB_KEY,
            "Content-Type": "application/json"
          };
          var res = await fetch(ADDON_SB_URL + "/rest/v1/rpc/update_product_price_stock", {
            method: "POST",
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
            alert("❌ আপডেট হতে সমস্যা হয়েছে।");
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAddon);
  } else {
    initAddon();
  }
})();
