export const Q_SHOP = `
{
  shop {
    id
    metafields(first: 250) { edges { node { namespace key type value } } }
  }
}
`;
