const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan("dev"));

const urlDatabase = {};
// const urlDatabase = {
//   b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
//   i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
// };

//object which stores and access users in the app
const users = {};
// const users = {
//   "userRandomID": {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "purple-monkey-dinosaur"
//   },
//  "user2RandomID": {
//     id: "user2RandomID",
//     email: "user2@example.com",
//     password: "dishwasher-funk"
//   }
// }

app.get("/", (req, res) => {
  if(req.cookies["user_id"]){
    res.redirect('/urls');
  }else{
    res.redirect('/login');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies["user_id"]),
    user: userLookUp(req.cookies["user_id"])
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if(!req.cookies["user_id"]){
    res.redirect('/login');
  }else{
     let templateVars = {user: userLookUp(req.cookies["user_id"])};
     res.render("urls_new", templateVars);
  }
});

//generate id for new URL which we receive from the form, then store them in urlDatabase
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id].longURL = req.body.longURL;
  urlDatabase[id].userID = req.cookies["user_id"];
  res.redirect('/urls/' + id);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies["user_id"]),
    shortURL: req.params.shortURL,
    user: userLookUp(req.cookies["user_id"])
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const newLongURL = req.body.newLongURL;
  urlDatabase[req.params.shortURL] = newLongURL;
  res.redirect("/urls");
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

//delete an url from urlDatabase
//then redirect client back to index page
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
})

//set a cookie named user_id to the value submitted in the request body via the login form.
// redirect the browser back to the /urls page
app.post("/login", (req, res) => {
  let id = emailExists(req.body.email);
    if(!id){
      res.status(403).send('E-mail cannot be found!');
    }else{
      if(req.body.password !== users[id].password){
        res.status(403).send('Invalid password!');
      }
      res.cookie('user_id', id);
      res.redirect('/urls')
     }
  });

app.get("/login", (req, res) => {
  let templateVars = {user: userLookUp(req.cookies["user_id"])};
  res.render("login", templateVars);
})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  let templateVars = {user: userLookUp(req.cookies["user_id"])};
  res.render("register", templateVars);
})

app.post("/register", (req, res) => {
  if(req.body.email === '' || req.body.password === '' || emailExists(req.body.email)){
    res.status(400).send('Bad Request');
  }else{
    const id = generateRandomString();
    users[id] = {};
    users[id].id = id;
    users[id].email = req.body.email;
    users[id].password = req.body.password;
    res.cookie("user_id", id);
    res.redirect('/urls');
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let result = '';
  const all = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for(var i = 0; i < 6; i++){
    result += all.charAt(Math.floor(Math.random() * all.length));
  }
  return result;
}

function emailExists(email){
  for(let id in users){
    if(email === users[id].email){
      return id;
    }
  }
  return;
}

function userLookUp(userID){
  for(let id in users){
    if(userID === id){
      return users[id];
    }
  }
}

function urlsForUser(id){
  const object = {};
  for(let shortURL in urlDatabase){
    if(urlDatabase[shortURL].userID === id){
      object[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return object;
}
