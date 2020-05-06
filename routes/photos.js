var express 	= require("express");
var router  	= express.Router();
var Photo  		= require("../models/photo");
var User		= require("../models/user");
var middleware  = require("../middleware");
var multer 		= require('multer');
var storage 	= multer.diskStorage({
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


var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);


//Photo - create
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
	cloudinary.uploader.upload(req.file.path, function(result) {
		// add cloudinary url for the image to the photo object under image property
		req.body.photo.image = result.secure_url;
		// add author to photo
		req.body.photo.author = {
		id: req.user._id,
		username: req.user.username
		}

		geocoder.geocode(req.body.photo.location, function (err, data) {
			if (err || !data.length) {
			  req.flash('error', 'Invalid address');
			  return res.redirect('back');
			}
			req.body.photo.lat = data[0].latitude;
			req.body.photo.lng = data[0].longitude;
			req.body.photo.location = data[0].formattedAddress;

			Photo.create(req.body.photo, function(err, photo) {
				if (err) {
				  req.flash('error', err.message);
				  return res.redirect('back');
				}
				res.redirect('/photos/' + photo.id);
			  });
		});
	});
});


// EDIT - shows an update page
router.get("/:id/edit", middleware.checkPhotoOwnership, function(req,res){
	   Photo.findById(req.params.id, function(err, foundPhoto){
	   		res.render("photos/edit", {photo: foundPhoto});
	   });
	});


// UPDATE - Edit an existing photo
router.put("/:id", middleware.checkPhotoOwnership, upload.single('image'), function(req,res){
	cloudinary.uploader.upload(req.file.path, function(result) {
		// add cloudinary url for the image to the photo object under image property
		req.body.photo.image = result.secure_url;
		// add author to photo
		req.body.photo.author = {
		id: req.user._id,
		username: req.user.username
		}

		 geocoder.geocode(req.body.location, function (err, data) {
			if (err || !data.length) {
			  req.flash('error', 'Invalid address');
			  return res.redirect('back');
			}

			req.body.photo.lat = data[0].latitude;
			req.body.photo.lng = data[0].longitude;
			req.body.photo.location = data[0].formattedAddress;

			Photo.findByIdAndUpdate(req.params.id, req.body.photo, function(err, updatedPhoto){
				if(err){
					req.flash("error", err.message);
					res.redirect("back")
				}else{
					req.flash("success","Successfully Updated!");
					res.redirect("/photos/" + req.params.id);
				}
			});
		});
	});
});


// DESTROY Photo Router
router.delete("/:id", middleware.checkPhotoOwnership, function(req,res){
	Photo.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/photos");
		}else{
			res.redirect("/photos");
		}
	})
})


//Photo - show all photos
router.get("/", function(req,res){
	Photo.find({}, function(err, allPhotos){
		if(err){
			console.log(err)
		} else {
			res.render("photos/index.ejs", {photos:allPhotos, page: 'photos'})
		}
	})
})


//Show new form to create new photo
router.get("/new", middleware.isLoggedIn, function(req,res){
	res.render("photos/new.ejs");
})


//Show more info about one photo
router.get("/:id", function(req,res){
	Photo.findById(req.params.id).populate("comments").exec(function(err, foundPhoto){
		if(err){
			console.log(err);
		} else {
				res.render("photos/show.ejs", {photo: foundPhoto});
		};
	});
});


// Photo Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Photo.findById(req.params.id, function (err, foundPhoto) {
        if (err) {
            console.log(err);
            return res.redirect("/photos");
        }

        // check if req.user._id exists in foundPhoto.likes
        var foundUserLike = foundPhoto.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundPhoto.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundPhoto.likes.push(req.user);
        }

        foundPhoto.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/photos");
            }
            return res.redirect("/photos/" + foundPhoto._id);
        });
    });
});


module.exports = router;