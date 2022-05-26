const express = require('express');
// express js now has its own json decoder
// const bodyParser = require('body-parser') // Decode json to have sucessful requests!!

// hashing passwords
const bcrypt = require('bcrypt');
const saltRounds = 10;

// verify api requests to avoid attacks
const cors = require('cors')

// query builder for databases
const knex = require('knex');
const { database } = require('pg/lib/defaults');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1', // CHANGES!!
      user : 'interactor', // CHANGES!!
      password : 'hi',  // CHANGES!!
      database : 'facerecognition-db' // CHANGES!!
    }
  });

const app = express();

app.use(express.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send(database.users);
})

// Instead of send use json when returning requests
app.post('/signin', (req, res) => {
    // sql manipulation
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        // check the password against the hash
        .then(data => {
        const isValid = bcrypt.compare(req.body.password, data[0].hash);
        if (isValid) {
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong credentials')
        }
        })
        .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password, saltRounds);

///  For testing purporses ///
//     db('users')
//     .returning('*')
//     .insert({
//         email:email,
//         name: name,
//         joined: new Date()
//     }).then(response =>{
//         res.json(response);
//     })
// })

      db.transaction(trx => {
        trx.insert({
          hash: hash,
          email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx('users')
            .returning('*')
            .insert({
              email: loginEmail[0].email,
              name: name,
              joined: new Date()
            })
            .then(user => {
              res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
      })
      .catch(err => res.status(400).json('unable to register'))
  })

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    database.users.forEach(user => {
        if (user.id === id) {
            res.json(user);
            found = true;
            return res.json(user.entries)
        } if (!found) {
            res.status(400).json(`User not found`);
        }
    })
    
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    let found = false;
    database.users.forEach(user => {
        if (user.id === id) {
            found = true
            user.entries++
        }
    })
    if (!found) {
        res.status(400).json('not found');
    }
})

app.listen(3000, ()=> {
    console.log("app is running on port 3000");
})




/*
Overview of what to do
--> res = this is working
--> signin --> POST = success/fail
--> register --> POST = user
--> profile/:userId --> GET = user
--> image --> PUT --> user
*/