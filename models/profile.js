var mongoose=require("mongoose");
var infoschema= new mongoose.Schema({
 name: String,
 age: Number,
 image: String,
 gender:String,
 city:String,
author:{
 id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
},

 comments: [
  {
   type: mongoose.Schema.Types.ObjectId,
   ref: "Comment"
  }],
  images:[
   {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Photo"
   }
   ]
});
var Profile=mongoose.model("Profile",infoschema);
module.exports=Profile;