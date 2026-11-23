(function() {
  var U = "https://" + "kuecacvhadqzywvkmauo" + ".supabase.co";
  var K = "sb_publishable_ijrPXf2ssOl-5usaMmSNgw_VNpkJkpI";
  var P = [];
  var curTab = "pending";

  async function L() {
    var s = document.getElementById("addon_edit_select");
    try {
      var r = await fetch(U + "/rest/v1/products?select=id,title,price,old_price,stock&order=title.asc", {
        headers: { "apikey": K, "Authorization": "Bearer " + K }
      });
      P = await r.json();
      if (s) {
        s.innerHTML = "<option value=''>-- পণ্য বাছাই করুন --</option>";
        P.forEach(function(p) {
          var st = (p.stock !== null && p.stock !== undefined) ? p.stock : "N/A";
          var ot = (p.old_price && p.old_price > p.price) ? " | আগের: ৳" + p.old_price : "";
          s.innerHTML += "<option value='" + p.id + "'>" + p.title + " (৳" + p.price + ot + " | স্টক: " + st + ")</option>";
        });
      }
    } catch (e) {
      if (s) s.innerHTML = "<option value=''>লোড হয়নি, রিফ্রেশ করুন</option>";
    }
  }

  function getDoneList() {
    return JSON.parse(localStorage.getItem("addon_completed_orders") || "[]");
  }

  function saveDoneList(arr) {
    localStorage.setItem("addon_completed_orders", JSON.stringify(arr));
  }

  function filterOrderRows() {
    var tbl = document.getElementById("orders-table");
    if (!tbl) return;
    var done = getDoneList(), pCnt = 0, cCnt = 0;

    tbl.querySelectorAll("tbody tr").forEach(function(tr) {
      var key = tr.innerText.replace(/✓ সম্পন্ন|প্রিন্ট|✅ সম্পন্ন/g, "").trim().substring(0, 80);
      var isDone = done.includes(key) || tr.dataset.isCompleted === "true";

      if (isDone) {
        cCnt++;
        tr.style.display = (curTab === "completed") ? "" : "none";
        var act = tr.lastElementChild;
        if (act && !act.querySelector(".addon-done-tag")) {
          act.querySelectorAll("button").forEach(function(b) {
            if (b.innerText.includes("সম্পন্ন")) b.style.display = "none";
          });
          var sp = document.createElement("span");
          sp.className = "addon-done-tag";
          sp.innerText = "✅ সম্পন্ন";
          sp.style.cssText = "display:inline-block;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;margin-top:4px;";
          act.appendChild(sp);
        }
      } else {
        pCnt++;
        tr.style.display = (curTab === "pending") ? "" : "none";
        tr.querySelectorAll("button").forEach(function(b) {
          if (b.innerText.includes("সম্পন্ন") && !b.dataset.bound) {
            b.dataset.bound = "1";
            b.addEventListener("click", function() {
              var d = getDoneList();
              if (!d.includes(key)) d.push(key);
              saveDoneList(d);
              tr.dataset.isCompleted = "true";
              filterOrderRows();
            });
          }
        });
      }
    });

    var b1 = document.getElementById("tab_pending_btn");
    var b2 = document.getElementById("tab_completed_btn");
    if (b1) b1.innerText = "⏳ চলমান অর্ডার (" + pCnt + ")";
    if (b2) b2.innerText = "✅ সম্পন্ন অর্ডার (" + cCnt + ")";
  }

  function setupOrderTabs() {
    var tbl = document.getElementById("orders-table");
    if (!tbl || document.getElementById("addon_order_tabs")) return;

    var bar = document.createElement("div");
    bar.id = "addon_order_tabs";
    bar.style.cssText = "display:flex;gap:10px;margin-top:12px;margin-bottom:5px;";
    bar.innerHTML =
      "<button type='button' id='tab_pending_btn' style='padding:7px 14px;border:none;border-radius:5px;font-weight:bold;cursor:pointer;background:#28a745;color:#fff;font-size:13px;'>⏳ চলমান অর্ডার (0)</button>" +
      "<button type='button' id='tab_completed_btn' style='padding:7px 14px;border:1px solid #ccc;border-radius:5px;font-weight:bold;cursor:pointer;background:#f1f3f5;color:#333;font-size:13px;'>✅ সম্পন্ন অর্ডার (0)</button>";
    tbl.parentElement.insertAdjacentElement("beforebegin", bar);

    var b1 = document.getElementById("tab_pending_btn");
    var b2 = document.getElementById("tab_completed_btn");

    b1.onclick = function() {
      curTab = "pending";
      b1.style.background = "#28a745"; b1.style.color = "#fff"; b1.style.border = "none";
      b2.style.background = "#f1f3f5"; b2.style.color = "#333"; b2.style.border = "1px solid #ccc";
      filterOrderRows();
    };

    b2.onclick = function() {
      curTab = "completed";
      b2.style.background = "#17a2b8"; b2.style.color = "#fff"; b2.style.border = "none";
      b1.style.background = "#f1f3f5"; b1.style.color = "#333"; b1.style.border = "1px solid #ccc";
      filterOrderRows();
    };

    var tb = tbl.querySelector("tbody");
    if (tb) {
      new MutationObserver(function() {
        setTimeout(filterOrderRows, 200);
      }).observe(tb, { childList: true });
    }
    setTimeout(filterOrderRows, 1000);
    setTimeout(filterOrderRows, 2500);
  }

  function I() {
    setupOrderTabs();
    var pi = document.getElementById("price");
    var fm = document.getElementById("productForm");

    if (pi && fm && !document.getElementById("addon_stock")) {
      var lb = document.createElement("label");
      lb.innerText = "স্টক পরিমাণ (কেজি বা পিস)";
      var si = document.createElement("input");
      si.type = "number"; si.step = "any"; si.id = "addon_stock";
      si.placeholder = "যেমন: 50 (খালি রাখলে আনলিমিটেড)";
      si.style.padding = "10px";
      pi.insertAdjacentElement("afterend", si);
      pi.insertAdjacentElement("afterend", lb);

      fm.addEventListener("submit", function() {
        var tv = document.getElementById("title") ? document.getElementById("title").value.trim() : "";
        var sv = document.getElementById("addon_stock") ? document.getElementById("addon_stock").value.trim() : "";
        if (tv && sv !== "") {
          setTimeout(async function() {
            try {
              var hd = { "apikey": K, "Authorization": "Bearer " + K, "Content-Type": "application/json" };
              var r = await fetch(U + "/rest/v1/products?title=eq." + encodeURIComponent(tv) + "&order=id.desc&limit=1", { headers: hd });
              var d = await r.json();
              if (d && d.length > 0) {
                await fetch(U + "/rest/v1/rpc/set_product_stock", {
                  method: "POST",
                  headers: hd,
                  body: JSON.stringify({ p_id: Number(d.at(0).id), new_qty: Number(sv) })
                });
                document.getElementById("addon_stock").value = "";
                L();
              }
            } catch (e) {}
          }, 2500);
        }
      });
    }

    var h2s = document.querySelectorAll("h2");
    for (var i = 0; i < h2s.length; i++) {
      if (h2s.item(i) && h2s.item(i).innerText.includes("সকল পণ্যের তালিকা")) {
        var oldBox = h2s.item(i).closest("div[style*='background-color: #fff'],div[style*='background-color:#fff'],div[style*='border: 1px solid #ddd']");
        if (oldBox) oldBox.style.display = "none";
      }
    }

    var leftCard = fm ? fm.closest("div") : null;
    if (leftCard && !document.getElementById("addon_quick_card")) {
      var qc = document.createElement("div");
      qc.id = "addon_quick_card";
      qc.style.cssText = "background-color:#fff;padding:20px;border-radius:8px;border:2px solid #ff9800;box-shadow:0 2px 8px rgba(0,0,0,0.06);";
      qc.innerHTML =
        "<div style='display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #ff9800;padding-bottom:10px;margin-bottom:12px;'>" +
          "<h2 style='margin:0;color:#333;font-size:19px;'>⚡ দ্রুত দাম, ছাড় (%) ও স্টক আপডেট</h2>" +
          "<button type='button' id='addon_reload_btn' style='background:#eee;border:1px solid #ccc;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;'>🔄 রিফ্রেশ</button>" +
        "</div>" +
        "<label>১. পণ্য নির্বাচন করুন</label>" +
        "<select id='addon_edit_select' style='width:100%;padding:10px;margin-bottom:12px;border:1px solid #ccc;border-radius:5px;font-size:14px;font-weight:bold;'><option value=''>লোড হচ্ছে...</option></select>" +
        "<div style='display:flex;gap:10px;flex-wrap:wrap;'>" +
          "<div style='flex:1;min-width:100px;'><label>আগের দাম (কাটা ৳)</label><input type='number' step='any' id='addon_edit_old_price' placeholder='যেমন: 100' style='width:100%;padding:10px;'></div>" +
          "<div style='flex:1;min-width:100px;'><label>ছাড় দিন (%)</label><input type='number' step='any' id='addon_edit_discount' placeholder='যেমন: 10' style='width:100%;padding:10px;background:#fff8e1;'></div>" +
          "<div style='flex:1;min-width:100px;'><label>নতুন দাম (৳) *</label><input type='number' step='any' id='addon_edit_price' placeholder='নতুন দাম' style='width:100%;padding:10px;font-weight:bold;color:#28a745;'></div>" +
          "<div style='flex:1;min-width:100px;'><label>নতুন স্টক</label><input type='number' step='any' id='addon_edit_stock' placeholder='স্টক' style='width:100%;padding:10px;'></div>" +
        "</div>" +
        "<div id='addon_preview_line' style='font-size:13px;color:#d32f2f;font-weight:bold;margin-bottom:10px;min-height:18px;'></div>" +
        "<button type='button' id='addon_save_btn' style='width:100%;background:#ff9800;color:#fff;border:none;padding:12px;border-radius:5px;font-size:15px;font-weight:bold;cursor:pointer;'>✔ দাম, ছাড় ও স্টক আপডেট করুন</button>";
      leftCard.insertAdjacentElement("afterend", qc);

      var se = document.getElementById("addon_edit_select"), oe = document.getElementById("addon_edit_old_price"),
          de = document.getElementById("addon_edit_discount"), ne = document.getElementById("addon_edit_price"),
          ste = document.getElementById("addon_edit_stock"), pe = document.getElementById("addon_preview_line");

      function UP() {
        var op = Number(oe.value) || 0, np = Number(ne.value) || 0;
        if (op > np && np > 0) {
          var pct = Math.round(((op - np) / op) * 100);
          pe.innerHTML = "প্রিভিউ: <span style='text-decoration:line-through;color:#888;'>৳" + op + "</span> → <span style='color:#28a745;font-size:15px;'>৳" + np + "</span> <span style='background:#ffebee;color:#d32f2f;padding:2px 6px;border-radius:4px;'>-" + pct + "% ছাড়</span>";
        } else if (np > 0) {
          pe.innerHTML = "প্রিভিউ: বর্তমান বিক্রয় মূল্য <span style='color:#28a745;font-size:15px;'>৳" + np + "</span> (কোনো ছাড় নেই)";
        } else {
          pe.innerHTML = "";
        }
      }

      de.addEventListener("input", function() {
        var d = Number(de.value), bp = Number(oe.value) || Number(ne.value);
        if (!oe.value && ne.value) { oe.value = ne.value; bp = Number(oe.value); }
        if (bp > 0 && d >= 0 && d <= 100) { ne.value = Math.round(bp - (bp * d / 100)); }
        UP();
      });
      oe.addEventListener("input", UP);
      ne.addEventListener("input", function() {
        var op = Number(oe.value) || 0, np = Number(ne.value) || 0;
        if (op > np && np > 0) de.value = Math.round(((op - np) / op) * 100);
        else de.value = "";
        UP();
      });
      se.addEventListener("change", function() {
        var p = P.find(function(i) { return i.id == se.value; });
        if (p) {
          ne.value = (p.price !== null && p.price !== undefined) ? p.price : "";
          oe.value = (p.old_price && p.old_price > p.price) ? p.old_price : "";
          ste.value = (p.stock !== null && p.stock !== undefined) ? p.stock : "";
          de.value = (p.old_price && p.old_price > p.price) ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : "";
        } else {
          ne.value = ""; oe.value = ""; de.value = ""; ste.value = "";
        }
        UP();
      });

      document.getElementById("addon_reload_btn").addEventListener("click", L);
      document.getElementById("addon_save_btn").addEventListener("click", async function() {
        var pid = se.value, np = Number(ne.value), opv = oe.value.trim() !== "" ? Number(oe.value) : null, ns = Number(ste.value);
        if (!pid) return alert("আগে একটি পণ্য নির্বাচন করুন!");
        if (isNaN(np) || np <= 0) return alert("সঠিক নতুন দাম লিখুন!");
        if (isNaN(ns) || ns < 0) return alert("সঠিক স্টক পরিমাণ লিখুন!");
        if (opv !== null && opv <= np) opv = null;

        var btn = document.getElementById("addon_save_btn");
        btn.innerText = "আপডেট হচ্ছে..."; btn.disabled = true;
        try {
          var r = await fetch(U + "/rest/v1/rpc/update_product_full", {
            method: "POST",
            headers: { "apikey": K, "Authorization": "Bearer " + K, "Content-Type": "application/json" },
            body: JSON.stringify({ p_id: Number(pid), new_price: np, new_old_price: opv, new_qty: ns })
          });
          if (r.ok) {
            alert("✅ পণ্যের দাম, ছাড় ও স্টক সফলভাবে আপডেট হয়েছে!");
            await L();
          } else {
            alert("❌ আপডেট হতে সমস্যা হয়েছে।");
          }
        } catch (err) {
          alert("নেটওয়ার্ক সমস্যা: " + err.message);
        } finally {
          btn.innerText = "✔ দাম, ছাড় ও স্টক আপডেট করুন"; btn.disabled = false;
        }
      });
      L();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", I);
  else I();
})();
