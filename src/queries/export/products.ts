export const Q_PRODUCTS = `
{
  products(first: 250) {
    edges {
      node {
        id handle title
        metafields(first: 250) { edges { node { namespace key type value } } }
        variants(first: 250) {
          edges { node { id sku metafields(first: 250) { edges { node { namespace key type value } } } } }
        }
      }
    }
  }
}
`;
