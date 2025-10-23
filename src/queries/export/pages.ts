export const Q_PAGES = `
{
  pages(first: 250) {
    edges {
      node {
        id handle title
        metafields(first: 250) { edges { node { namespace key type value } } }
      }
    }
  }
}
`;
