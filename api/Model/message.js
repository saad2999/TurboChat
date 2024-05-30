const mongoose = require('mongoose');

const MessageSchema=mongoose.Schema({
    sender:{type:mongoose.Schema.Types.ObjectId,ref:'user'},
    recipient:{type:mongoose.Schema.Types.ObjectId,ref:'user'},
    text:String,
    file:String,
},{timestamp:true});

const MessageModel= mongoose.model("Message",MessageSchema);
 module.exports=MessageModel;