(function() {
  var ADDON_SB_URL = "https://kuecacvhadqzywvkmauo.supabase.co";
  var ADDON_SB_KEY = "sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI";
  var addonProducts = [];

  async function loadAddonProducts() {
    var selectEl = document.getElementById("addon_edit_select");
    try {
      var res = await fetch(ADDON_SB_URL + "/rest/v1/products?select=id,title,price,old_price,stock&order=title.asc", {
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
          var oldTxt = (p.old_price && p.old_price > p.price) ? " | আগের: ৳" + p.old_price : "";
          selectEl.innerHTML += '<option value="' + p.id + '">' + p.title + ' (৳' + p.price + oldTxt + ' | স্টক: ' + st + ')</option>';
        });
      }
      enhanceProductTableRows();
    } catch (e) {
      if (selectEl) selectEl.innerHTML = '<option value="">পণ্য লোড হয়নি, রিফ্রেশ করুন</option>';
    }
  }

  // নিচের সকল পণ্যের তালিকায় লাইভ স্টক ব্যাজ দেখানো
  function enhanceProductTableRows() {
    var tables = document.querySelectorAll("table");
    tables.forEach(function(tbl) {
      if (tbl.id === "orders-table") return;
      var rows = tbl.querySelectorAll("tbody tr");
      rows.forEach(function(tr) {
        var cells = tr.querySelectorAll("td");
        if (cells.length >= 3) {
          var titleText = cells.at(1) ? cells.at(1).innerText.trim() : "";
          var prod = addonProducts.find(function(item) { return item.title && titleText.includes(item.title.trim()); });
          if (prod && cells.at(1)) {
            var oldBadge = cells.at(1).querySelector(".addon-stock-badge");
            if (oldBadge) oldBadge.remove();
            var stVal = (prod.stock !== null && prod.stock !== undefined) ? prod.stock : "আনলিমিটেড";
            var badge = document.createElement("div");
            badge.className = "addon-stock-badge";
            badge.style.cssText = "font-size:12px; color:#0066cc; font-weight:bold; margin-top:3px;";
            badge.innerText = "📦 স্টক: " + stVal;
            cells.at(1).appendChild(badge);
          }
        }
      });
    });
  }

  function findProductListCard() {
    var headings = document.querySelectorAll("h2");
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].innerText.includes("সকল পণ্যের তালিকা")) {
        return headings[i].closest("div[style*='background-color: #fff'], div[style*='background-color:#fff'], div");
      }
    }
    return null;
  }

  function initAddon() {
    var priceInput = document.getElementById("price");
    var form = document.getElementById("productForm");

    // ১. নতুন পণ্য যোগ করার ফর্মে স্টক ইনপুট ঘর যোগ করা
    if (priceInput && form) {
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
    }

    // ২. "সকল পণ্যের তালিকা (এডিট / ডিলিট)" এর ঠিক ওপরে একসাথে দাম, ছাড় (%), কাটা দাম ও স্টক বক্স বসানো
    var listCard = findProductListCard();
    var targetContainer = listCard ? listCard.parentElement : (form ? form.closest("div") : null);

    if (targetContainer) {
      var quickEditCard = document.createElement("div");
      quickEditCard.style.cssText = "background-color:#fff; padding:20px; border-radius:8px; border:2px solid #ff9800; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06);";
      quickEditCard.innerHTML = 
        '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #ff9800; padding-bottom:10px; margin-bottom:12px;">' +
          '<h2 style="margin:0; color:#333; font-size:19px;">⚡ দ্রুত দাম, ছাড় (%) ও স্টক আপডেট (একসাথে)</h2>' +
          '<button type="button" id="addon_reload_btn" style="background:#eee; border:1px solid #ccc; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">🔄 রিফ্রেশ</button>' +
        '</div>' +
        '<label>১. পণ্য নির্বাচন করুন</label>' +
        '<select id="addon_edit_select" style="width:100%; padding:10px; margin-bottom:12px; border:1px solid #ccc; border-radius:5px; font-size:14px; font-weight:bold;">' +
          '<option value="">লোড হচ্ছে...</option>' +
        '</select>' +
        '<div style="display:flex; gap:10px; flex-wrap:wrap;">' +
          '<div style="flex:1; min-width:110px;">' +
            '<label>আগের দাম (কাটা ৳)</label>' +
            '<input type="number" step="any" id="addon_edit_old_price" placeholder="যেমন: 100" style="width:100%; padding:10px;">' +
          '</div>' +
          '<div style="flex:1; min-width:110px;">' +
            '<label>ছাড় দিন (%)</label>' +
            '<input type="number" step="any" id="addon_edit_discount" placeholder="যেমন: 10 বা 20" style="width:100%; padding:10px; background:#fff8e1;">' +
          '</div>' +
          '<div style="flex:1; min-width:110px;">' +
            '<label>নতুন দাম (৳) *</label>' +
            '<input type="number" step="any" id="addon_edit_price" placeholder="নতুন দাম" style="width:100%; padding:10px; font-weight:bold; color:#28a745;">' +
          '</div>' +
          '<div style="flex:1; min-width:110px;">' +
            '<label>নতুন স্টক (কেজি/পিস)</label>' +
            '<input type="number" step="any" id="addon_edit_stock" placeholder="স্টক" style="width:100%; padding:10px;">' +
          '</div>' +
        '</div>' +
        '<div id="addon_preview_line" style="font-size:13px; color:#d32f2f; font-weight:bold; margin-bottom:10px; min-height:18px;"></div>' +
        '<button type="button" id="addon_save_btn" style="width:100%; background:#ff9800; color:#fff; border:none; padding:12px; border-radius:5px; font-size:15px; font-weight:bold; cursor:pointer;">✔ দাম, ছাড় ও স্টক আপডেট করুন</button>';
      
      if (listCard) {
        listCard.insertAdjacentElement("beforebegin", quickEditCard);
      } else {
        targetContainer.insertAdjacentElement("afterend", quickEditCard);
      }

      var selectEl = document.getElementById("addon_edit_select");
      var oldPriceEl = document.getElementById("addon_edit_old_price");
      var discountEl = document.getElementById("addon_edit_discount");
      var newPriceEl = document.getElementById("addon_edit_price");
      var stockEl = document.getElementById("addon_edit_stock");
      var previewEl = document.getElementById("addon_preview_line");

      function updatePreview() {
        var op = Number(oldPriceEl.value) || 0;
        var np = Number(newPriceEl.value) || 0;
        if (op > np && np > 0) {
          var pct = Math.round(((op - np) / op) * 100);
          previewEl.innerHTML = 'প্রিভিউ: <span style="text-decoration:line-through; color:#888;">৳' + op + '</span> → <span style="color:#28a745; font-size:15px;">৳' + np + '</span> <span style="background:#ffebee; color:#d32f2f; padding:2px 6px; border-radius:4px;">-' + pct + '% ছাড়</span>';
        } else if (np > 0) {
          previewEl.innerHTML = 'প্রিভিউ: বর্তমান বিক্রয় মূল্য <span style="color:#28a745; font-size:15px;">৳' + np + '</span> (কোনো ছাড় নেই)';
        } else {
          previewEl.innerHTML = "";
        }
      }

      // ছাড় (%) লিখলে অটোমেটিক নতুন দাম হিসাব হওয়া
      discountEl.addEventListener("input", function() {
        var disc = Number(discountEl.value);
        var basePrice = Number(oldPriceEl.value) || Number(newPriceEl.value);
        if (!oldPriceEl.value && newPriceEl.value) {
          oldPriceEl.value = newPriceEl.value;
          basePrice = Number(oldPriceEl.value);
        }
        if (basePrice > 0 && disc >= 0 && disc <= 100) {
          var discounted = Math.round(basePrice - (basePrice * disc / 100));
          newPriceEl.value = discounted;
        }
        updatePreview();
      });

      oldPriceEl.addEventListener("input", updatePreview);
      newPriceEl.addEventListener("input", function() {
      newPriceEl.addEventListener("input", function() {
        var op = Number(oldPriceEl.value) || 0;
        var np = Number(newPriceEl.value) || 0;
        if (op > np && np > 0) {
          discountEl.value = Math.round(((op - np) / op) * 100);
        } else {
          discountEl.value = "";
        }
        updatePreview();
      });

      selectEl.addEventListener("change", function() {
        var p = addonProducts.find(function(item) { return item.id == selectEl.value; });
        if (p) {
          newPriceEl.value = (p.price !== null && p.price !== undefined) ? p.price : "";
          oldPriceEl.value = (p.old_price && p.old_price > p.price) ? p.old_price : "";
          stockEl.value = (p.stock !== null && p.stock !== undefined) ? p.stock : "";
          if (p.old_price && p.old_price > p.price) {
            discountEl.value = Math.round(((p.old_price - p.price) / p.old_price) * 100);
          } else {
            discountEl.value = "";
          }
        } else {
          newPriceEl.value = "";
          oldPriceEl.value = "";
          discountEl.value = "";
          stockEl.value = "";
        }
        updatePreview();
      });

      document.getElementById("addon_reload_btn").addEventListener("click", loadAddonProducts);

      document.getElementById("addon_save_btn").addEventListener("click", async function() {
        var pId = selectEl.value;
        var newPrice = Number(newPriceEl.value);
        var oldPriceVal = oldPriceEl.value.trim() !== "" ? Number(oldPriceEl.value) : null;
        var newStock = Number(stockEl.value);

        if (!pId) return alert("আগে একটি পণ্য নির্বাচন করুন!");
        if (isNaN(newPrice) || newPrice <= 0) return alert("সঠিক নতুন দাম লিখুন!");
        if (isNaN(newStock) || newStock < 0) return alert("সঠিক স্টক পরিমাণ লিখুন!");

        if (oldPriceVal !== null && oldPriceVal <= newPrice) {
          oldPriceVal = null;
        }

        var btn = document.getElementById("addon_save_btn");
        btn.innerText = "আপডেট হচ্ছে...";
        btn.disabled = true;

        try {
          var headers = {
            "apikey": ADDON_SB_KEY,
            "Authorization": "Bearer " + ADDON_SB_KEY,
            "Content-Type": "application/json"
          };
          var res = await fetch(ADDON_SB_URL + "/rest/v1/rpc/update_product_full", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              p_id: Number(pId),
              new_price: newPrice,
              new_old_price: oldPriceVal,
              new_qty: newStock
            })
          });

          if (res.ok) {
            alert("✅ পণ্যের দাম, ছাড় ও স্টক সফলভাবে আপডেট হয়েছে!");
            await loadAddonProducts();
            var refreshBtns = document.querySelectorAll("button");
            refreshBtns.forEach(function(b) {
              if (b.innerText.includes("তালিকা রিফ্রেশ")) b.click();
            });
            setTimeout(enhanceProductTableRows, 1200);
          } else {
            alert("❌ আপডেট হতে সমস্যা হয়েছে। GRANT EXECUTE SQL কোডটি রান করা আছে কি না দেখুন।");
          }
        } catch (err) {
          alert("নেটওয়ার্ক সমস্যা: " + err.message);
        } finally {
          btn.innerText = "✔ দাম, ছাড় ও স্টক আপডেট করুন";
          btn.disabled = false;
        }
      });

      loadAddonProducts();
      setTimeout(enhanceProductTableRows, 2000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAddon);
  } else {
    initAddon();
  }
})();
