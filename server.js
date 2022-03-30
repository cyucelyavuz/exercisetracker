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
  exercises: []
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
  let exercisedUser;
  try{
    exercisedUser= await User.findById(userId);
  }catch(err){console.log(err)}
  console.log("adding activity to"+exercisedUser._id+"\n"+activity.description+" "+activity.date);
  exercisedUser.exercises.push(activity);
  try{
    await exercisedUser.save();
  }catch(err){console.log(err)}
  let returnObj ={
    _id: exercisedUser.id,
    username: exercisedUser.username,
    description: activity.description,
    duration: activity.duration,
    date: activity.date
  }
  res.json(returnObj);
});

//GET user log
app.get('/api/users/:id/logs/', async (req,res)=>{
  const userId = req.params.id || req.body._id;
  console.log(userId);

  let userToLog;
  try{
    userToLog = await User.findById(userId);
  }catch (err){console.log(err)};

  console.log(userToLog);

  let log = [...userToLog.exercises];
  let from;
  let to;
  let limit;
  /*if (req.query.from) {
    console.log("query present");
    from = new Date(req.query.from.replace(/-/g, ", "));
    to = new Date(req.query.to.replace(/-/g, ", "));
    limit = req.query.limit;
    log=log.filter(elem => {
      if ( (new Date(elem.date)>=from) && (new Date(elem.date)<=to)) return true; 
    });
    
    

  };
  if (req.query.limit) log=log.slice(0,limit);*/
  
  

  let returnObj ={
    _id:userToLog.id,
    username: userToLog.username,
    count:userToLog.exercises.length,
    log: log
  }
  if(req.query.from) {
    from = new Date(req.query.from.replace(/-/g, ", "));
    returnObj.from=from.toDateString();
    returnObj.log=returnObj.log.filter(elem => (new Date(elem.date)>=from));
    
  }

  if(req.query.to) {
    to = new Date(req.query.to.replace(/-/g, ", "));
    returnObj.to=to.toDateString();
    returnObj.log=returnObj.log.filter(elem=> (to>= new Date(elem.date)));
  }
  if(req.query.limit) {
    returnObj.limit=req.query.limit;
    returnObj.log=returnObj.log.slice(0,req.query.limit);
  }

  
  console.log(returnObj);
  res.json(returnObj);
});  



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
