const roleMiddleware = (role) => (req, res, next) => {
  if (req.user && req.user.role === role) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: insufficient rights' });
  }
};

export default roleMiddleware;