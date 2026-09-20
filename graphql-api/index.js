const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { Neo4jGraphQL } = require('@neo4j/graphql');
const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

const driver = neo4j.driver('bolt://neo4j:7687');

// The full vote list is aggregated in the browser, so it's returned flat with
// one read rather than through the generated relationship queries.
const resolvers = {
  Query: {
    votes: async () => {
      const session = driver.session({ defaultAccessMode: neo4j.session.READ });
      try {
        const result = await session.run(`
          MATCH (from:Country)-[v:GAVE_POINTS]->(to:Country)
          RETURN v.year AS year, v.round AS round, v.voteType AS voteType,
                 from.name AS fromCountry, to.name AS toCountry, v.points AS points
        `);
        return result.records.map((record) => ({
          year: neo4j.integer.toNumber(record.get('year')),
          round: record.get('round'),
          voteType: record.get('voteType'),
          fromCountry: record.get('fromCountry'),
          toCountry: record.get('toCountry'),
          points: neo4j.integer.toNumber(record.get('points')),
        }));
      } finally {
        await session.close();
      }
    },
  },
};

const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers, driver });

async function main() {
  // the schema is built asynchronously since @neo4j/graphql v3
  const schema = await neoSchema.getSchema();
  const server = new ApolloServer({ schema });

  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
  console.log(`🚀 GraphQL API ready at ${url}`);
}

main().catch(async (error) => {
  console.error(error);
  await driver.close();
  process.exit(1);
});
