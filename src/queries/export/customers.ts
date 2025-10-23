export const Q_CUSTOMERS = `
{
  customers(first: 250) {
    edges {
      node {
        id email
        metafields(first: 250) { edges { node { namespace key type value } } }
      }
    }
  }
}
`;
