function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => model.modelViewerUI?.pause());
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const serializeForm = form => {
  const obj = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    if (/\[\w+\]/.test(key)) {
      const rgx = /\[(\w+)\]/g;
      const top = /^([^\[]+)/.exec(key)[0];
      const sub = rgx.exec(key)[1];
      if (!obj[top]) {
        obj[top] = {};
      }
      obj[top][sub] = formData.get(key);
    } else {
	  obj[key] = formData.get(key);
    }
  }
  return JSON.stringify(obj);
};

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');
    const summaryElements = this.querySelectorAll('summary');
    this.addAccessibilityAttributes(summaryElements);

    if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  addAccessibilityAttributes(summaryElements) {
    summaryElements.forEach(element => {
      element.setAttribute('role', 'button');
      element.setAttribute('aria-expanded', false);
      element.setAttribute('aria-controls', element.nextElementSibling.id);
    });
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));

      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
      });
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove('menu-opening');
      this.mainDetailsToggle.querySelectorAll('details').forEach(details =>  {
        details.removeAttribute('open');
        details.classList.remove('menu-opening');
      });
      this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
      document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove('menu-opening');
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.getElementById('shopify-section-header');
    this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty('--header-bottom-position', `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`);

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this)
    );
    this.addEventListener('click', (event) => {
      if (event.target.nodeName === 'MODAL-DIALOG') this.hide();
    });
    this.addEventListener('keyup', () => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
  }

  show(opener) {
    this.openedBy = opener;
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    this.querySelector('.template-popup')?.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');
    button?.addEventListener('click', () => {
      document.querySelector(this.getAttribute('data-modal'))?.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="Deferred-Poster-"]')?.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent() {
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      window.pauseAllMedia();
      this.appendChild(content.querySelector('video, model-viewer, iframe')).focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('ul');
    this.sliderItems = this.querySelectorAll('li');
    this.pageCount = this.querySelector('.slider-counter--current');
    this.pageTotal = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    const resizeObserver = new ResizeObserver(entries => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
  }

  initPages() {
    const sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    this.sliderLastItem = sliderItemsToShow[sliderItemsToShow.length - 1];
    if (sliderItemsToShow.length === 0) return;
    this.slidesPerPage = Math.floor(this.slider.clientWidth / sliderItemsToShow[0].clientWidth);
    this.totalPages = sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  update() {
    if (!this.pageCount || !this.pageTotal) return;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderLastItem.clientWidth) + 1;

    if (this.currentPage === 1) {
      this.prevButton.setAttribute('disabled', true);
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.currentPage === this.totalPages) {
      this.nextButton.setAttribute('disabled', true);
    } else {
      this.nextButton.removeAttribute('disabled');
    }

    this.pageCount.textContent = this.currentPage;
    this.pageTotal.textContent = this.totalPages;
  }

  onButtonClick(event) {
    event.preventDefault();
    const slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + this.sliderLastItem.clientWidth : this.slider.scrollLeft - this.sliderLastItem.clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }
}

customElements.define('slider-component', SliderComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange(e) {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      if (!$(this).hasClass('no-media-switch')) {
        this.updateMedia(this.currentVariant);
        this.updateURL();
      }
      this.updateVariantInput();
      this.renderProductInfo();

      // Change active variant name
      const variantName = $(e.target).data('name');
      let id = $(e.target).data('id')
      
      if($(`.product__shipping[data-id=${id}]`).text() !== '') {
        $('.product__shipping').hide()
        $(`.product__shipping[data-id=${id}]`).css('display','inline-block')
      } else {
        $('.product__shipping').hide()
      }
    
           
      $(e.target).closest('.product-form__variant-container').find('.product-form__variant-active p').text(variantName);
      $(e.target).closest('.product-form__variant-container').siblings('.form__label').find('.product-form__variant-active p').text(variantName);
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia(newVariant) {
    // Main slider
    var $newImages = $('[data-variant-name="' + newVariant['option1'] + '"]');

    var slideshow = window.pdpSlider;
    var newSlides = [];

    var $thumbnails = $('.product__media-thumbnails');
    var newThumbs = [];

    var count = 1;

    $newImages.each(function(e, el) {
      var id = el.dataset.mediaId;
      var url = el.dataset.variantUrl;
      var title = el.dataset.variantName;

      var slide = `
        <li class="product__media-item swiper-slide" data-media-id="{{ section.id }}-${id}" data-slideid="${count - 1}">
          <div class="product__media media">
          <div class="aspect-ratio img-fill" style="max-width: 100%; width: 100%; --aspect-ratio: 100%">
            <img src="${url}" class="lazyload lazyload--blur" data-src="${url}" data-widths="[200,300,400,600,800,900,1000]" data-sizes="auto" alt="${title}" data-media-id="{{ image.id }}">
          </div>        
          </div>
        </li>`;

      newSlides.push(slide);

      var addClass = count == 1 ? 'active' : '';
      var thumb = `
        <div class="product__slider-thumbnail-item ${addClass}" data-media-id="{{ section.id }}-${id}" data-slideid="${count - 1}">
          <div class="aspect-ratio img-fill" style="max-width: 100%; width: 100%; --aspect-ratio: 1.0">
            <img src="${url}" class="lazyload lazyload--blur" data-src="${url}" data-widths="[200,300,400,600,800,900,1000]" data-sizes="auto" alt="Ivory"  data-media-id="{{ section.id }}-${id}" sizes="430px">
          </div>
        </div>
      `;

      newThumbs.push(thumb);

      count++;
    });
    
    slideshow.removeAllSlides();
    slideshow.appendSlide(newSlides);
    slideshow.slideToLoop(0);

    $thumbnails.empty();
    $thumbnails.append(newThumbs);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant?.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  renderProductInfo() {
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const id = `price-${this.dataset.section}`;
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const destination = document.getElementById(id);
        const source = html.getElementById(id);

        if (source && destination) destination.innerHTML = source.innerHTML;

        document.getElementById(`price-${this.dataset.section}`)?.classList.remove('visibility-hidden');
        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const addButton = document.getElementById(`product-form-${this.dataset.section}`)?.querySelector('[name="add"]');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', true);
      if (text) addButton.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButton.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const addButton = document.getElementById(`product-form-${this.dataset.section}`)?.querySelector('[name="add"]');
    if (!addButton) return;
    addButton.textContent = window.variantStrings.unavailable;
    document.getElementById(`price-${this.dataset.section}`)?.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);

// Product Card
class ProductCard extends HTMLElement {
  constructor() {
    super();   

    // Swatch
    this.swatch = $('.card-information__swatch');
    this.swatch.off('click').click(this.handleSwatchClick.bind(this));
  }

  handleSwatchClick(e) {
    e.preventDefault();

    const variantUrl = $(e.currentTarget).data('variantUrl');
    const variantId = $(e.currentTarget).data('variantId');
    const imageUrl = $(e.currentTarget).data('imageUrl');
    const color = $(e.currentTarget).data('value');

    this.swapImage(e, imageUrl, color);
    this.changeActiveState(e, color);
    this.swapLinks(e, variantUrl, variantId);
  }

  swapImage(e, imageUrl, color) {
    if (imageUrl) {
      $(e.currentTarget)
        .closest('.card-information')
        .siblings('.card')
        .find('.aspect-ratio img:first-of-type')
        .attr('alt', color)
        .attr('srcset', imageUrl)
        .attr('src', imageUrl);
    }
  }

  changeActiveState(e, color) {
    // Select new swatch
    $(e.currentTarget).siblings().removeClass('active');
    $(e.currentTarget).addClass('active');
  }

  swapLinks(e, variantUrl, variantId) {
    $(e.currentTarget)
      .closest('.card-wrapper')
      .find('.card__link')
      .attr('href', variantUrl);
  }
}

customElements.define('product-card', ProductCard);

/* FUNCTIONS */
// init AOS
$(function() {
  AOS.init({
    duration: 1000,
    once: true
  });
});

// Cookies
function getCookie(name) {
  var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}

function setCookie(name, value, days) {
  var d = new Date;
  d.setTime(d.getTime() + 24*60*60*1000*days);
  document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
}

/* SLIDERS */
const announcementBarSlider = new Swiper('.announcement-bar__message-container', {
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
  effect: 'fade',
  fadeEffect: {
    crossFade: true
  },
});

// Categories grid 
const categoriesGridSlider = new Swiper('.categories-grid__container', {
  slidesPerView: 1,
  loop: true,
  spaceBetween: 20,
  centeredSlides: true,
  pagination: {
    el: '.categories-grid__container .swiper-pagination',
    clickable: true,
  },
  breakpoints: {
    769: {
      slidesPerView: 3,
      spaceBetween: 30,
      allowTouchMove: false,
      centeredSlides: false
    }
  }
});

// Product slider
/* const productSlider = new Swiper('.product-slider__container', {
  slidesPerView: 1.13,
  loop: true,
  spaceBetween: 20,
  breakpoints: {
    769: {
      slidesPerView: 3,
      spaceBetween: 40,
      allowTouchMove: false,
      watchOverflow: true,
      navigation: {
        nextEl: '.product-slider .swiper-button-next',
        prevEl: '.product-slider .swiper-button-prev',
      }
    }
  }
}); */
$('.product-slider').each(function(idx) {
  let container = $(this).find('.product-slider__container').get(0);
  let navNext = $(this).find('.swiper-button-next').get(0);
  let navPrev = $(this).find('.swiper-button-prev').get(0);
  new Swiper(container, {
    slidesPerView: 1.13,
    loop: true,
    spaceBetween: 20,
    breakpoints: {
      769: {
        slidesPerView: 3,
        spaceBetween: 40,
        allowTouchMove: false,
        watchOverflow: true,
        navigation: {
          nextEl: navNext,
          prevEl: navPrev,
        }
      }
    }
  });
});


// swatches add to cart
$('.freeswatch__atc').click(function() {
  const body = JSON.stringify({
    items: [{
      id: 39323953266842,
      quantity: 1
    }],
    sections: getSectionsToRender().map((section) => section.section),
    sections_url: window.location.pathname
  });

  fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
    .then((response) => response.json())
    .then((parsedState) => {
      getSectionsToRender().forEach((section => {
        const elementToReplace =
          document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

        elementToReplace.innerHTML =
          getSectionInnerHTML(parsedState.sections[section.section], section.selector);
      }));
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => {
      document.querySelector('cart-drawer').open();
    });
});


// Upgrade Add to cart
$('.upgrade-swatch').click(function() {
  $(this).parent().find('.upgrade-swatch').removeClass('selectedColor')
  $(this).addClass('selectedColor')
})


$('.upgrade__atc').click(function() {
  let id = Number($(this).parent().find('.upgrade-swatch.selectedColor').data('varid'));
	console.log(id)
  const body = JSON.stringify({
    items: [{
      id: id,
      quantity: 1
    }],
    sections: getSectionsToRender().map((section) => section.section),
    sections_url: window.location.pathname
  });

  fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
    .then((response) => response.json())
    .then((parsedState) => {
      getSectionsToRender().forEach((section => {
        const elementToReplace =
          document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

        elementToReplace.innerHTML =
          getSectionInnerHTML(parsedState.sections[section.section], section.selector);
      }));
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => {
      document.querySelector('cart-drawer').open();
    });
});

function getSectionsToRender() {
  return [
    {
      id: 'cart-drawer__content',
      section: document.getElementById('cart-drawer__content').dataset.id,
      selector: '.cart-drawer__content',
    },
    {
      id: 'cart-icon-bubble',
      section: 'cart-icon-bubble',
      selector: '.shopify-section'
    }
  ];
}

function getSectionInnerHTML(html, selector) {
  return new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelector(selector).innerHTML;
}



$(document).ready(function() {
  var maxHeight = 0;

  $(".upgrade-product").each(function(){
    if ($(this).height() > maxHeight) {
      maxHeight = $(this).height(); 
    }
  });

   $(".upgrade-product").height(maxHeight);
})


// upgrade product images
$('.hover-swatch').click(function() {
  let id = $(this).data('index');
  let name = $(this).data('name');
 	console.log(id, name)
  $(this).parent().parent().parent().parent().parent().parent().parent().find('.hover-img').hide();
  $(this).parent().parent().parent().parent().parent().parent().parent().find(`.hover-img[data-index='${id}']`).show()
  $(this).parent().parent().find(`.product-form__variant-active p`).text(`${name}`)
})


// Click event for any anchor tag that's href starts with #
$('a[href^="#"]').click(function(event) {

    // The id of the section we want to go to.
    var id = $(this).attr("href");

    // An offset to push the content down from the top.
    var offset = 60;

    // Our scroll target : the top position of the
    // section that has the id referenced by our href.
    var target = $(id).offset().top - offset;

    // The magic...smooth scrollin' goodness.
    $('html, body').animate({scrollTop:target}, 500);

    //prevent the page from jumping down to our section.
    event.preventDefault();
});

// count up function
if ($('.product-features__count').length) {
var observer = new IntersectionObserver(function(entries) {
  if(entries[0].isIntersecting === true)
	$('.countUp').each(function() {
      var $this = $(this),
      countTo = $this.attr('data-count');
  
      $({ countNum: $this.text()}).animate({
        countNum: countTo
      },

      {
        duration: 5000,
        easing:'linear',
        step: function() {
        $this.text(Math.floor(this.countNum));
      },
      complete: function() {
        $this.text(this.countNum);
      }
    });  
  });
}, { threshold: [1] });

observer.observe(document.querySelector(".product-features__count"));
}


jQuery ( document ).ready ( function($) {
  var hash= window.location.hash
  if ( hash == '' || hash == '#' || hash == undefined ) return false;
      var target = $(hash);    
      headerHeight = 120;      
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');      
      if (target.length) {
        $('html,body').stop().animate({
          scrollTop: target.offset().top - 150 //offsets for fixed header
        }, 'linear');        
      }
} );

