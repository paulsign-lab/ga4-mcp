# Platform Detection Guide

How to identify the user's site platform from a single homepage crawl.

## The detection probe — paste this into Chrome MCP `javascript_tool`

```js
({
  // Shopify
  shopify: typeof window.Shopify !== 'undefined' ? {
    shop: Shopify.shop,
    locale: Shopify.locale,
    currency: Shopify.currency && Shopify.currency.active,
    theme: Shopify.theme && Shopify.theme.name,
    themeId: Shopify.theme && Shopify.theme.id
  } : null,

  // WordPress / WooCommerce
  wordpress: !!document.querySelector('meta[name=generator][content*="WordPress"]'),
  woocommerce: !!document.querySelector('body.woocommerce, .woocommerce-page, link[rel="https://api.w.org/"]'),

  // Webflow
  webflow: !!document.querySelector('[data-wf-page], script[src*="webflow.com/css/webflow"]'),

  // BigCommerce
  bigcommerce: typeof window.BCData !== 'undefined' || !!document.querySelector('script[src*="bigcommerce.com"]'),

  // Cafe24 (Korea)
  cafe24: /cafe24/i.test(document.documentElement.outerHTML.slice(0, 5000)) || !!document.querySelector('script[src*="cafe24"]'),

  // Imweb (Korea)
  imweb: !!document.cookie.match(/_imweb_/) || !!document.querySelector('script[src*="imweb"]'),

  // Squarespace
  squarespace: typeof window.Static !== 'undefined' && !!window.Static.SQUARESPACE_CONTEXT,

  // Existing tracking
  tracking: {
    gtm:        typeof window.google_tag_manager !== 'undefined',
    ga4:        typeof window.gtag !== 'undefined' || !!document.cookie.match(/_ga/),
    metaPixel:  typeof window.fbq !== 'undefined',
    klaviyo:    typeof window.klaviyo !== 'undefined' || !!document.cookie.match(/__kla_id/),
    hotjar:     typeof window.hj !== 'undefined',
    linkedin:   typeof window._linkedin_partner_id !== 'undefined',
    tiktok:     typeof window.ttq !== 'undefined'
  },

  // Page hints
  navLinks: Array.from(document.querySelectorAll('header nav a, nav a')).slice(0, 30).map(a => ({
    text: a.textContent.trim().slice(0, 40),
    href: a.getAttribute('href')
  })),

  // Product/Collection URL patterns visible in the nav
  productPath: !!document.querySelector('a[href*="/products/"], a[href*="/product/"], a[href*="/p/"]'),
  collectionPath: !!document.querySelector('a[href*="/collections/"], a[href*="/category/"], a[href*="/c/"]'),

  // Cart icon (D2C signal)
  cartIcon: !!document.querySelector('[class*="cart"], [data-cart], a[href*="/cart"]'),

  // Form types on page
  forms: Array.from(document.querySelectorAll('form')).map(f => ({
    action: f.action,
    id: f.id,
    method: f.method,
    inputs: Array.from(f.querySelectorAll('input,select,textarea')).map(i => i.name).filter(n => n)
  }))
})
```

## Decision flow

```
1. shopify is non-null?           → use templates/shopify_dataLayer.liquid
2. wordpress + woocommerce?       → use templates/generic_dataLayer.js with WP adapter notes
3. webflow?                       → use templates/generic_dataLayer.js + Webflow embed instructions
4. cafe24 / imweb?                → use templates/generic_dataLayer.js + warn user re: vendor lock-in
5. anything else                  → use templates/generic_dataLayer.js
```

## Existing tracking — handle gracefully

If the probe detects existing GA4 / GTM / Pixel, **do not silently overwrite**.
Tell the user explicitly:

> "I see GTM (`GTM-ABC1234`) is already installed via the native Shopify
> 'Customer Events' integration. If we install our GTM container alongside,
> events may fire twice. Two options:
> A) Remove the native Shopify integration first
> B) Use the native integration and disable our duplicate event tags
> Which would you like?"

Klaviyo is fine to leave alone — it's an email platform, not a tracking
duplicate.

## Korean platforms (cafe24, imweb) — special notes

- Cafe24: dataLayer can be injected via "스킨편집 → header.html". Variable
  syntax: `{$product.product_no}` instead of Liquid's `{{ product.handle }}`.
- Imweb: limited template access. Often need to use Imweb's "추가 스크립트"
  feature. Less context available (no template variables in most places).
  Tell the user upfront this will yield a thinner dataLayer.
