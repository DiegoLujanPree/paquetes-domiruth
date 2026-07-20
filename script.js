document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Galería de imágenes (Hover, Zoom, Autoplay y Flechas) ---------- */
  const mainImg = document.getElementById('galleryMainImg');
  const thumbs = document.querySelectorAll('.thumb');
  const galleryMain = document.querySelector('.gallery-main');
  const thumbsContainer = document.getElementById('galleryThumbs'); // Seleccionamos el contenedor de las miniaturas

  let currentIndex = 0;
  let autoPlayTimer;
  const autoPlayDelay = 3000; // 3000ms = 3 segundos

  // 1. Función principal para cambiar la imagen
  const changeImage = (index) => {
    thumbs.forEach(t => t.classList.remove('is-active'));
    thumbs[index].classList.add('is-active');
    
    // Obtenemos el 'src' directo de la miniatura para evitar enlaces rotos
    const realSrc = thumbs[index].querySelector('img').src; 
    mainImg.src = realSrc;
    currentIndex = index;

    // NUEVO: Scroll automático para que la miniatura activa se centre sola
    if (thumbsContainer) {
      const thumbOffset = thumbs[index].offsetTop;
      const containerHalfHeight = thumbsContainer.clientHeight / 2;
      thumbsContainer.scrollTo({
        top: thumbOffset - containerHalfHeight,
        behavior: 'smooth'
      });
    }
  };

  // 2. Cambio automático al pasar el cursor sobre las miniaturas (Hover)
  thumbs.forEach((thumb, index) => {
    thumb.addEventListener('mouseenter', () => {
      changeImage(index);
      resetAutoPlay(); // Reiniciamos el tiempo si el usuario interactúa
    });
  });

  // 3. Efecto Zoom (Lupa) al mover el cursor dentro de la imagen principal
  galleryMain.addEventListener('mousemove', (e) => {
    stopAutoPlay(); // Detenemos el pase de diapositivas mientras hace zoom

    const { left, top, width, height } = galleryMain.getBoundingClientRect();
    
    // Calculamos la posición del mouse en porcentajes
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    // Movemos el origen de la transformación hacia donde está el cursor
    mainImg.style.transformOrigin = `${x}% ${y}%`;
    mainImg.style.transform = 'scale(2)'; // Nivel de zoom
  });

  // 4. Quitar el zoom y reanudar autoplay al quitar el cursor
  galleryMain.addEventListener('mouseleave', () => {
    mainImg.style.transformOrigin = 'center center';
    mainImg.style.transform = 'scale(1)';
    startAutoPlay(); 
  });

  // 5. Lógica de Autoplay (Cada 3 segundos)
  const startAutoPlay = () => {
    stopAutoPlay(); // Asegurar que no hayan tiempos duplicados
    autoPlayTimer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= thumbs.length) {
        nextIndex = 0; // Vuelve al inicio
      }
      changeImage(nextIndex);
    }, autoPlayDelay);
  };

  const stopAutoPlay = () => {
    clearInterval(autoPlayTimer);
  };

  const resetAutoPlay = () => {
    stopAutoPlay();
    startAutoPlay();
  };

  // 6. NUEVO: Lógica de las flechas de navegación arriba/abajo
  const btnUp = document.getElementById('thumbNavUp');
  const btnDown = document.getElementById('thumbNavDown');
  const scrollAmount = 140; // Píxeles que bajará/subirá al dar un clic

  if (btnUp && btnDown && thumbsContainer) {
    btnUp.addEventListener('click', () => {
      thumbsContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    });
    btnDown.addEventListener('click', () => {
      thumbsContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    });
  }

  // Iniciar el carrusel al cargar la página
  startAutoPlay();

  /* ---------- Precio en soles + actualización según pasajeros ---------- */
  const priceBox = document.getElementById('priceBox');

  // Precios base (por 1 pasajero) y tipo de cambio, tomados del HTML (data-*)
  // para que sean fáciles de actualizar sin tocar el JS.
  const BASE_PRICE_USD     = parseFloat(priceBox.dataset.priceUsd);
  const BASE_PRICE_OLD_USD = parseFloat(priceBox.dataset.priceOldUsd);
  const EXCHANGE_RATE      = parseFloat(priceBox.dataset.exchangeRate);

  const priceUSDEl     = document.getElementById('priceUSD');
  const priceUSDCentsEl= document.getElementById('priceUSDCents');
  const priceOldUSDEl  = document.getElementById('priceOldUSD');
  const pricePENEl     = document.getElementById('pricePEN');
  const pricePENCentsEl= document.getElementById('pricePENCents');
  const priceOldPENEl  = document.getElementById('priceOldPEN');
  const exchangeRateLabelEl = document.getElementById('exchangeRateLabel');

  if (exchangeRateLabelEl) {
    exchangeRateLabelEl.textContent = EXCHANGE_RATE.toFixed(2);
  }

  // Formatea un número a "4,588" (parte entera con separador de miles) y ".00" (decimales)
  const formatPriceParts = (value) => {
    const fixed = value.toFixed(2);
    const [intPart, centsPart] = fixed.split('.');
    const intFormatted = Number(intPart).toLocaleString('en-US');
    return { intFormatted, centsPart };
  };

  // Recalcula y pinta los precios (USD y PEN) según la cantidad de pasajeros
  const updatePrices = (qty) => {
    const totalUSD    = BASE_PRICE_USD * qty;
    const totalOldUSD = BASE_PRICE_OLD_USD * qty;
    const totalPEN    = totalUSD * EXCHANGE_RATE;
    const totalOldPEN = totalOldUSD * EXCHANGE_RATE;

    const usdParts    = formatPriceParts(totalUSD);
    const oldUsdParts = formatPriceParts(totalOldUSD);
    const penParts    = formatPriceParts(totalPEN);
    const oldPenParts = formatPriceParts(totalOldPEN);

    priceUSDEl.textContent = usdParts.intFormatted;
    priceUSDCentsEl.textContent = `.${usdParts.centsPart}`;
    priceOldUSDEl.textContent = `$ ${oldUsdParts.intFormatted}.${oldUsdParts.centsPart}`;

    pricePENEl.textContent = penParts.intFormatted;
    pricePENCentsEl.textContent = `.${penParts.centsPart}`;
    priceOldPENEl.textContent = `S/ ${oldPenParts.intFormatted}.${oldPenParts.centsPart}`;
  };

  /* ---------- Selector de cantidad ---------- */
  const qtyInput = document.getElementById('qtyInput');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus  = document.getElementById('qtyPlus');

  const clampQty = (value) => {
    const min = parseInt(qtyInput.min, 10) || 1;
    const max = parseInt(qtyInput.max, 10) || 10;
    return Math.min(max, Math.max(min, value));
  };

  qtyMinus.addEventListener('click', () => {
    qtyInput.value = clampQty((parseInt(qtyInput.value, 10) || 1) - 1);
    updatePrices(parseInt(qtyInput.value, 10) || 1);
  });

  qtyPlus.addEventListener('click', () => {
    qtyInput.value = clampQty((parseInt(qtyInput.value, 10) || 1) + 1);
    updatePrices(parseInt(qtyInput.value, 10) || 1);
  });

  qtyInput.addEventListener('change', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value, 10) || 1);
    updatePrices(parseInt(qtyInput.value, 10) || 1);
  });

  /* ---------- Acordeón del itinerario ---------- */
  const dayHeaders = document.querySelectorAll('[data-day-toggle]');

  dayHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const dayEl = header.closest('.itinerary-day');
      dayEl.classList.toggle('is-open');
    });
  });

  // Precio inicial en soles al cargar la página (con 1 pasajero)
  updatePrices(parseInt(qtyInput.value, 10) || 1);

});

/* ---------- Menú hamburguesa móvil ---------- */
const menuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
  });
}

/* ---------- Carrusel infinito, con autoplay y swipe (Viajes Similares) ---------- */
function initInfiniteCarousel({ containerId, trackId, prevBtnId, nextBtnId, autoplayDelay = 4000 }) {
  const container = document.getElementById(containerId);
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);
  if (!container || !track || !prevBtn || !nextBtn) return;

  const originalCards = Array.from(track.children);
  const total = originalCards.length;
  if (total === 0) return;

  // Clonamos el set completo al inicio y al final para lograr un loop infinito y sin cortes
  originalCards.forEach(card => track.appendChild(card.cloneNode(true)));
  [...originalCards].reverse().forEach(card => track.insertBefore(card.cloneNode(true), track.firstChild));

  let currentIndex = total; // Arrancamos en la primera tarjeta "real"
  let step = 0;
  let autoplayTimer = null;
  let isAnimating = false;

  const measureStep = () => {
    const children = track.children;
    if (children.length < 2) return children[0] ? children[0].getBoundingClientRect().width : 0;
    // Distancia real entre dos tarjetas consecutivas (incluye el gap), inmune a redondeos del %.
    return children[1].getBoundingClientRect().left - children[0].getBoundingClientRect().left;
  };

  const updatePosition = (withTransition) => {
    track.style.transition = withTransition ? 'transform .5s cubic-bezier(.65,0,.35,1)' : 'none';
    track.style.transform = `translateX(-${currentIndex * step}px)`;
  };

  const moveTo = (direction) => {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex += direction;
    updatePosition(true);
  };

  track.addEventListener('transitionend', () => {
    isAnimating = false;
    // Salto invisible: al llegar a una zona clonada, reposicionamos sin animación
    if (currentIndex >= total * 2) {
      currentIndex -= total;
      updatePosition(false);
    } else if (currentIndex < 0) {
      currentIndex += total;
      updatePosition(false);
    }
  });

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(() => moveTo(1), autoplayDelay);
  };
  const stopAutoplay = () => clearInterval(autoplayTimer);
  const restartAutoplay = () => { stopAutoplay(); startAutoplay(); };

  nextBtn.addEventListener('click', () => { moveTo(1); restartAutoplay(); });
  prevBtn.addEventListener('click', () => { moveTo(-1); restartAutoplay(); });

  // Pausa al pasar el mouse, reanuda 4s después de que el usuario se va
  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', restartAutoplay);

  // Swipe táctil para móvil
  let touchStartX = 0;
  let touchDeltaX = 0;
  let isTouching = false;

  track.addEventListener('touchstart', (e) => {
    isTouching = true;
    touchStartX = e.touches[0].clientX;
    touchDeltaX = 0;
    stopAutoplay();
    track.style.transition = 'none';
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isTouching) return;
    touchDeltaX = e.touches[0].clientX - touchStartX;
    track.style.transform = `translateX(${-currentIndex * step + touchDeltaX}px)`;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (!isTouching) return;
    isTouching = false;
    const threshold = 45;
    if (touchDeltaX <= -threshold) {
      moveTo(1);
    } else if (touchDeltaX >= threshold) {
      moveTo(-1);
    } else {
      updatePosition(true);
    }
    restartAutoplay();
  });

  // Recalcular al cambiar el tamaño de la ventana (responsive)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      step = measureStep();
      updatePosition(false);
    }, 150);
  });

  // Inicialización
  step = measureStep();
  updatePosition(false);
  startAutoplay();
}

initInfiniteCarousel({
  containerId: 'viajesSimilaresCarousel',
  trackId: 'carouselTrackSimilar',
  prevBtnId: 'prevBtnSimilar',
  nextBtnId: 'nextBtnSimilar',
  autoplayDelay: 4000
});

/* ---------- Modal informativo (Servicios Confirmados) ---------- */
(() => {
  const overlay  = document.getElementById('infoModalOverlay');
  const titleEl  = document.getElementById('infoModalTitle');
  const subEl    = document.getElementById('infoModalSubtitle');
  const tabsEl   = document.getElementById('infoModalTabs');
  const bodyEl   = document.getElementById('infoModalBody');
  const closeBtn = document.getElementById('infoModalClose');
  const triggers = document.querySelectorAll('.servicio-item');

  if (!overlay || !triggers.length) return;

  // Contenido de cada botón: título, subtítulo y pestañas con tarjetas de información
  const infoModalData = {
    'info-general': {
      title: 'Información General',
      subtitle: 'Datos útiles antes de viajar',
      tabs: [
        {
          label: 'Datos del viaje',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>🗓️ Duración</h4><p>19 días y 18 noches recorriendo las principales ciudades de Europa, con salida y llegada desde Londres.</p></div>
            <div class="info-card"><h4>🌍 Idiomas</h4><p>Inglés, francés, italiano y español según el país. Guías de habla hispana en los tours incluidos.</p></div>
            <div class="info-card"><h4>🔌 Electricidad</h4><p>Voltaje de 220-240V. Se recomienda llevar un adaptador universal, ya que el enchufe varía por país.</p></div>
            <div class="info-card"><h4>🕐 Zona horaria</h4><p>Europa continental usa UTC+1 (UTC+2 en verano). Reino Unido usa UTC+0.</p></div>
          </div>`
        },
        {
          label: 'Clima',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>☀️ Temporada de viaje</h4><p>Noviembre trae temperaturas frescas en toda la ruta, entre 5°C y 14°C, ideales para recorrer ciudades.</p></div>
            <div class="info-card"><h4>🧥 Qué llevar</h4><p>Ropa de abrigo por capas, un impermeable ligero y calzado cómodo para caminar largas distancias.</p></div>
          </div>`
        },
        {
          label: 'Moneda',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>💶 Euro</h4><p>Moneda oficial en la mayor parte del recorrido (Francia, Italia, España). Símbolo €, 100 céntimos.</p></div>
            <div class="info-card"><h4>💷 Libra esterlina</h4><p>Moneda oficial en Reino Unido. Se recomienda cambiar un monto pequeño antes de llegar a Londres.</p></div>
          </div>`
        }
      ]
    },
    'que-visitar': {
      title: '¿Qué visitar?',
      subtitle: 'Los imperdibles de cada destino',
      tabs: [
        {
          label: 'Reino Unido',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>🏰 Londres</h4><p>El Big Ben, el London Eye, el Palacio de Buckingham y el barrio de Camden Town.</p></div>
            <div class="info-card"><h4>🌉 Tower Bridge</h4><p>Uno de los símbolos más fotografiados de la ciudad, junto a la Torre de Londres.</p></div>
          </div>`
        },
        {
          label: 'Francia e Italia',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>🗼 París</h4><p>La Torre Eiffel, el Museo del Louvre y un paseo en barco por el río Sena.</p></div>
            <div class="info-card"><h4>🛶 Venecia</h4><p>Recorre sus canales en góndola y visita la Plaza de San Marcos.</p></div>
            <div class="info-card"><h4>🏛️ Roma</h4><p>El Coliseo, el Vaticano y la Fontana di Trevi, entre los sitios más visitados del mundo.</p></div>
            <div class="info-card"><h4>🎨 Florencia</h4><p>Cuna del Renacimiento, con la Galería Uffizi y el Duomo como principales atractivos.</p></div>
          </div>`
        },
        {
          label: 'España',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>🎨 Barcelona</h4><p>La Sagrada Familia y el Parque Güell, obras maestras de Gaudí.</p></div>
            <div class="info-card"><h4>🖼️ Madrid</h4><p>El Museo del Prado y el Palacio Real, en el corazón de la capital española.</p></div>
          </div>`
        }
      ]
    },
    'requisitos': {
      title: 'Requisitos de entrada',
      subtitle: 'Documentación necesaria para tu viaje',
      tabs: [
        {
          label: 'Pasaporte y visa',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>🛂 Pasaporte</h4><p>Vigencia mínima de 6 meses desde la fecha de regreso, con al menos 2 páginas en blanco.</p></div>
            <div class="info-card"><h4>📄 Visa Schengen</h4><p>Requerida para viajeros sin exención. Verifica el trámite según tu nacionalidad.</p></div>
          </div>`
        },
        {
          label: 'Seguro de viaje',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>🩺 Cobertura médica</h4><p>Seguro básico de viaje incluido en el paquete, con asistencia médica en el extranjero.</p></div>
          </div>`
        },
        {
          label: 'Otros requisitos',
          content: `<div class="info-cards-grid">
            <div class="info-card"><h4>💉 Vacunas</h4><p>No se exigen vacunas obligatorias para ingresar a los países del itinerario.</p></div>
            <div class="info-card"><h4>✈️ Formularios digitales</h4><p>Verifica requisitos de registro electrónico como ETA o ETIAS antes de tu viaje.</p></div>
          </div>`
        }
      ]
    },
    'hoteles': {
      title: 'Hoteles Previstos',
      subtitle: 'Alojamiento incluido en tu paquete',
      tabs: [
        {
          label: 'España',
          content: `<div class="hotel-modal-list">
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/Londres.jpg" alt="Hotel Encanto en Londres" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--oc">BARCELONA</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Encanto Londres</h4>
                <p>Ubicación céntrica cerca de las principales estaciones, ideal para moverse a pie por la ciudad.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/paris.jpg" alt="Hotel Encanto en París" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--oc">MADRID</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Encanto París</h4>
                <p>A pocos minutos del Sena, con atención personalizada y ambiente clásico parisino.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/venecia.jpg" alt="Hotel Encanto en Venecia" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--oc">FLORENCIA</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Encanto Venecia</h4>
                <p>Alojamiento con encanto veneciano, próximo a los principales canales y vaporettos.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/roma.jpg" alt="Hotel Encanto en Roma" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--oc">PALMAS</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Encanto Roma</h4>
                <p>Ubicación céntrica cercana a los sitios históricos, con atención cálida y personalizada.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
          </div>`
        },
        {
          label: 'Francia',
          content: `<div class="hotel-modal-list">
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/Londres3.jpg" alt="Hotel Superior en Londres" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--teal">PARIS</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Superior Londres</h4>
                <p>Hotel boutique con mejores vistas y comodidades superiores en el centro de la ciudad.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/paris2.jpg" alt="Hotel Superior en París" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--teal">PARIS</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Superior París</h4>
                <p>Mayores comodidades y ubicación privilegiada cerca de los principales atractivos.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/venecia-2.jpg" alt="Hotel Superior en Venecia" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--teal">PARIS</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Superior Venecia</h4>
                <p>Hotel boutique de 4-5 estrellas con vistas privilegiadas sobre los canales.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
            <article class="hotel-modal-card">
              <div class="hotel-modal-card__img"><img src="img/PAQUETE/roma2.jpg" alt="Hotel Superior en Roma" onerror="this.style.display='none'"></div>
              <div class="hotel-modal-card__body">
                <span class="badge badge--teal">PARIS</span>
                <p class="hotel-modal-card__place">Hotel ✰✰✰✰</p>
                <h4>Hotel Superior Roma</h4>
                <p>Comodidades superiores y excelente ubicación cerca de los sitios más emblemáticos.</p>
                <span class="price-now price-now--sm">4 días y 3 noches<small></span>
              </div>
            </article>
          </div>`
        }
      ]
    }
  };

  const renderTab = (tab) => {
    bodyEl.innerHTML = tab.content;
    bodyEl.scrollTop = 0;
  };

  const openModal = (key) => {
    const data = infoModalData[key];
    if (!data) return;

    titleEl.textContent = data.title;
    subEl.textContent = data.subtitle;
    tabsEl.innerHTML = '';

    data.tabs.forEach((tab, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'info-modal__tab' + (index === 0 ? ' is-active' : '');
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        tabsEl.querySelectorAll('.info-modal__tab').forEach(t => t.classList.remove('is-active'));
        btn.classList.add('is-active');
        renderTab(tab);
      });
      tabsEl.appendChild(btn);
    });

    renderTab(data.tabs[0]);
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(trigger.dataset.servicio);
    });
  });

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });
})();