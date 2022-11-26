import './db.mjs';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import path from 'path';
import url from 'url';
import * as auth from './auth.mjs';
import slugify from 'slugify'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

const Article = mongoose.model('Article');

const loginMessages = {"PASSWORDS DO NOT MATCH": 'Incorrect password', "USER NOT FOUND": 'User doesn\'t exist'};
const registrationMessages = {"USERNAME ALREADY EXISTS": "Username already exists", "USERNAME PASSWORD TOO SHORT": "Username or password is too short"};

///////////////////////
// CUSTOM MIDDLEWARE //
///////////////////////

// require authenticated user for /article/add path
app.use(auth.authRequired(['/article/add']));

// make {{user}} variable available for all paths
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// logging
app.use((req, res, next) => {
  console.log(req.method, req.path, req.body);
  next();
});

////////////////////
// ROUTE HANDLERS //
////////////////////
app.get('/', (req, res) => {
  Article.find({}).sort('-createdAt').exec((err, articles) => {
    res.render('index', {user: req.session.user, home: true, articles: articles});
  })
})

app.get('/article/add', (req, res) => {
  res.render('article-add');
})

app.post('/article/add', (req, res) => {
  let newArticle = new Article({title:req.body.title, url:req.body.url, description:req.body.description, author:req.session.user.username, slug:slugify(req.body.title)})
  newArticle.save((err, book) => {
    if (err) {
      console.log("error saving article")
    } else {
      res.redirect("/")
    }
  })
})

app.get('/article/:slug', (req, res) => {
  Article.find({}).sort('-createdAt').exec((err, articles) => {
    if (err) {
      console.log(err)
    } else {
      articles.forEach((article) => {
        if (article.slug === req.params.slug) {
          res.render('article-detail', {article: article})
        }
      })
    }
  })
})

app.get('/register', (req, res) => {
  res.render('register');
})

app.post('/register', (req, res) => {
  // setup callbacks for register success and error
  function success(newUser) {
    auth.startAuthenticatedSession(req, newUser, (user, err) => {
        if (!err) {
            res.redirect('/');
        } else {
            console.log(err)
            res.render('error', {message: 'err authing???'}); 
        }
    })
  }

  function error(err) {
    res.render('register', {message: registrationMessages[err.message] ?? 'Registration error'}); 
  }

  // attempt to register new user
  auth.register(req.body.username, req.body.email, req.body.password, error, success);
})
        
app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {
  // setup callbacks for login success and error
  function success(user) {
    auth.startAuthenticatedSession(req, user, (user, err) => {
      if(!err) {
        res.redirect('/')
      } else {
        req.setStatus(500)
        res.render('error', {message: 'error starting auth sess: ' + err}); 
      }
    })
  }

  function error(errMsg) {
    res.render('login', {message: loginMessages[errMsg] || 'Login unsuccessful'}); 
  }

  // attempt to login
  auth.login(req.body.username, req.body.password, error, success);
})

app.listen(9999, () => {
  console.log("app is listening")
})
