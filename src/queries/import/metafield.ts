export const OWNER_TYPES = [
  "PRODUCT","PRODUCTVARIANT","COLLECTION","CUSTOMER",
  "PAGE","ARTICLE","BLOG","SHOP","ORDER",
  "COMPANY","COMPANY_LOCATION",
];

export const Q_FETCH_MF_DEFS = (ownerType: string) => `
  query FetchDefs($after:String) {
    metafieldDefinitions(ownerType: ${ownerType}, first: 250, after: $after) {
      edges { node { namespace key ownerType } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const M_METAFIELD_DEF_CREATE = `
  mutation DefCreate($def: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $def) {
      createdDefinition { id }
      userErrors { field message }
    }
  }
`;

// set values
export const M_METAFIELDS_SET = `
  mutation MetafieldsSet($mfs: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $mfs) {
      metafields { id key namespace owner { __typename ... on Product { id } } }
      userErrors { field message code }
    }
  }
`;
