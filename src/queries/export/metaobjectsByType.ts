export const Q_METAOBJECTS_BY_TYPE = (t: string) => `
{
  metaobjects(type: "${t}", first: 250) {
    edges { node { id handle type fields { key type value } } }
  }
}
`;
