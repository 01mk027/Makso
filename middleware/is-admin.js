module.exports = (req, res, next) => {
  if(!req.session.isUser && !req.session.isAdmin)
  {
    res.redirect('/login');
  }
  else if(req.session.isUser && !req.session.isAdmin)
  {
    req.flash("unauthorizedPass", "Admin değilsiniz!");
    res.redirect('/dashboard');
    return;
  }
  next();
}
