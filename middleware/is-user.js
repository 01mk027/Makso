module.exports = (req, res, next) => {
  if(!req.session.isUser && !req.session.isAdmin)
  {
    res.redirect('/login');
  }
  else if(req.session.isAdmin)
  {
    req.flash("unauthorizedPassAdmin", "Müşteri değilsiniz!");
    res.redirect('/admin/admin-dashboard');
    return;
  }
  next();
}
