require('dotenv').config();

var express 				= require("express"),
	app 					= express(),
	bodyParser 				= require("body-parser"),
	mongoose 				= require("mongoose"),
	Photo 					= require("./models/photo"),
	Comment 				= require("./models/comment"),
    User 					= require("./models/user"),
	LocalStrategy 			= require("passport-local"),
	methodOverride			= require("method-override"),
	flash					= require("connect-flash"),
	passport 				= require("passport"),
	passportLocalMongoose 	= require("passport-local-mongoose")

var commentRoutes 			= require("./routes/comments"),
	photoRoutes				= require("./routes/photos"),
	indexRoutes				= require("./routes/index")



mongoose.connect(process.env.DATABASEURL,
	{   useNewUrlParser: true,
		 useCreateIndex: true
	}).then(() => {
		console.log('connected to DB!');
}).catch(err => {
	console.log('ERROR', err.message);
});

mongoose.set('useFindAndModify', false);

//MOMENT CONFIGURATION - Time Tracker
app.locals.moment = require('moment');

//PASSPORT CONFIGURATION - Authenticator
app.use(require("express-session")({
	secret: "Man is mortal",
	resave: false,
	saveUninitialized: false
}));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//requiring routes
app.use("/", indexRoutes);
app.use("/photos", photoRoutes);
app.use("/photos/:id/comments", commentRoutes);



app.listen(3000, process.env.IP, function(){
	console.log("App has started!");
});