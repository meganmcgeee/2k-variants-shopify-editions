// general purpose function to extract ID from GID string
function unwrapId(gid) {
  return gid.match(/\d+/)[0];
}
export async function productsAll(admin, session, currentPageInfo) {
  const productPerPage = 5;
  let variables = {};
  if(currentPageInfo?.dir === "prev") {
    variables =  {last: productPerPage, forwardCursor: currentPageInfo?.pageInfo};
  } else {
    variables =  {first: productPerPage, backCursor: currentPageInfo?.pageInfo};
  }
  const query = `
  query getProducts($first: Int, $last: Int, $forwardCursor: String, $backCursor: String) {
      products(sortKey: TITLE, first: $first, last: $last, before: $forwardCursor, after: $backCursor) {
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
        }
        nodes {
          id
          title
          handle
          featuredImage {
            altText
            url
          }
          variantsCount {
            count
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query,
    {
      variables: variables,
    }
  );

  let {
    data: { products: { nodes, pageInfo } },
  } = await response.json();

  const products = nodes.map((product) => {
    return {
      id: unwrapId(product.id),
      image: {
        src: product.featuredImage?.url,
        alt: product.featuredImage?.altText,
      },
      title: product.title,
      handle: product.handle,
      variantsCount: product.variantsCount.count,
    }
  });
  if (pageInfo?.hasNextPage) {
    pageInfo['nextPage'] = { query: { pageInfo: pageInfo.endCursor, dir: "next" } };
  }
  if (pageInfo?.hasPreviousPage) {
    pageInfo['prevPage'] = { query: { pageInfo: pageInfo.startCursor, dir: "prev" } };
  }
  return { products, pageInfo };
}