export const Q_DEFINITIONS_BATCH_2 = `
{
  articleDefs: metafieldDefinitions(ownerType: ARTICLE, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
  blogDefs: metafieldDefinitions(ownerType: BLOG, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
  shopDefs: metafieldDefinitions(ownerType: SHOP, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
  metaobjectDefinitions(first: 250) {
    edges {
      node {
        id
        name
        type
        access { storefront }
        fieldDefinitions { key name required description type { name } validations { name type value } }
      }
    }
  }
}
`;
