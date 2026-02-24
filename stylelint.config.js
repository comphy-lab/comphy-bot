/** @type {import('stylelint').Config} */
module.exports = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "assets/css/academicons-1.7.0/**",
    "assets/css/fontello/**",
    "assets/css/vendor.css"
  ],
  rules: {
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    "no-descending-specificity": null,
    "color-function-notation": null,
    "alpha-value-notation": null,
    "color-hex-length": null,
    "comment-whitespace-inside": null,
    "comment-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "property-no-vendor-prefix": null,
    "selector-not-notation": null,
    "keyframes-name-pattern": null,
    "rule-empty-line-before": null,
    "no-duplicate-selectors": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "media-feature-range-notation": null,
    "value-keyword-case": null,
    "font-family-name-quotes": null,
    "import-notation": null,
    "media-query-no-invalid": null,
    "selector-pseudo-element-colon-notation": null,
    "declaration-block-no-duplicate-properties": null,
    "length-zero-no-unit": null,
    "shorthand-property-no-redundant-values": null,
    "declaration-property-value-keyword-no-deprecated": null,
    "declaration-empty-line-before": null,
    "font-family-no-missing-generic-family-keyword": null,
    "declaration-block-no-shorthand-property-overrides": null,
    "declaration-property-value-no-unknown": null
  }
};
