const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// this is the "middleware" that does all of our helpful, colorful logging of requests
// middleware is like a mini-endpoint that gets hit JUST BEFORE a real endpoint gets hit. It has access to the request data. It's good for google analytics, logging, and many other useful tasks
// middleware intercepts requests, examines requests, and manipulates requests to prepare them for REAL endpoints
// middleware is completely backend, frontend doesn't ever deal with it
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/todos', async(req, res) => {
  try {
    const data = await client.query('SELECT * from todos WHERE owner_id=$1', 
      [req.userId]);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/todos/:id', async(req, res) => {
  try {
    const data = await client.query(`UPDATE todos
    SET completed = true
    WHERE id = $1
    AND owner_id = $2;`, 
    [req.params.id, req.userId]);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/todos', async(req, res) => {
  try {
    const data = await client.query(`
      INSERT INTO todos (todo, completed, owner_id)
      VALUES ($1, $2, $3)
    `, [
      // comes from user input
      // don't forget to add .body before all values
      req.body.todo, 
      // comes from user input
      req.body.completed, 
      // comes from THE TOKEN!!!WOOOOOW
      // it comes from deep inside the middleware, and it will make sure that whatever todo is created will only be seen by the user that has the matching Id! ヾ(｡･ω･)ｼ
      req.userId]);
    // safe assumption:
    // if you pass a token to a protected route, you will have a req.userId in the endpoint (๑•̀ㅂ•́)و✧
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
