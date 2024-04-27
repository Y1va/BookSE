// Import necessary modules and files
const { User } = require('../models/User');
const { signToken, AuthenticationError } = require('../utils/auth');

// Define resolvers for GraphQL schema
const resolvers = {
  Query: {
    // Resolver for the 'me' query
    me: async (parent, args, context) => {
      // Check if the user is authenticated
      if (context.user) {
        // Fetch user data from database
        const userData = await User.findOne({ _id: context.user._id })
          .select('-_v -password') // Exclude version and password fields
          .populate('books'); // Populate books field with associated documents

        // Return the user data
        return userData;
      }
      // Throw an authentication error if the user is not authenticated
      throw new AuthenticationError('You must be logged in!');
    }
  },

  Mutation: {
    // Resolver for the login mutation
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('Incorrect login credentials!');
      }

      // Check if provided password is correct
      const correctPW = await user.isCorrectPassword(password);
      // If password is incorrect throw an authentication error
      if (!correctPW) {
        throw new AuthenticationError('Incorrect login credentials!');
      }

      // Generate JWT token for the user
      const token = signToken(user);
      // Return token and user data
      return { token, user };
    },

    // Resolver for adduser mutation
    addUser: async (parent, args) => {
      // Create new user in the database
      const user = await User.create(args);
      // Generate JWT token for the new user
      const token = signToken(user);

      return { token, user };
    },
    // Resolver for the 'saveBook' mutation
    saveBook: async (parent, { bookData }, context) => {
      // Check if user is authenticated
      if (context.user) {
        // Add the book data to the user's savedBooks array
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id }, // Find user by ID
          { $addToSet: { savedBooks: bookData } }, // Add bookData to savedBooks array
          { new: true } // Return updated user document
        ).populate('books'); // Populate books field with associated documents
        return updatedUser; // Return updated user data
      }
      // Throw an AuthenticationError if user is not authenticated
      throw new AuthenticationError('You must be logged in to save books!');
    },

    // Resolver for the 'removeBook' mutation
    removeBook: async (parent, { bookId }, context) => {
      // Check if user is authenticated
      if (context.user) {
        // Remove the book with the specified ID from the user's savedBooks array
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id }, // Find user by ID
          { $pull: { savedBooks: { bookId } } }, // Remove book with specified ID from savedBooks array
          { new: true } // Return updated user document
        );
        return updatedUser; // Return updated user data
      }
      // Throw an AuthenticationError if user is not authenticated
      throw new AuthenticationError('You must be logged in to delete books!');
    }
  }
};

// Export resolvers to be used with GraphQL schema and Apollo Server
module.exports = resolvers;
