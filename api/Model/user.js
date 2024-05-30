const mongoose = require('mongoose');

const userSchema=mongoose.Schema({
    username:{type:String,unique:true},
    password:String,
},{timestamp:true});

const userModel= mongoose.model("user",userSchema);
 module.exports=userModel;
 
