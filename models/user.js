var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");
var userschema=new mongoose.Schema({
    username:String,
    password:String,
    email:String,
    emailToken:String,
    isVerified:Boolean
});
userschema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",userschema);