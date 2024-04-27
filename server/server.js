const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const path = require('path');
const { authMiddleware } = require('./utils/auth');

// Import GraphQL schema and database connection
const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');

const PORT = process.env.PORT || 3001;
const app = express();

// Create apollo server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Async function to start Apollo Server
const startApolloServer = async () => {
  await server.start();
  
  // Middleware for parsing requests
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  // Mount Apollo server GraphQL endpoint and apply authentication middleware
  app.use('/graphql', expressMiddleware(server), {
    context: authMiddleware
  });

  // if we're in production, serve client/dist as static assets
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  } 

  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
    });
  });
};

// Call the async function to start the apollo server
startApolloServer();
