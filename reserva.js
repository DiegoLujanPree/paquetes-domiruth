document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     MENÚ HAMBURGUESA MÓVIL (igual que en index.html)
     ========================================================= */
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('is-open');
    });
  }

  /* =========================================================
     DATOS DEL PAQUETE (llegan por la URL desde "Reservar ahora")
     ========================================================= */
  const params = new URLSearchParams(window.location.search);

  const pkg = {
    title: params.get('title') || 'EUROPA MAGICA DESDE LONDRES FLY | 19 Días + 18 noches',
    dates: params.get('dates') || '06 nov al 24 nov 2026',
    priceUsd: parseFloat(params.get('priceUsd')) || 4588,
    exchangeRate: parseFloat(params.get('rate')) || 3.40,
    qty: Math.max(1, parseInt(params.get('qty'), 10) || 1),
    img: params.get('img') || ''
  };

  const summaryTitleEl = document.getElementById('summaryTitle');
  const summaryDatesEl = document.getElementById('summaryDates');
  const breadcrumbTitleEl = document.getElementById('breadcrumbTitle');
  const summaryImgEl = document.getElementById('summaryImg');

  if (summaryTitleEl) summaryTitleEl.textContent = pkg.title;
  if (summaryDatesEl) summaryDatesEl.textContent = pkg.dates;
  if (breadcrumbTitleEl) breadcrumbTitleEl.textContent = 'Reserva — ' + pkg.title;
  if (pkg.img && summaryImgEl) {
    summaryImgEl.innerHTML = `<img src="${pkg.img}" alt="${pkg.title}" onerror="this.parentElement.textContent='FOTO'">`;
  }

  /* =========================================================
     RESUMEN — Acordeón "Detalles del paquete" (sólo tiene efecto
     visual en móvil; en escritorio el CSS ignora esta clase y el
     resumen se muestra siempre completo)
     ========================================================= */
  const summaryCardEl = document.getElementById('summaryCard');
  const packageDetailsToggle = document.getElementById('packageDetailsToggle');

  if (summaryCardEl && packageDetailsToggle) {
    packageDetailsToggle.addEventListener('click', () => {
      const isOpen = summaryCardEl.classList.toggle('is-open');
      packageDetailsToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* =========================================================
     RESUMEN DE PRECIOS (columna derecha)
     Declarado aquí arriba porque el paso 1 (pre-creación de
     pasajeros según "qty") ya necesita poder llamarlo.
     ========================================================= */
  const summaryPaxEl = document.getElementById('summaryPax');
  const summarySubtotalEl = document.getElementById('summarySubtotal');
  const summaryLuggageRowEl = document.getElementById('summaryLuggageRow');
  const summaryLuggageEl = document.getElementById('summaryLuggage');
  const summaryTotalEl = document.getElementById('summaryTotal');
  const summaryTotalPENEl = document.getElementById('summaryTotalPEN');

  const formatMoney = (value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let passengerCount = pkg.qty;
  let selectedLuggagePrice = 0;

  function updatePassengerCount(count) {
    passengerCount = count;
    updateSummary();
  }

  function updateSummary() {
    const subtotal = pkg.priceUsd * passengerCount;
    const luggageTotal = selectedLuggagePrice * passengerCount;
    const total = subtotal + luggageTotal;
    const totalPEN = total * pkg.exchangeRate;

    if (summaryPaxEl) summaryPaxEl.textContent = passengerCount;
    if (summarySubtotalEl) summarySubtotalEl.textContent = `$ ${formatMoney(subtotal)}`;

    if (luggageTotal > 0) {
      summaryLuggageRowEl.hidden = false;
      summaryLuggageEl.textContent = `$ ${formatMoney(luggageTotal)}`;
    } else {
      summaryLuggageRowEl.hidden = true;
    }

    if (summaryTotalEl) summaryTotalEl.textContent = `$ ${formatMoney(total)}`;
    if (summaryTotalPENEl) summaryTotalPENEl.textContent = formatMoney(totalPEN);
  }

  /* =========================================================
     STEPPER — Navegación entre las 4 zonas
     ========================================================= */
  const steps = [1, 2, 3, 4];
  let currentStep = 1;
  let maxReached = 1;

  const stepperItems = document.querySelectorAll('.stepper-item');
  const stepPanels = document.querySelectorAll('.reserva-step');

  const goToStep = (step) => {
    step = parseInt(step, 10);
    if (!steps.includes(step)) return;

    currentStep = step;
    maxReached = Math.max(maxReached, step);

    stepPanels.forEach(panel => {
      panel.classList.toggle('is-active', parseInt(panel.dataset.stepPanel, 10) === step);
    });

    stepperItems.forEach(item => {
      const itemStep = parseInt(item.dataset.step, 10);
      item.classList.toggle('is-active', itemStep === step);
      item.classList.toggle('is-done', itemStep < step);
    });

    window.scrollTo({ top: document.querySelector('.reserva-stepper').offsetTop - 90, behavior: 'smooth' });
  };

  document.querySelectorAll('[data-go-next]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(btn.dataset.goNext));
  });

  stepperItems.forEach(item => {
    item.addEventListener('click', () => {
      const itemStep = parseInt(item.dataset.step, 10);
      // Solo permite saltar a pasos ya alcanzados, para no romper el flujo.
      if (itemStep <= maxReached) goToStep(itemStep);
    });
  });

  /* =========================================================
     PASO 1 — DATOS DE PASAJEROS (acordeón + añadir pasajero)
     ========================================================= */
  const passengerList = document.getElementById('passengerList');
  const addPassengerBtn = document.getElementById('addPassengerBtn');

  const renumberPassengers = () => {
    const accordions = passengerList.querySelectorAll('.passenger-accordion');
    accordions.forEach((acc, index) => {
      acc.dataset.passengerIndex = index + 1;
      acc.querySelector('.passenger-accordion__title').firstChild.textContent = `Pasajero Adulto ${index + 1}`;
    });
    updatePassengerCount(accordions.length);
  };

  const bindAccordionToggle = (accordion) => {
    const header = accordion.querySelector('[data-passenger-toggle]');
    header.addEventListener('click', (e) => {
      if (e.target.closest('.passenger-accordion__remove')) return;
      accordion.classList.toggle('is-open');
    });
  };

  const bindDatepickers = (scope) => {
    scope.querySelectorAll('[data-datepicker]').forEach(wrap => {
      if (wrap.dataset.dpBound) return;
      wrap.dataset.dpBound = 'true';
      attachMiniCalendar(wrap);
    });
  };

  // Enlazar el primer pasajero ya presente en el HTML
  passengerList.querySelectorAll('.passenger-accordion').forEach(bindAccordionToggle);
  bindDatepickers(passengerList);

  let passengerCounter = 1;

  const addPassenger = (opts = {}) => {
    passengerCounter++;
    const template = passengerList.querySelector('.passenger-accordion');
    const clone = template.cloneNode(true);

    clone.classList.toggle('is-open', !!opts.openOnAdd);
    clone.dataset.passengerIndex = passengerCounter;

    // Limpiar valores de los campos clonados
    clone.querySelectorAll('input').forEach(input => { input.value = ''; });
    clone.querySelectorAll('select').forEach(sel => { sel.selectedIndex = 0; });
    clone.querySelectorAll('[data-dp-bound]').forEach(el => delete el.dataset.dpBound);
    clone.querySelectorAll('[data-datepicker]').forEach(el => delete el.dataset.dpBound);

    // Restaurar valor por defecto de país de residencia
    const paisInput = clone.querySelector('input[name="paisResidencia"]');
    if (paisInput) paisInput.value = 'Perú';

    // Encabezado con botón de eliminar
    const titleEl = clone.querySelector('.passenger-accordion__title');
    titleEl.innerHTML = `Pasajero Adulto ${passengerCounter} <button type="button" class="passenger-accordion__remove" data-remove-passenger>Eliminar</button>`;
    titleEl.firstChild.textContent = `Pasajero Adulto ${passengerCounter} `;

    passengerList.appendChild(clone);
    bindAccordionToggle(clone);
    bindDatepickers(clone);

    clone.querySelector('[data-remove-passenger]').addEventListener('click', (e) => {
      e.stopPropagation();
      clone.remove();
      renumberPassengers();
    });

    updatePassengerCount(passengerList.querySelectorAll('.passenger-accordion').length);
    if (opts.scrollIntoView) clone.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return clone;
  };

  addPassengerBtn.addEventListener('click', () => addPassenger({ openOnAdd: true, scrollIntoView: true }));

  // Pre-crea tantos bloques de pasajero como la cantidad elegida en la página del paquete
  for (let i = 1; i < pkg.qty; i++) {
    addPassenger({ openOnAdd: false, scrollIntoView: false });
  }
  updatePassengerCount(passengerList.querySelectorAll('.passenger-accordion').length);

  /* =========================================================
     MINI-CALENDARIO (Fecha de Nacimiento)
     ========================================================= */
  const MESES = ['ENE.', 'FEB.', 'MAR.', 'ABR.', 'MAY.', 'JUN.', 'JUL.', 'AGO.', 'SEP.', 'OCT.', 'NOV.', 'DIC.'];
  const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  function attachMiniCalendar(wrap) {
    const input = wrap.querySelector('.date-input');
    const iconBtn = wrap.querySelector('.date-input__icon');
    let calendarEl = null;
    let viewYear = 2000;
    let viewMonth = 0;
    let selectedDate = null;
    let showingYearPanel = false;

    const closeCalendar = () => {
      if (calendarEl) {
        calendarEl.remove();
        calendarEl = null;
      }
      document.removeEventListener('click', onOutsideClick);
    };

    const onOutsideClick = (e) => {
      if (calendarEl && !calendarEl.contains(e.target) && !wrap.contains(e.target)) {
        closeCalendar();
      }
    };

    const buildYearPanel = () => {
      const startYear = 1930;
      const endYear = new Date().getFullYear();
      let years = '';
      for (let y = endYear; y >= startYear; y--) {
        years += `<button type="button" data-year="${y}" class="${y === viewYear ? 'is-selected' : ''}">${y}</button>`;
      }
      return `<div class="mini-calendar__year-panel">${years}</div>`;
    };

    const render = () => {
      if (!calendarEl) return;

      if (showingYearPanel) {
        calendarEl.innerHTML = `
          <div class="mini-calendar__head">
            <button type="button" class="mini-calendar__month-btn" data-back-to-days>${viewYear} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"></polyline></svg></button>
          </div>
          ${buildYearPanel()}
        `;
        calendarEl.querySelector('[data-back-to-days]').addEventListener('click', () => {
          showingYearPanel = false;
          render();
        });
        calendarEl.querySelectorAll('[data-year]').forEach(btn => {
          btn.addEventListener('click', () => {
            viewYear = parseInt(btn.dataset.year, 10);
            showingYearPanel = false;
            render();
          });
        });
        return;
      }

      const firstDay = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      let daysHtml = '';
      for (let i = 0; i < firstDay; i++) {
        daysHtml += `<button type="button" disabled></button>`;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const isSelected = selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === d;
        daysHtml += `<button type="button" data-day="${d}" class="${isSelected ? 'is-selected' : ''}">${d}</button>`;
      }

      calendarEl.innerHTML = `
        <div class="mini-calendar__head">
          <button type="button" class="mini-calendar__month-btn" data-open-years>${MESES[viewMonth]} ${viewYear}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="mini-calendar__nav">
            <button type="button" data-prev-month aria-label="Mes anterior">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button type="button" data-next-month aria-label="Mes siguiente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
        <div class="mini-calendar__weekdays">${DIAS_SEMANA.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="mini-calendar__days">${daysHtml}</div>
      `;

      calendarEl.querySelector('[data-open-years]').addEventListener('click', () => {
        showingYearPanel = true;
        render();
      });
      calendarEl.querySelector('[data-prev-month]').addEventListener('click', () => {
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        render();
      });
      calendarEl.querySelector('[data-next-month]').addEventListener('click', () => {
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        render();
      });
      calendarEl.querySelectorAll('[data-day]').forEach(btn => {
        btn.addEventListener('click', () => {
          const d = parseInt(btn.dataset.day, 10);
          selectedDate = new Date(viewYear, viewMonth, d);
          const dd = String(d).padStart(2, '0');
          const mm = String(viewMonth + 1).padStart(2, '0');
          input.value = `${dd}/${mm}/${viewYear}`;
          input.dispatchEvent(new Event('change'));
          closeCalendar();
        });
      });
    };

    const openCalendar = () => {
      if (calendarEl) { closeCalendar(); return; }

      if (selectedDate) {
        viewYear = selectedDate.getFullYear();
        viewMonth = selectedDate.getMonth();
      } else {
        viewYear = 2000;
        viewMonth = 0;
      }
      showingYearPanel = false;

      calendarEl = document.createElement('div');
      calendarEl.className = 'mini-calendar';
      wrap.appendChild(calendarEl);
      render();

      setTimeout(() => document.addEventListener('click', onOutsideClick), 0);
    };

    input.addEventListener('click', openCalendar);
    if (iconBtn) iconBtn.addEventListener('click', openCalendar);
  }

  /* =========================================================
     PASO 2 — EQUIPAJE (selección única por tarjeta, precio total)
     ========================================================= */
  const luggageCards = document.querySelectorAll('.luggage-card');

  luggageCards.forEach(card => {
    card.addEventListener('click', () => {
      const alreadySelected = card.classList.contains('is-selected');
      luggageCards.forEach(c => c.classList.remove('is-selected'));

      if (!alreadySelected) {
        card.classList.add('is-selected');
        selectedLuggagePrice = parseFloat(card.dataset.price) || 0;
      } else {
        selectedLuggagePrice = 0;
      }
      updateSummary();
    });
  });

  /* =========================================================
     PASO 3 — ALOJAMIENTO (tabs España / Francia)
     ========================================================= */
  const hotelTabs = document.querySelectorAll('.hotel-tab');
  const hotelPanels = document.querySelectorAll('[data-hotel-panel]');

  hotelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      hotelTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      hotelPanels.forEach(panel => {
        panel.hidden = panel.dataset.hotelPanel !== tab.dataset.hotelTab;
      });
    });
  });

  /* =========================================================
     PASO 4 — ZONA DE PAGO
     ========================================================= */
  const billingOptions = document.querySelectorAll('.billing-option');
  billingOptions.forEach(option => {
    option.addEventListener('click', () => {
      billingOptions.forEach(o => o.classList.remove('is-active'));
      option.classList.add('is-active');
      option.querySelector('input[type="radio"]').checked = true;
    });
  });

  // Formato automático del número de tarjeta: 0000 0000 0000 0000
  const cardNumberInput = document.querySelector('input[name="numeroTarjeta"]');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', () => {
      let digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);
      cardNumberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // Formato automático de vencimiento: MM/AA
  const vencimientoInput = document.querySelector('input[name="vencimiento"]');
  if (vencimientoInput) {
    vencimientoInput.addEventListener('input', () => {
      let digits = vencimientoInput.value.replace(/\D/g, '').slice(0, 4);
      if (digits.length > 2) digits = digits.slice(0, 2) + '/' + digits.slice(2);
      vencimientoInput.value = digits;
    });
  }

  const cvvInput = document.querySelector('input[name="cvv"]');
  if (cvvInput) {
    cvvInput.addEventListener('input', () => {
      cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  const payBtn = document.getElementById('payBtn');
  const successOverlay = document.getElementById('successModalOverlay');
  const successClose = document.getElementById('successModalClose');

  payBtn.addEventListener('click', () => {
    const requiredCardFields = document.querySelectorAll('.card-box input[required], .card-box input:not([type="hidden"])');
    let valid = true;

    ['numeroTarjeta', 'nombreTitular', 'vencimiento', 'cvv', 'docTitularNumero'].forEach(name => {
      const field = document.querySelector(`input[name="${name}"]`);
      if (!field) return;
      const wrapper = field.closest('.form-field');
      if (!field.value.trim()) {
        valid = false;
        if (wrapper) wrapper.classList.add('has-error');
      } else if (wrapper) {
        wrapper.classList.remove('has-error');
      }
    });

    if (!valid) {
      payBtn.closest('.card-box') && payBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    successOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });

  if (successClose) {
    successClose.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  /* =========================================================
     DESCARGAR ITINERARIO (placeholder de confirmación)
     ========================================================= */
  const downloadItineraryBtn = document.getElementById('downloadItineraryBtn');
  if (downloadItineraryBtn) {
    downloadItineraryBtn.addEventListener('click', () => {
      downloadItineraryBtn.textContent = 'Preparando itinerario...';
      setTimeout(() => { downloadItineraryBtn.textContent = 'Descargar Itinerario'; }, 1400);
    });
  }

  updateSummary();
});
