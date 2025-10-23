export const Q_BLOGS = `
{
  blogs(first: 100) {
    edges {
      node {
        id handle
        metafields(first: 250) { edges { node { namespace key type value } } }
        articles(first: 250) {
          edges {
            node {
              id handle title
              metafields(first: 250) { edges { node { namespace key type value } } }
            }
          }
        }
      }
    }
  }
}
`;
