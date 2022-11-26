import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

// assumes that User was registered in `./db.mjs`
const User = mongoose.model('User')
const db = mongoose.connection

const startAuthenticatedSession = (req, user, cb) => {
  req.session.regenerate((err) => {
    if (!err) {
      req.session.user = user
    } else {
      console.log(err)
    }
    cb(user, err)
  })
}

function endAuthenticatedSession(req, cb) {
  req.session.destroy((err) => { cb(err); })
}

const register = (username, email, password, errorCallback, successCallback) => {
  let salt = bcrypt.genSaltSync(10)
  let passwordHash = bcrypt.hashSync(password, salt)
  if (password.length < 8 || username.length < 8) {
    let errObj = {message: "USERNAME PASSWORD TOO SHORT", error: ''}
    errorCallback(errObj)
  } else {
    try {
      let newUser = new User({ username, email, passwordHash})
      newUser.save((err, book) => {
        if (err) {
          let errObj = {message: "USERNAME ALREADY EXISTS", error: err}
          errorCallback(errObj)
        } else {
          successCallback(newUser)
        }})
    } catch (err) {
      let errObj = {message: "USERNAME ALREADY EXISTS", error: err}
      errorCallback(errObj)
    }
  }
}
 
const login = (username, password, errorCallback, successCallback) => {
  User.findOne({username: username}, (err, user) => {
    if (err) {
      errorCallback("USER NOT FOUND")
    } else if (user) {
      bcrypt.compare(password, user.passwordHash).then(function(result) {
        if (result) {
          successCallback(user)
        } else {
          errorCallback("PASSWORDS DO NOT MATCH")
        }
      })
    } else {
      errorCallback("USER NOT FOUND")
    } 
  })
}

// creates middleware that redirects to login if path is included in authRequiredPaths
const authRequired = authRequiredPaths => {
  return (req, res, next) => {
    if(authRequiredPaths.includes(req.path)) {
      if(!req.session.user) {
        res.redirect('/login') 
      } else {
        next() 
      }
    } else {
      next()
    }
  }
}

export {
  startAuthenticatedSession,
  endAuthenticatedSession,
  register,
  login,
  authRequired
}
