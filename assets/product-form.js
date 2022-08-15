<<<<<<< HEAD
class ProductForm extends HTMLElement {
  constructor() {
    super();   

    this.form = this.querySelector('form');
    this.form && this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
    this.cartNotification = document.querySelector('cart-notification');
    this.cartDrawer = document.querySelector('cart-drawer');
  }

  onSubmitHandler(evt) {
    evt.preventDefault();

    this.bundles = document.querySelectorAll('.product-bundle:not(.hidden)');
    
    const submitButton = this.querySelector('[type="submit"]');

    submitButton.setAttribute('disabled', true);
    submitButton.classList.add('loading');

    let body = JSON.stringify({
      ...JSON.parse(serializeForm(this.form)),
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });
    if (this.bundles.length) {
      let items = [];
      this.bundles.forEach(bundle => {
        let selectedVariant = bundle.querySelector('.product-bundle__options input[type="radio"]:checked');
        items.push({
          id: selectedVariant.dataset.id,
          quantity: this.form.querySelector('.quantity__input').value
        });
      })
      body = JSON.stringify({
        items,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      });
    }

    fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
      .then((response) => response.json())
      .then((parsedState) => {

        this.getSectionsToRender().forEach((section => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

          elementToReplace.innerHTML =
            this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);

        }));
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        submitButton.classList.remove('loading');
        submitButton.removeAttribute('disabled');
        this.cartDrawer.open();
      });
  }

  getSectionsToRender() {
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

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }
}

customElements.define('product-form', ProductForm);
>>>>>>> 6d76704e6669600895813589596703f6667449d2
