const db = require('../DBConnect');
const cryptojs = require('crypto-js');
const bcrypt = require('bcrypt'); //package de hachage
const jwt = require('jsonwebtoken'); //package de sécurité de jetons (tokens) avec algo hmac
require('dotenv').config(); //variable d'environnement pour lire clé et valeur de .env

const sqlSignup = (email, username, password) => {
  return `INSERT INTO users  (email, username, password) VALUES ('${email}', '${username}', '${password}')`
};

const sqlLogin = (email) => {
  return `SELECT * FROM users WHERE email = '${email}'`
};

const sqlUpdateProfile = (email, username, password, id) => {
  return `UPDATE users SET email = '${email}', username = '${username}', password = '${password}' WHERE id= '${id}'`
};

const sqlDeleteProfile = (id) => {
  return `DELETE FROM users WHERE id = '${id}'`
};

const sqlGetUserInfos = (id) => {
  return `SELECT * FROM users WHERE id = '${id}'`
};

// fonction pour s'inscire
exports.signup = (req, res, next) => {

  bcrypt.hash(req.body.password, 10, function(err, hash) {

      if (err) throw err;

      const signup = sqlSignup (
          cryptojs.HmacSHA512(req.body.email, process.env.MAIL_SECRET_KEY).toString(),
          req.body.username,
          hash,
      );

      console.log(signup)

       db.query(
         signup, 
         function (err) {
           if (err) throw err;
        });

      res.status(201).json({ 
        message: "Enregistrement confirmé",
        username: req.body.username })
    });
};

//se connecter
exports.login = (req, res, next) => {

  const login = sqlLogin (
      cryptojs.HmacSHA512(req.body.email, process.env.MAIL_SECRET_KEY).toString()
  );
  
  console.log(login)
  
  db.query(
      login,
      req.body.email,
      (err, result) => {
          if (err) throw err;
          if (!req.body.password) {
              return res.status(401).json({ message: 'Veuillez entrer un mot de passe.' })
          }
          bcrypt.compare(req.body.password, result[0].password)
          .then(valid => {
              if (!valid) {
                  return res.status(401).json({ message: 'Mot de passe incorrect.' })
              };
              res.status(200).json({
                userId: result[0].id,
                username: result[0].username,
                email: result[0].email,
                token: jwt.sign(
                    {userToken: result[0].id},
                    process.env.TOKEN,
                    {expiresIn: '24h'},
                    ),
                photoProfil: 'https://gem.ec-nantes.fr/wp-content/uploads/2019/01/profil-vide.png'
                  });
                })
                .catch(error => res.status(500).json({ error }));
              })
            }

exports.updateProfile = (req, res, next) => {
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    
    if (err) throw err;
    
    const updateProfile = sqlUpdateProfile(
      cryptojs.HmacSHA512(req.body.email, process.env.MAIL_SECRET_KEY).toString(),
      req.body.username,
      hash,
      req.body.id
  );
  
  console.log(updateProfile);
  
  db.query(
          updateProfile,
          function(error) {
              if (error) throw error;
          },
          console.log(updateProfile)
      )
      res.status(201).json({ message: 'Modification confirmée' })
    })
  };

exports.deleteProfile = (req, res, next) => {

  const deleteProfile = sqlDeleteProfile(
      req.params.id
  );

  db.query(
    deleteProfile,
    function(error, result) {
      if (error) throw error;
      if (result) {
        console.log(result)
        }
      res.status(200).json({
        message: 'Compte supprimé',
      })
    }
  )
};

exports.getUserInfos = (req, res, next) => {
  
  const getUserInfos = sqlGetUserInfos(
    req.params.id
  );

  // console.log(getUserInfos)
  
  db.query(
    getUserInfos,
    function(error, result) {
      if (error) throw error;
      if (result) {
        // console.log(result[0].username)
        }
      res.status(200).json({
        message: 'Acces au profil',
        infos: {
          username: result[0].username,
        }
      })
    }
  )
};
