
var express=require("express");

var mongoose=require("mongoose");
var reqs=require("request");
mongoose.connect("mongodb://localhost/rockershocks5");
//mongoose.connect("mongodb+srv://rocko:rockalways@rockershock-ptdgc.mongodb.net/test?retryWrites=true&w=majority");
//mongoose.connect("mongodb+srv://rocko:rockalways@rockershock-ptdgc.mongodb.net/test?retryWrites=true&w=majority");
var methodoverride=require("method-override");
var flash=require("connect-flash");
var passport=require("passport");
var bodyparser=require("body-parser");
var User=require("./models/user.js");

var localStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var app=express();
var Profile=require("./models/profile.js");
var Comment=require("./models/comment.js");
var Photo=require("./models/image.js");
app.use(methodoverride("_method"));
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
app.use(require("express-session")({
    secret: "Rusty is the best and cutest dog in the world",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());
app.use(function(req, res, next){
 res.locals.message=req.flash("error");
 res.locals.success=req.flash("success");
   res.locals.currentUser = req.user;
   next();
});

 app.get("/",function(req,res){
     res.render("root.ejs");
 });
 
 const sgMail=require('@sendgrid/mail');
sgMail.setApiKey("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");
const crypto=require('crypto');
 
 app.get("/profiles",function(req,res){
  Profile.find({},function(err,user){
 if(err){
  console.log("errror");
 }
 else{
  res.render("profile/index.ejs",{user:user});
 }
 });
 });
 
  app.get("/profiles/new",isloggedin,function(req, res) {
     res.render("profile/new.ejs");
 });
 
 app.post("/profiles",isloggedin,function(req,res){
 var author={
  id:req.user._id,
  username:req.user.username
 };
 req.body.userd.author=author;
   Profile.create(req.body.userd,function(err,newuser){
   if(!err){
      res.redirect("/profiles");
   }
   else{
    res.send("sorry");
   }
  });
  });

app.get("/profiles/:idp",function(req, res) {
    Profile.findById(req.params.idp).populate("comments").populate("images").exec(function(err,found){
     if(err){
      console.log(err);
     }
     else{
      res.render("profile/show.ejs",{profile:found,currentuser:req.user});
     }
    });
});

app.get("/profiles/:id/edit",ifloggedin,function(req, res) {
    Profile.findById(req.params.id,function(err,found){
     if(err){
      console.log(err);
     }
     else{
      res.render("profile/edit.ejs",{profile:found});
     }
    });
});

app.put("/profiles/:id",ifloggedin,function(req,res){
 Profile.findByIdAndUpdate(req.params.id,req.body.user,function(err,found){
  if(err){
      console.log(err);
     }
     else {
      res.redirect("/profiles/"+req.params.id);
     }
 });
});
   
   app.delete("/profiles/:id",ifloggedin,function(req,res){
    Profile.findByIdAndRemove(req.params.id,function(err){
      if(err){
      console.log(err);
     }
     else{
      res.redirect("/profiles");
     }
    });
   });
   
   
  app.get("/register",function(req, res) {
       res.render("user/register.ejs");
   });
   
   app.post("/register",async function(req,res){
  var newUser = new User({
   username: req.body.username,
   email:req.body.email,
   emailToken: crypto.randomBytes(64).toString('hex'),
   isVerified: false
  });
    User.register(newUser, req.body.password,async function(err, user){
        if(err){
            console.log(err);
            return res.render("user/register.ejs");
        }
        // passport.authenticate("local")(req, res, function(){
        //  req.flash("success","Successfully Registered!");
        //    res.redirect("/"); 
        // });
      const msg={
       from:'manasgupta318@gmail.com',
       to:user.email,
       subject:'Verification',
       text:`
       verify http://${req.headers.host}/verify-email?token=${user.emailToken}
       `,
     	html: `
                 <h1>Hello, </h1>
                 <p>Thanks for registering on our site Inflix. </p>
                 <p>Please Click the link below to verify your account. </p>
                 <a href="https://${req.headers.host}/verify-email?token=${user.emailToken}">Verify Your Account </a>
            `
      }
			
		
		try{
			await sgMail.send(msg);
			req.flash('success', 'Thanks for registering. Please check your email to verify your account.')
			res.redirect('/');
		}catch(error){
			console.log(error);
			req.flash('error',' Something went wrong. Please contact manasgupta318@gmail.com');
			
		}
       
        
    });
   });
   
   app.get('/verify-email',async(req,res,next)=>{
	try{
		const user=await User.findOne({emailToken:req.query.token});
		if(!user){
			req.flash('error','Token is invalid. Please contact the admin');
			return res.redirect('/');
			
		}
		user.emailToken=null;
		user.isVerified=true;
		await user.save();
		await req.login(user,async(err)=>{
			if(err) return next(err);
			req.flash('success',`Welcome to Inflix ${user.username}`);
			const redirectUrl='/profiles';
			delete req.session.redirectTo;
			res.redirect(redirectUrl);
			
		});
	}catch(error){
		console.log(error);
		req.flash('error','Token is invalid. Please contact the admin');
		res.redirect('/');
		
	}
});
   
   app.get("/login",function(req, res) {
       res.render("user/login.ejs");
   });
   
   app.post("/login",isNotVerified,passport.authenticate("local",{
    successRedirect : "/",
    failureRedirect : "/login"
   }),function(req,res){
    req.flash("success","Logged In Successfully!");
  });
  
  app.get("/logout",isloggedin,function(req,res){
   req.logout();
   res.redirect("/");
  }) ;



   //comment
   
   app.get("/profiles/:id/comments/new",isloggedin,function(req, res) {
       Profile.findById(req.params.id,function(err,found){
        if(!err){
         res.render("comment/new.ejs",{profile:found});
        }
       });
   });
   
   app.post("/profiles/:id/comments",isloggedin,function(req, res) {
       Profile.findById(req.params.id,function(err, found) {
           if(!err){
            Comment.create(req.body.comment,function(er,comment){
             if(!er){
              comment.author.id=req.user._id;
                 comment.author.username=req.user.username;
                 comment.save();
              found.comments.push(comment);
               found.save();
               res.redirect("/profiles/"+found._id);
             }
             else{
              res.redirect("/profiles");
             }
            });
           }
       });
   });
   
   app.get("/profiles/:id/comments/:comment_id/edit",ifloggedinn,function(req, res) {
    Comment.findById(req.params.comment_id,function(err,found){
     if(!err){
      res.render("comment/edit.ejs",{ profile_id:req.params.id,comment:found });
     }
    });
       
   });
   
   app.put("/profiles/:id/comments/:comment_id",ifloggedinn,function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updated){
     if(!err){
      res.redirect("/profiles/"+req.params.id);
     }
    });
   });
   
   app.delete("/profiles/:id/comments/:comment_id",ifloggedinn,function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id,function(err){
     if(!err){
      res.redirect("/profiles/"+req.params.id);
     }
    });
   });
   app.get("/searchh",function(req, res) {
      res.render("api/searchh.ejs"); 
   });
   
     app.get("/search",function(req,res){
res.render("api/search.ejs");

});

app.get("/results",function(req,res){
var movie=req.query.movie;
   reqs("http://www.omdbapi.com/?apikey=thewdb&s="+movie,function(error,response,body){
       if(!error&&response.statusCode==200){
       var parseddata=JSON.parse(body);
       
           res.render("api/results.ejs",{data: parseddata});
          
       }
   }) ;
});

app.get("/profiles/:id/images/new",function(req,res){
Profile.findById(req.params.id,function(err,found){
        if(!err){
         res.render("image/new.ejs",{profile:found});
        }
       });
});

   app.post("/profiles/:id/image",function(req, res) {
       Profile.findById(req.params.id,function(err, found) {
           if(!err){
            Photo.create(req.body.image,function(er,image){
             if(!er){
              
              found.images.push(image);
               found.save();
               res.redirect("/profiles/"+found._id);
             }
             else{
              res.redirect("/profiles");
             }
            });
           }
       });
   });
   
   function ifloggedin(req,res,next){
    if(req.isAuthenticated()){
     Profile.findById(req.params.id,function(err, found) {
         if(!err){
          if(found.author.id.equals(req.user._id)){
           next();
           req.flash("success","Done!");
          }
          else{
           req.flash("error","You cant do this");
           res.redirect("/profiles");
          }
         }
     });
    }
    else{
     req.flash("error","Please Login First");
     res.redirect("/profiles");
    }
   }
   
     function ifloggedinn(req,res,next){
    if(req.isAuthenticated()){
     Comment.findById(req.params.comment_id,function(err, found) {
         if(!err){
          if(found.author.id.equals(req.user._id)){
           next();
           req.flash("success","Done!");
          }
          else{
           req.flash("error","You cant do this");
           res.redirect("/profiles");
          }
         }
     });
    }
    else{
     req.flash("error","Please Login First");
     res.redirect("/profiles");
    }
   }
   
 function isloggedin(req,res,next){
 if(req.isAuthenticated()){
  return next();
 }
 req.flash("error","Please Login First");
 res.redirect("/login");
}
 async function isNotVerified (req,res,next){
  try{
        const user=await User.findOne({username:req.body.username});


        if(user.isVerified){
            return next();
        }
        else{
            req.flash('error','Your Account is not verified. Please check your email and verify your account ');
            return res.redirect('/');

        }

    }catch(error){
        console.log(error);
        req.flash('error','Something Went Wrong. Please contact the admin');
        res.redirect('/')


    }
}
   
 app.listen(process.env.PORT,process.env.IP,function(){
  console.log("started");
 });
 