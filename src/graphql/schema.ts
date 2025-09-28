export const schema = `
  type Quote {
    id: String!
    content: String!
    author: String!
    tags: [String!]!
    likes: Int!
    source: String!
    createdAt: String!
    updatedAt: String!
  }

  type LikeResult {
    success: Boolean!
    likes: Int!
  }

  type Stats {
    totalQuotes: Int!
    totalLikedQuotes: Int!
    averageLikes: Float!
  }

  type Query {
    randomQuote: Quote!
    smartQuote(preferLiked: Boolean): Quote!
    popularQuotes(limit: Int): [Quote!]!
    stats: Stats!
  }

  type Mutation {
    likeQuote(id: String!): LikeResult!
  }
`;
