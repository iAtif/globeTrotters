var express 	= require("express");
var router    	= express.Router();
var passport 	= require("passport");
var User		= require("../models/user");
var middleware  = require("../middleware");
var Photo		= require("../models/photo");
var async 		= require("async");
var nodemailer	= require("nodemailer");
var crypto		= require("crypto");
var multer 		= require('multer');

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dqilmu4va',
  api_key: "433716734288973",
  api_secret: process.env.CLOUDINARY_API_KEY
});

//root route
router.get("/", function(req, res){
	res.render("landing.ejs");
});

//show register form
router.get("/register", function(req, res){
	res.render("auth/register.ejs", {page: 'register'});
});

//sign up logic
router.post("/register", upload.single('image'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result) {

		// add cloudinary url for the image to the photo object under image property
		var newUser = new User({
		username: req.body.username,
		email: req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		description: req.body.description,
		image: result.secure_url
		});

		if(req.body.adminCode === process.env.ADMIN_CODE){
			newUser.isAdmin = true;
		}

		User.register(newUser, req.body.password, function(err, user){
			if(err){
				req.flash("error", err.message);
				return res.redirect("/register");
			} else {
				passport.authenticate("local")(req, res, function(){
					req.flash("success", "Welcome to YelpCamp, " + user.username + "!");
					res.redirect("/photos");
				});
			};
		});
	});
});

//show login form
router.get("/login", function(req, res){
	res.render("auth/login.ejs", {page: 'login'});
});

//handle logic login
router.post("/login", passport.authenticate("local", {
	successRedirect: "/photos",
	failureRedirect: "/login",
	failureFlash: true
}), function(req, res){
});

//log out route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out!")
	res.redirect("/photos");
});

//forgot route
router.get("/forgot", function(req, res){
	res.render("auth/forgot.ejs");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'globetrottersapp@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'globetrottersapp@gmail.com',
        subject: 'GlobeTrotters Password Reset Request',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('auth/reset.ejs', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'globetrottersapp@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'globetrottersapp@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/photos');
  });
});

// USER PROFILE
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "Oops! Something went wrong!");
			res.redirect("/");
		}
		Photo.find().where('author.id').equals(foundUser._id).exec(function(err, photos){
			if(err){
			req.flash("error", "Oops! Something went wrong!");
			res.redirect("/");
				} else {
					res.render("users/show.ejs", {user: foundUser, photos: photos});
				}
		});
	});
});


// USER PROFILE - edit
router.get("/users/:id/edit", middleware.checkUserOwnership, function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "Oops! Something went wrong!");
			res.redirect("/");
		} else {
			res.render("users/edit.ejs", {user: foundUser});
				};
		});
	});

//USER PROFILE - edit
router.put("/users/:id", middleware.checkUserOwnership, function(req, res){
	User.findByIdAndUpdate(req.params.id, req.body.description, function(err, updatedProfile){
		if(err){
				req.flash("error", err.message);
				res.redirect("back");
		} else {
				res.redirect("/users/" + req.params.id);
		}
	});
});



module.exports = router;

