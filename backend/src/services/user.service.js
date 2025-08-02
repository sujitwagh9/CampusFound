import { User } from '../models/user.model.js';

export const deleteUserService = async (userId) => {
  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    return deletedUser; // returns null if user not found
  } catch (error) {
    console.error('Error deleting user in service:', error);
    throw error;
  }
};
