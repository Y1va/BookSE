const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      console.log(context.user);
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new Error('User not found');
    }
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if the password is correct
      const isCorrectPassword = await user.isCorrectPassword(password);
      console.log(!isCorrectPassword);
      // Throw error if password is incorrect
      if (!isCorrectPassword) {
        throw new Error('Incorrect Credentials');
      }

      // Sign a token for the user
      const token = signToken(user);
      return { token, user };
    },

    // Resolver for adding a new user
    addUser: async (parent, { username, email, password }) => {
      // Create a new user in the database
      const user = await User.create({
        username: username,
        email: email,
        password: password
      });

      // Sign a token for the new user
      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, { bookInput }, context) => {
      // Check if user exists in context
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: bookInput } },
          { new: true }
        );

        return updatedUser;
      }

      throw new Error('User not found');
    },

    // Resolver for removing a book from user's savedBooks array
    removeBook: async (parent, args, context) => {
      // Check if user exists in context
      if (context.user) {
        // Update the user's savedBooks array by removing a book
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: args } },
          { new: true }
        );

        return updatedUser;
      }

      throw new Error('User not found');
    }
  }
};

module.exports = resolvers;
