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
  });

  qtyPlus.addEventListener('click', () => {
    qtyInput.value = clampQty((parseInt(qtyInput.value, 10) || 1) + 1);
  });

  qtyInput.addEventListener('change', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value, 10) || 1);
  });

  /* ---------- Acordeón del itinerario ---------- */
  const dayHeaders = document.querySelectorAll('[data-day-toggle]');

  dayHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const dayEl = header.closest('.itinerary-day');
      dayEl.classList.toggle('is-open');
    });
  });

  /* ---------- Agregar al carrito (placeholder) ---------- */
  const addToCartBtn = document.getElementById('addToCartBtn');
  const cartCount     = document.querySelector('.cart-count');

  addToCartBtn.addEventListener('click', () => {
    const qty = parseInt(qtyInput.value, 10) || 1;

    // Recalcula el precio total (USD y PEN) según la cantidad de pasajeros
    updatePrices(qty);

    // Aquí puedes conectar tu lógica real de carrito (API, localStorage, etc.)
    const current = parseInt(cartCount.textContent, 10) || 0;
    cartCount.textContent = current + qty;

    addToCartBtn.textContent = 'Agregado ✓';
    addToCartBtn.style.background = '#00C2A8';
    setTimeout(() => {
      addToCartBtn.textContent = 'Agregar Pasajeros';
      addToCartBtn.style.background = '';
    }, 1400);
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