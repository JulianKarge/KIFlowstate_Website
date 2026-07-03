(function () {
  "use strict";

  const KEYS = {
    company: "kif_invoice_demo_company_v1",
    customers: "kif_invoice_demo_customers_v1",
    invoices: "kif_invoice_demo_invoices_v1",
    counter: "kif_invoice_demo_counter_v1"
  };

  const eur = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  });

  const today = new Date().toISOString().slice(0, 10);

  const defaults = {
    company: {
      name: "Musterfirma Digital GmbH",
      address: "Demoallee 12\n50667 K\u00f6ln",
      email: "rechnung@musterfirma.example",
      phone: "+49 221 000000",
      web: "musterfirma.example",
      taxNumber: "123/4567/8901",
      vatId: "DE123456789",
      bank: "Demo Bank",
      iban: "DE00 0000 0000 0000 0000 00",
      bic: "DEMODE00XXX",
      logo: ""
    },
    customer: {
      company: "Beispielkunde GmbH",
      contact: "Mara Beispiel",
      address: "Kundenstra\u00dfe 7\n40213 D\u00fcsseldorf",
      email: "mara.beispiel@example.com",
      salutation: "Sehr geehrte Frau Beispiel"
    },
    invoice: {
      number: "1001",
      date: today,
      serviceDate: today
    },
    positions: [
      {
        title: "Automatisierungs-Workshop",
        description: "Analyse der Rechnungs- und Dokumentenprozesse, inklusive Umsetzungsplan.",
        qty: 1,
        price: 950
      },
      {
        title: "Demo-Setup Dokumentenflow",
        description: "Konfiguration einer schlanken Vorlage mit Live-Vorschau und Export-Workflow.",
        qty: 1,
        price: 680
      }
    ]
  };

  let state = {
    company: load(KEYS.company, defaults.company),
    customer: { ...defaults.customer },
    invoice: { ...defaults.invoice },
    positions: defaults.positions.map((item) => ({ ...item }))
  };

  let customers = load(KEYS.customers, [defaults.customer]);
  let invoices = load(KEYS.invoices, []);
  let lastEmailTrigger = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindFields();
    bindActions();
    bindCapabilityCarousel();
    renderCustomerSelect();
    syncForm();
    renderPositions();
    renderSavedInvoices();
    render();
  }

  function bindFields() {
    document.querySelectorAll("[data-company]").forEach((input) => {
      input.addEventListener("input", () => {
        state.company[input.dataset.company] = input.value;
        save(KEYS.company, state.company);
        render();
      });
    });

    document.querySelectorAll("[data-customer]").forEach((input) => {
      input.addEventListener("input", () => {
        state.customer[input.dataset.customer] = input.value;
        render();
      });
    });

    document.querySelectorAll("[data-invoice]").forEach((input) => {
      input.addEventListener("input", () => {
        state.invoice[input.dataset.invoice] = input.value;
        render();
      });
    });
  }

  function bindActions() {
    on("invoice-customer-select", "change", (event) => {
      const index = Number(event.target.value);
      state.customer = Number.isInteger(index) && customers[index]
        ? { ...customers[index] }
        : { company: "", contact: "", address: "", email: "", salutation: "" };
      syncCustomerForm();
      render();
    });

    on("invoice-save-customer", "click", () => {
      const company = state.customer.company.trim();
      if (!company) {
        setStatus("Bitte zuerst einen Firmennamen beim Kunden eintragen.", true);
        return;
      }
      const next = { ...state.customer };
      const existingIndex = customers.findIndex(
        (item) => item.company.trim().toLowerCase() === company.toLowerCase()
      );
      if (existingIndex >= 0) customers[existingIndex] = next;
      else customers.push(next);
      save(KEYS.customers, customers);
      renderCustomerSelect(company);
      setStatus("Kunde wurde lokal in dieser Browser-Demo gespeichert.");
    });

    on("invoice-next-number", "click", () => {
      const next = getSuggestedNextNumber();
      state.invoice.number = String(next);
      setCounter(next + 1);
      syncInvoiceForm();
      render();
      setStatus("Lokale Rechnungsnummer vergeben. Der Demo-Z\u00e4hler wurde erh\u00f6ht.");
    });

    on("invoice-add-position", "click", () => {
      state.positions.push({ title: "", description: "", qty: 1, price: 0 });
      renderPositions();
      render();
      focusPosition(state.positions.length - 1);
    });

    on("invoice-save-demo", "click", saveInvoice);
    on("invoice-print", "click", () => window.print());
    on("invoice-email", "click", (event) => {
      lastEmailTrigger = event.currentTarget;
      openEmailModal();
    });
    on("invoice-email-close", "click", closeEmailModal);

    const modal = document.getElementById("invoice-email-modal");
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeEmailModal();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeEmailModal();
    });

    const logoInput = document.getElementById("invoice-logo-input");
    if (logoInput) {
      logoInput.addEventListener("change", handleLogoUpload);
    }
    on("invoice-logo-remove", "click", () => {
      state.company.logo = "";
      save(KEYS.company, state.company);
      if (logoInput) logoInput.value = "";
      render();
    });
  }

  function bindCapabilityCarousel() {
    const rail = document.getElementById("invoice-capability-rail");
    const wrap = document.querySelector("[data-invoice-carousel]");
    if (!rail || !wrap || rail.dataset.carouselBound) return;

    rail.dataset.carouselBound = "1";

    const cards = Array.from(rail.querySelectorAll(".invoice-capability-card"));
    const dots = Array.from(document.querySelectorAll("[data-invoice-capability-dot]"));
    const prev = document.querySelector("[data-invoice-capability-prev]");
    const next = document.querySelector("[data-invoice-capability-next]");
    const EDGE = 12;
    let activeIndex = 0;
    let ticking = false;

    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      wrap.classList.toggle("can-scroll-left", x > EDGE);
      wrap.classList.toggle("can-scroll-right", x < max - EDGE);
      if (prev) prev.disabled = x <= EDGE;
      if (next) next.disabled = x >= max - EDGE;

      const center = x + rail.clientWidth / 2;
      activeIndex = cards.reduce((closest, card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const currentCenter = cards[closest].offsetLeft + cards[closest].offsetWidth / 2;
        return Math.abs(cardCenter - center) < Math.abs(currentCenter - center)
          ? index
          : closest;
      }, 0);

      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    };

    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    };

    const scrollToIndex = (index) => {
      const target = cards[Math.max(0, Math.min(cards.length - 1, index))];
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    };

    if (prev) {
      prev.addEventListener("click", () => scrollToIndex(activeIndex - 1));
    }
    if (next) {
      next.addEventListener("click", () => scrollToIndex(activeIndex + 1));
    }
    dots.forEach((dot) => {
      dot.addEventListener("click", () => scrollToIndex(Number(dot.dataset.invoiceCapabilityDot)));
    });

    rail.addEventListener("scroll", scheduleUpdate, { passive: true });
    rail.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
    });

    rail.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && event.deltaY !== 0) {
          rail.scrollLeft += event.deltaY;
          event.preventDefault();
        }
      },
      { passive: false }
    );

    let down = false;
    let dragging = false;
    let moved = false;
    let pointerId = null;
    let startX = 0;
    let startLeft = 0;

    rail.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      down = true;
      dragging = false;
      moved = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startLeft = rail.scrollLeft;
    });

    rail.addEventListener("pointermove", (event) => {
      if (!down) return;
      const dx = event.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) <= 6) return;
        dragging = true;
        moved = true;
        rail.classList.add("is-dragging");
        try {
          rail.setPointerCapture(pointerId);
        } catch (err) {}
      }
      rail.scrollLeft = startLeft - dx;
    });

    const release = () => {
      down = false;
      dragging = false;
      if (pointerId != null) {
        try {
          rail.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      pointerId = null;
      rail.classList.remove("is-dragging");
    };

    rail.addEventListener("pointerup", release);
    rail.addEventListener("pointercancel", release);
    rail.addEventListener(
      "click",
      (event) => {
        if (!moved) return;
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      },
      true
    );

    window.addEventListener("resize", scheduleUpdate);
    requestAnimationFrame(update);
    setTimeout(update, 300);
  }

  function render() {
    const totals = computeTotals();
    const companyLines = splitLines(state.company.address);
    const customerLines = splitLines(state.customer.address);
    const number = state.invoice.number || String(getCounter());

    text("invoice-preview-company-name", state.company.name || "Ihre Firma");
    text("invoice-preview-sender", [state.company.name, companyLines[0]].filter(Boolean).join(" | "));
    text("invoice-preview-title", `Rechnung ${number}`);
    text("invoice-preview-salutation", state.customer.salutation || "Guten Tag");
    text("invoice-preview-total", eur.format(totals.gross));
    text("invoice-total-net", eur.format(totals.net));
    text("invoice-total-vat", eur.format(totals.vat));
    text("invoice-total-gross", eur.format(totals.gross));
    text("invoice-next-hint", `N\u00e4chste freie Demo-Nummer: ${getSuggestedNextNumber()}`);

    const logo = document.getElementById("invoice-preview-logo");
    if (logo) {
      if (state.company.logo) {
        logo.src = state.company.logo;
        logo.hidden = false;
      } else {
        logo.removeAttribute("src");
        logo.hidden = true;
      }
    }

    renderAddress("invoice-preview-customer", [
      state.customer.company,
      state.customer.contact,
      ...customerLines,
      state.customer.email
    ]);

    renderDefinitionList("invoice-preview-meta", [
      ["Rechnungsnr.", number],
      ["Datum", formatDate(state.invoice.date)],
      ["Leistung", formatDate(state.invoice.serviceDate)]
    ]);

    renderDefinitionList("invoice-preview-payment", [
      ["Kontoinhaber", state.company.name],
      ["IBAN", state.company.iban],
      ["BIC", state.company.bic],
      ["Bank", state.company.bank],
      ["Verwendungszweck", `Rechnung ${number}`]
    ]);

    renderFooter(companyLines);
    renderPreviewItems();
  }

  function renderPositions() {
    const list = document.getElementById("invoice-position-list");
    if (!list) return;
    list.innerHTML = "";

    state.positions.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "invoice-demo-position";
      row.innerHTML = `
        <div class="invoice-demo-position-head">
          <strong>Position ${index + 1}</strong>
          <button type="button" class="invoice-demo-icon-btn" aria-label="Position entfernen" data-remove-position="${index}">
            <i class="fas fa-trash" aria-hidden="true"></i>
          </button>
        </div>
        <label>
          <span>Titel</span>
          <input type="text" data-position="${index}" data-field="title">
        </label>
        <label>
          <span>Beschreibung</span>
          <textarea rows="2" data-position="${index}" data-field="description"></textarea>
        </label>
        <div class="invoice-demo-grid two">
          <label>
            <span>Menge</span>
            <input type="number" min="0" step="0.25" data-position="${index}" data-field="qty">
          </label>
          <label>
            <span>Einzelpreis netto</span>
            <input type="number" min="0" step="0.01" data-position="${index}" data-field="price">
          </label>
        </div>
      `;

      row.querySelectorAll("[data-position]").forEach((input) => {
        const field = input.dataset.field;
        input.value = item[field] ?? "";
        input.addEventListener("input", () => {
          const target = state.positions[Number(input.dataset.position)];
          target[field] = field === "qty" || field === "price"
            ? parseAmount(input.value)
            : input.value;
          render();
        });
      });

      const removeButton = row.querySelector("[data-remove-position]");
      removeButton.addEventListener("click", () => {
        if (state.positions.length === 1) {
          state.positions[0] = { title: "", description: "", qty: 1, price: 0 };
        } else {
          state.positions.splice(index, 1);
        }
        renderPositions();
        render();
      });

      list.appendChild(row);
    });
  }

  function renderPreviewItems() {
    const body = document.getElementById("invoice-preview-items");
    if (!body) return;
    body.innerHTML = "";

    state.positions.forEach((item, index) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const row = document.createElement("tr");
      appendCell(row, String(index + 1));
      const desc = document.createElement("td");
      const title = document.createElement("strong");
      title.textContent = item.title || "Leistung";
      const sub = document.createElement("span");
      sub.textContent = item.description || "";
      desc.append(title, sub);
      row.appendChild(desc);
      appendCell(row, formatQty(qty), "num");
      appendCell(row, eur.format(price), "num");
      appendCell(row, eur.format(qty * price), "num");
      body.appendChild(row);
    });
  }

  function saveInvoice() {
    if (!state.invoice.number) {
      const next = getCounter();
      state.invoice.number = String(next);
      setCounter(next + 1);
      syncInvoiceForm();
    } else {
      syncCounterAfterNumber(state.invoice.number);
    }

    const totals = computeTotals();
    const snapshot = JSON.parse(JSON.stringify(state));
    const existing = invoices.findIndex((item) => item.number === state.invoice.number);
    const record = {
      id: existing >= 0 ? invoices[existing].id : `demo-${Date.now()}`,
      number: state.invoice.number,
      date: state.invoice.date,
      customer: state.customer.company || "Ohne Kunde",
      gross: totals.gross,
      state: snapshot
    };

    if (existing >= 0) invoices[existing] = record;
    else invoices.unshift(record);
    invoices = invoices.slice(0, 8);
    save(KEYS.invoices, invoices);
    renderSavedInvoices();
    setStatus("Demo-Rechnung wurde lokal gespeichert.");
  }

  function renderSavedInvoices() {
    const list = document.getElementById("invoice-saved-list");
    if (!list) return;
    list.innerHTML = "";

    if (!invoices.length) {
      const empty = document.createElement("p");
      empty.className = "invoice-demo-empty";
      empty.textContent = "Noch keine lokal gespeicherten Demo-Belege.";
      list.appendChild(empty);
      return;
    }

    invoices.forEach((invoice) => {
      const item = document.createElement("article");
      item.className = "invoice-demo-saved-item";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `Rechnung ${invoice.number}`;
      const meta = document.createElement("span");
      meta.textContent = `${invoice.customer} | ${formatDate(invoice.date)} | ${eur.format(invoice.gross)}`;
      copy.append(title, meta);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "invoice-demo-ghost-btn";
      button.textContent = "Laden";
      button.addEventListener("click", () => {
        state = JSON.parse(JSON.stringify(invoice.state));
        syncForm();
        renderPositions();
        render();
        setStatus("Lokaler Demo-Beleg geladen.");
      });
      item.append(copy, button);
      list.appendChild(item);
    });
  }

  function openEmailModal() {
    const modal = document.getElementById("invoice-email-modal");
    const to = state.customer.email || "";
    const subject = `Rechnung ${state.invoice.number || getCounter()}`;
    const body = [
      `${state.customer.salutation || "Guten Tag"},`,
      "",
      `hier ist der Entwurf f\u00fcr Rechnung ${state.invoice.number || getCounter()}.`,
      `Gesamtbetrag: ${eur.format(computeTotals().gross)}`,
      "Bitte h\u00e4ngen Sie die gedruckte PDF-Datei manuell an.",
      "",
      "Mit freundlichen Gr\u00fc\u00dfen",
      state.company.name || ""
    ].join("\n");

    value("invoice-email-to", to);
    value("invoice-email-subject", subject);
    value("invoice-email-body", body);
    const link = document.getElementById("invoice-email-link");
    if (link) {
      link.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    if (modal) {
      modal.hidden = false;
      document.body.classList.add("invoice-demo-modal-open");
      const closeButton = document.getElementById("invoice-email-close");
      if (closeButton) closeButton.focus();
    }
  }

  function closeEmailModal() {
    const modal = document.getElementById("invoice-email-modal");
    if (modal && !modal.hidden) {
      modal.hidden = true;
      document.body.classList.remove("invoice-demo-modal-open");
      if (lastEmailTrigger && typeof lastEmailTrigger.focus === "function") {
        lastEmailTrigger.focus();
      }
    }
  }

  function handleLogoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 350000) {
      setStatus("Logo bitte unter 350 KB halten, damit localStorage klein bleibt.", true);
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.company.logo = String(reader.result || "");
      save(KEYS.company, state.company);
      render();
    });
    reader.readAsDataURL(file);
  }

  function renderCustomerSelect(selectedCompany) {
    const select = document.getElementById("invoice-customer-select");
    if (!select) return;
    select.innerHTML = "";
    const fresh = document.createElement("option");
    fresh.value = "";
    fresh.textContent = "Neuer Demo-Kunde";
    select.appendChild(fresh);
    customers.forEach((customer, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = customer.company || `Kunde ${index + 1}`;
      if ((selectedCompany || state.customer.company) === customer.company) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  function focusPosition(index) {
    const input = document.querySelector(`[data-position="${index}"][data-field="title"]`);
    if (!input) return;
    input.focus();
    input.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function syncForm() {
    syncCompanyForm();
    syncCustomerForm();
    syncInvoiceForm();
  }

  function syncCompanyForm() {
    document.querySelectorAll("[data-company]").forEach((input) => {
      input.value = state.company[input.dataset.company] || "";
    });
  }

  function syncCustomerForm() {
    document.querySelectorAll("[data-customer]").forEach((input) => {
      input.value = state.customer[input.dataset.customer] || "";
    });
  }

  function syncInvoiceForm() {
    document.querySelectorAll("[data-invoice]").forEach((input) => {
      input.value = state.invoice[input.dataset.invoice] || "";
    });
  }

  function renderFooter(addressLines) {
    const footer = document.getElementById("invoice-preview-footer");
    if (!footer) return;
    footer.innerHTML = "";
    [
      ["Firma", [state.company.name, ...addressLines, state.company.email, state.company.web]],
      ["Bank", [state.company.bank, `IBAN ${state.company.iban}`, `BIC ${state.company.bic}`]],
      ["Steuer", [`Steuernummer ${state.company.taxNumber}`, `USt-IdNr. ${state.company.vatId}`]]
    ].forEach(([heading, lines]) => {
      const block = document.createElement("div");
      const h = document.createElement("h3");
      h.textContent = heading;
      block.appendChild(h);
      lines.filter(Boolean).forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        block.appendChild(p);
      });
      footer.appendChild(block);
    });
  }

  function renderAddress(id, lines) {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = "";
    lines.filter(Boolean).forEach((line) => {
      const div = document.createElement("div");
      div.textContent = line;
      element.appendChild(div);
    });
  }

  function renderDefinitionList(id, pairs) {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = "";
    pairs.forEach(([label, val]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = val || "-";
      list.append(dt, dd);
    });
  }

  function computeTotals() {
    const net = state.positions.reduce((sum, item) => {
      return sum + (Number(item.qty) || 0) * (Number(item.price) || 0);
    }, 0);
    const vat = net * 0.19;
    return { net, vat, gross: net + vat };
  }

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
    } catch (err) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      setStatus("Browser-Speicher ist voll oder blockiert.", true);
    }
  }

  function getCounter() {
    const stored = Number(localStorage.getItem(KEYS.counter));
    return Number.isInteger(stored) && stored > 0 ? stored : 1001;
  }

  function setCounter(next) {
    localStorage.setItem(KEYS.counter, String(next));
  }

  function parseInvoiceNumber(valueToParse) {
    const match = String(valueToParse || "").trim().match(/\d+/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  function getSuggestedNextNumber() {
    const typed = parseInvoiceNumber(state.invoice.number);
    const stored = getCounter();
    return typed ? Math.max(stored, typed + 1) : stored;
  }

  function syncCounterAfterNumber(valueToSync) {
    const typed = parseInvoiceNumber(valueToSync);
    if (!typed) return;
    const next = typed + 1;
    if (next > getCounter()) setCounter(next);
  }

  function setStatus(message, isError) {
    const status = document.getElementById("invoice-demo-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function splitLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("de-DE");
  }

  function formatQty(value) {
    return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value || 0);
  }

  function parseAmount(value) {
    const normalized = String(value || "0").replace(",", ".");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function appendCell(row, valueToSet, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = valueToSet;
    row.appendChild(cell);
  }

  function text(id, valueToSet) {
    const element = document.getElementById(id);
    if (element) element.textContent = valueToSet || "";
  }

  function value(id, valueToSet) {
    const element = document.getElementById(id);
    if (element) element.value = valueToSet || "";
  }

  function on(id, eventName, handler) {
    const element = document.getElementById(id);
    if (element) element.addEventListener(eventName, handler);
  }
})();
