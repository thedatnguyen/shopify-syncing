export const Q_SHOP_ID = `
{ shop { id } }
`;

export const Q_PRODUCT_BY_HANDLE = `
  query PBH($handle: String!) { productByHandle(handle: $handle) { id } }
`;

export const Q_COLLECTION_BY_HANDLE = `
  query CBH($handle: String!) { collectionByHandle(handle: $handle) { id } }
`;

export const Q_PAGE_BY_HANDLE = `
  query PgBH($handle: String!) { pageByHandle(handle: $handle) { id } }
`;

export const Q_BLOG_BY_HANDLE = `
  query BBH($handle: String!) { blogByHandle(handle: $handle) { id handle } }
`;

export const Q_ARTICLE_BY_HANDLE = `
  query ABH($blogHandle: String!, $handle: String!) {
    articleByHandle(blogHandle: $blogHandle, handle: $handle) { id }
  }
`;

export const Q_VARIANT_BY_SKU = `
  query VBQ($q: String!) {
    productVariants(first: 1, query: $q) { edges { node { id sku } } }
  }
`;

export const Q_CUSTOMER_BY_EMAIL = `
  query CBQ($q: String!) {
    customers(first: 1, query: $q) { edges { node { id email } } }
  }
`;
