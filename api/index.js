const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userModel = require('./Model/user');
const jwt = require('jsonwebtoken');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const ws= require('ws');
const MessageModel = require('./Model/message');
fs=require('fs')



dotenv.config();
const jwtSecret = process.env.jwt_secret;
mongoose.connect(process.env.mongo_uri);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.client_url);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(cors({ origin: process.env.client_url, credentials: true }));
app.use(express.json()); 
app.use(cookieParser());
async function getUserDataFromRequest(req)
{
   return new Promise((resolve, reject) => {
    const token = req.cookies.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userdata) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      resolve(userdata);
    });
  }
  else {
    reject('no token');
  }

  
  })
  
}

app.get('/test', (req, res) => {
  res.send('test here!');
});
app.get('/people', async (req, res) => {
  const users=await userModel.find({},{_id:true,username:true});
  res.json(users);
});

app.get('/messages/:userId',async (req,res) =>{
  const {userId}=req.params;
  const userdata= await getUserDataFromRequest(req);
  const ourUserId=userdata.userId;
  const messages=await MessageModel.find(
    {
      sender:{$in:[ourUserId,userId]},
      recipient:{$in:[ourUserId,userId]}
    }
  ).sort({createdAt:1})
  res.json(messages);
}) ;

app.get('/profile', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Token missing or invalid' });
  }

  jwt.verify(token, jwtSecret, {}, (err, userdata) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.json(userdata);
  });
});


app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if the user already exists
    const existingUser = await userModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
  
   
    bcrypt.genSalt(10,function(err,salt){
      bcrypt.hash(password,salt,async (err,hash)=>{
        const newUser = await userModel.create({ username, password:hash });
          jwt.sign({ userId: newUser._id,username }, jwtSecret, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).status(201).json({ id: newUser._id });
          });
      })
  })

   
  
    
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.post('/login',async (req,res)=>{
  const {username,password}=req.body;
  let foundUser=await userModel.findOne({username});
  if(foundUser)
    {
    let passwordcompare=bcrypt.compareSync(password,foundUser.password)
    if(passwordcompare)
      {
        jwt.sign({ userId: foundUser._id,username }, jwtSecret, (err, token) => {
          if (err) throw err;
          res.cookie('token', token).status(201).json({ id: foundUser._id });
        });

      }
   }
})

app.post('/logout', (req, res) => {
  res.cookie('token', '').status(201).json('ok');});

const server=app.listen(3000);
const wss=new ws.WebSocketServer({server});
wss.on('connection',(connection,req)=>{

  function notifyAboutOnlinePeople()
  {
    [...wss.clients].forEach(client=>{
      client.send(JSON.stringify(
       { online: [...wss.clients].map(c=>({userId:c.userId,username: c.username}))}
  
      )
  
      );
  
    });
  
  }
  connection.isAlive=true
  connection.timer= setInterval(()=>{
    connection.ping()
    connection.deathTimer=setTimeout(()=>{
      connection.isAlive=false;
      clearInterval(connection.timer)
      connection.terminate()
      notifyAboutOnlinePeople()
    },1000)
  },5000);

  connection.on('pong',()=>{
    clearTimeout(connection.deathTimer)
  })

  const cookies=req.headers.cookie;
  const tokencookiestr=cookies.split(';').find(str=>str.startsWith("token="));
  const token=tokencookiestr.split('=')[1];
  if(token)
    {
      jwt.verify(token, jwtSecret, {}, (err, userdata) => {
        if (err) {
          return res.status(401).json({ message: 'Invalid token' });
        }
        const {userId,username}=userdata;
        connection.username=username;
        connection.userId=userId;
      });
    }
    connection.on('message',async (message)=>{
     const messagedata=JSON.parse(message.toString())
      const {to,text,file}=messagedata;
      if(file)
        {
          const parts=file.name.split('.')
          const ext=parts[parts.length-1];
          const filename=Date.now()+'.'+ext;
          const path=__dirname+'/uploads/'+filename;
          const buffer =new Buffer(file.data,'base64');
          fs.writeFileSync(path,buffer);
          

        }
      if (to && text) {
        const messageDoc= await MessageModel.create({
          sender:connection.userId,
          recipient:to,
          text
        });
        [...wss.clients].filter(c => c.userId === to)
          .forEach(c => c.send(JSON.stringify({ 
            text,
             sender:connection.userId,
             recipient:to,
             _id: messageDoc._id
            })));
      }
    });
    // notify online people
    notifyAboutOnlinePeople();
   
});
