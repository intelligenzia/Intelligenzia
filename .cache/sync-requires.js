const { hot } = require("react-hot-loader/root")

// prefer default export if available
const preferDefault = m => m && m.default || m


exports.components = {
  "component---src-templates-category-template-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/templates/CategoryTemplate.js"))),
  "component---src-templates-post-template-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/templates/PostTemplate.js"))),
  "component---src-templates-page-template-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/templates/PageTemplate.js"))),
  "component---cache-dev-404-page-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/.cache/dev-404-page.js"))),
  "component---src-pages-404-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/pages/404.js"))),
  "component---src-pages-category-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/pages/category.js"))),
  "component---src-pages-contact-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/pages/contact.js"))),
  "component---src-pages-index-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/pages/index.js"))),
  "component---src-pages-search-js": hot(preferDefault(require("/Users/perttu/Projects/intelligenzia/src/pages/search.js")))
}

