const express = require('express');
const session = require('express-session');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function getCode() {
  const data = JSON.parse(fs.readFileSync('code.json'));
  return data.code;
}

function getHistory() {
  const data = JSON.parse(fs.readFileSync('code.json'));
  return data.history || [];
}

function setCode(newCode) {
  const data = JSON.parse(fs.readFileSync('code.json'));
  const history = data.history || [];
  if (data.code && data.code !== newCode) {
    history.unshift(data.code);
    if (history.length > 10) history.pop();
  }
  fs.writeFileSync('code.json', JSON.stringify({ code: newCode, history }));
}

app.get('/', (req, res) => {
  res.send(`<h1>Burma 2D: ${getCode()}</h1>`);
});

app.get('/admin', (req, res) => {
  if (req.session.authenticated) {
    res.render('admin', { code: getCode(), history: getHistory() });
  } else {
    res.send(\`
      <form method="post" action="/login">
        <input name="user" placeholder="Username" />
        <input name="pass" type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    \`);
  }
});

app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === 'admin' && pass === 'password') {
    req.session.authenticated = true;
    res.redirect('/admin');
  } else {
    res.send('Login failed');
  }
});

app.post('/update-code', (req, res) => {
  if (req.session.authenticated) {
    setCode(req.body.code);
    res.redirect('/admin');
  } else {
    res.status(403).send('Unauthorized');
  }
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));
