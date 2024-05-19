const { ApolloServer } = require('apollo-server');
const { Neo4jGraphQL } = require('@neo4j/graphql');
const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

const driver = neo4j.driver('bolt://neo4j:7687');
const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const server = new ApolloServer({
  schema: neoSchema.schema,
  context: { driver },
});

server.listen().then(({ url }) => {
  console.log(`🚀 GraphQL API ready at ${url}`);
});