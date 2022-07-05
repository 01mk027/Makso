module.exports = (req, res, next) => {
  if(!req.session.isUser)
  {
    res.redirect('/login');
  }
  next();
};
