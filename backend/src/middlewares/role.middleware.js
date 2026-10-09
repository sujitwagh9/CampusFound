import { User } from '../models/user.model.js';

// Checks the role stored in the database rather than the one in the token, so
// demoting or deleting a user takes effect immediately.
const roleMiddleware = (role) => async (req, res, next) => {
  const user = req.user && (await User.findById(req.user.id, 'role'));
  if (user?.role === role) {
    req.user.role = user.role;
    return next();
  }
  res.status(403).json({ message: 'Forbidden: insufficient rights' });
};

export default roleMiddleware;
