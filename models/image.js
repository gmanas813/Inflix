  
var mongoose=require("mongoose");
var imageschema = new mongoose.Schema({
    url:String
});
module.exports=mongoose.model("Photo",imageschema);