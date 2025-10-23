// definitions
export const Q_FETCH_MO_DEFS = `
  query FetchMO($after:String) {
    metaobjectDefinitions(first: 250, after: $after) {
      edges { node { type } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const M_METAOBJECT_DEF_CREATE = `
  mutation MODefCreate($def: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $def) {
      metaobjectDefinition { id }
      userErrors { field message }
    }
  }
`;

// entries (upsert bằng create + update nếu tồn tại)
export const Q_METAOBJECT_BY_HANDLE = `
  query MOBH($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) { id handle type }
  }
`;

export const M_METAOBJECT_CREATE = `
  mutation MOC($input: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $input) {
      metaobject { id handle type }
      userErrors { field message }
    }
  }
`;

export const M_METAOBJECT_UPDATE = `
  mutation MOU($id: ID!, $fields: [MetaobjectFieldInput!]!) {
    metaobjectUpdate(id: $id, fields: $fields) {
      metaobject { id handle type }
      userErrors { field message }
    }
  }
`;
