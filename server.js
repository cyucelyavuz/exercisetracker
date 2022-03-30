const express = require('express');
const app = express();
const cors = require('cors');
const mongoose= require('mongoose');
const bodyparser = require('body-parser');
const res = require('express/lib/response');



require('dotenv').config()


app.use(cors())
app.use(express.static('public'))
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());

//Mongoose 
main().catch(err => console.log(err));
async function main () {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("connected to MongoDB");
}
const userSchema = new mongoose.Schema({
  username:{ type: String, required: true, unique: false },
  exercises: [
    {
      description: { type: String },
      duration: { type: Number },
      date: { type: String, required: false }
    }
  ]
});
/*const exerciseSchema = new mongoose.Schema({
  username:String,
  userid:String,
  description:String,
  duration:Number,
  date:String
});*/

const User = new mongoose.model('User', userSchema );
//const Exercise = new mongoose.model('Exercise', exerciseSchema); 


//Interface
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//POST user
app.post('/api/users', async (req,res)=>{
  const newUser=req.body.username;
  console.log("creating user:\n"+newUser);
  try{
    let userCheck = await User.findOne({username:newUser});
    if(userCheck) {
      console.log("user already exists");
      res.json({error:"user already exists"});  
    } else {
      userCheck = new User ({username:newUser});
      await userCheck.save();
      res.json({username:userCheck.username, _id:userCheck._id});
    }
  }catch (err) {console.log(err);
  res.json({error:"server error"});}
});

//GET users
app.get('/api/users', async (req,res)=>{
  const allUsers= await User.find();
  res.json(allUsers.map(elem =>({username:elem.username,_id:elem._id})));
});

//POST activity
app.post('/api/users/:id/exercises', async (req,res)=>{
  let date;
  if (req.body.date){
    date=new Date(req.body.date.replace(/-/g, ", ")).toDateString();
  } else date = new Date().toDateString();

  const activity = {
    description:req.body.description,
    duration:Number(req.body.duration),
    date:date
  }

  const userId = req.params.id || req.body._id;
 

  try {
      User.findByIdAndUpdate(userId,
        {$push: { exercices: activity } }, 
        {new: true},
        (err,updatedUser)=>{
        if (err) res.json({error:"error updating user"+"\n"+err});
        else {
          let returnObj = {
            _id: updatedUser.id,
            username: updatedUser.username,
            description: activity.description,
            duration: activity.duration,
            date: activity.date
          };
          res.json(returnObj);
        } 
      });
  }catch (err) {
    console.log(err);
    res.json({error:err});
  }
});

//GET user log
app.get('/api/users/:id/logs', async (req,res)=>{
  const userId = req.params.id || req.body._id;
  let userToLog;
  try{
    await User.findById(userId, (err,user)=>{
      if (err) {
        console.log("unable to find log user");
        res.json({error:"unable to find log user"});
      } else userToLog=user;
    })
  }catch (err){console.log(err)};

  console.log(userToLog);
});  



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
