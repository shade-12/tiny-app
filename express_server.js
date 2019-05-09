const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["pizza"]
}));
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
  if(req.session["user_id"]){
    res.redirect("/urls");
  }else{
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: userLookUp(req.session.user_id)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login");
  }else{
     let templateVars = {user: userLookUp(req.session.user_id)};
     res.render("urls_new", templateVars);
  }
});

//generate id for new URL which we receive from the form, then store them in urlDatabase
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id].longURL = req.body.longURL;
  urlDatabase[id].userID = req.session.user_id;
  res.redirect('/urls/' + id);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    shortURL: req.params.shortURL,
    user: userLookUp(req.session.user_id),
    allURLs: urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  if(req.session.user_id){
    const newLongURL = req.body.newLongURL;
    urlDatabase[req.params.shortURL].longURL = newLongURL;
    res.redirect("/urls");
  }else{
    res.redirect("/login");
  }
})

//short URL can be accessed by anyone, even if users are not logged in
app.get("/u/:shortURL", (req, res) => {
  const shorturl = req.params.shortURL;
  let count = 0;
  for(let id in urlDatabase){
    if(id === shorturl){
      const longurl = urlDatabase[id].longURL;
      res.redirect(longurl);
    }
  }
    res.send("<h1>Can't find what you are looking for :|</h1>");
})

//delete an url from urlDatabase
//then redirect client back to index page
app.post("/urls/:shortURL/delete", (req, res) => {
  if(req.session.user_id){
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }else{
    res.redirect("/login");
  }
})

//set a cookie named user_id to the value submitted in the request body via the login form.
// redirect the browser back to the /urls page
app.post("/login", (req, res) => {
  let id = emailExists(req.body.email);
    if(!id){
      res.status(403).send("<h1>E-mail cannot be found :|</h1>");
    }else{
      if(!bcrypt.compareSync(req.body.password, users[id].password)){
        res.status(403).send("<h1>Invalid password :|</h1>");
      }
      req.session.user_id = id;
      res.redirect("/urls");
     }
  });

app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls");
  }else{
    let templateVars = {user: userLookUp(req.session.user_id)};
    res.render("login", templateVars);
  }
})

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls");
  }else{
  let templateVars = {user: userLookUp(req.session.user_id)};
  res.render("register", templateVars);
  }
})

app.post("/register", (req, res) => {
  if(req.body.email === "" || req.body.password === "" || emailExists(req.body.email)){
    if(emailExists(req.body.email)){
      res.status(400).send("<h2>Error 400 :|<h2><p><h4>You already had an account :|</h4></p>");
    }else{
      res.status(400).send("<h2>Error 400 :|<h2><p><h4>Don't leave any of the field blank! That's not FUNNY :|</h4></p>");
    }
  }else{
    const id = generateRandomString();
    users[id] = {};
    users[id].id = id;
    users[id].email = req.body.email;
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[id].password = hashedPassword;
    req.session.user_id = id;
    res.redirect("/urls");
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let result = "";
  const all = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
