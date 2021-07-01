const jwt = require('./jwt');

// this is our auth middleware. It checks to make sure there is a token. If there is, it verifies that the token is legit
module.exports = function checkAuth(req, res, next) {
// for every request that this middleware intercepts, go check for a token in the header called Authorization
  const token = req.get('Authorization');
  // if there is no token
  if(!token) {
    // respond with a 401 (unauthorized), and also shoot back an error messager
    res.status(401).json({ error: 'no authorization found' });
    return;
  }

  let payload = null;
  try {
    // verify the token using JWT software ╰(•̀ 3 •́)━☆ﾟ.*･｡ﾟ cryptography magic! ooooo!!
    // checks to make sure ╰(•̀ 3 •́)━☆ﾟ.*･｡ﾟ the token is legit
    // if it is, it will also have a payload. That payload will have the user id on it
    payload = jwt.verify(token);
  }
  catch(err) {
    // this code runs with verify fails
    // if the token FAILS verification, shoot back a 401 again
    res.status(401).json({ error: 'invalid token' });
    return;
  }

  // take that user id and put it onto the request object, so that the endpoint will have access to this user id
  req.userId = payload.id;
  // why does the endpoint want a USER id? why is that useful? When making SQL queries, we will use this ID so that users only see their OWN TODOs and nobody else's
  next();
};
