export const Q_DEFINITIONS_BATCH_1 = `
{
  productDefs: metafieldDefinitions(ownerType: PRODUCT, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
  variantDefs: metafieldDefinitions(ownerType: PRODUCTVARIANT, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
  collectionDefs: metafieldDefinitions(ownerType: COLLECTION, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
  customerDefs: metafieldDefinitions(ownerType: CUSTOMER, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
  pageDefs: metafieldDefinitions(ownerType: PAGE, first: 250) {
    edges { node { id name namespace key description ownerType type { name } validations { name type value } } }
  }
}
`;
