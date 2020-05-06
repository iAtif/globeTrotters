var Photo = require("../models/photo");
var Comment = require("../models/comment");
var User = require("../models/user")

// all the middleware goes here
var middlewareObj = {};

middlewareObj.checkPhotoOwnership = function(req, res, next){
	if(req.isAuthenticated()){
	   Photo.findById(req.params.id, function(err, foundPhoto){
		if(err){
			req.flash("error", "Photo not found!")
			res.redirect("back");
		} else {
			if(foundPhoto.author.id.equals(req.user._id) || req.user.isAdmin) {
				next();
			} else {
				req.flash("error", "Permissnion denied!");
				res.redirect("back");
			}
			}
	   });
	   } else {
		   		req.flash("error", "Please Login!")
				res.redirect("back");
	   };
	};

middlewareObj.checkCommentOwnership = function(req, res, next){
	if(req.isAuthenticated()){
	   Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			res.redirect("back");
		} else {
			if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
				next();
			} else {
				req.flash("error", "Permissnion denied!")
				res.redirect("back");
			}
			}
	   });
	   } else {
		   		req.flash("Please login!")
				res.redirect("back");
	   };
	};


middlewareObj.checkUserOwnership = function(req, res, next){
	if(req.isAuthenticated()){
	   User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("back");
		} else {
			if(foundUser._id.equals(req.user._id) || req.user.isAdmin){
				next();
			} else {
				req.flash("error", "Permissnion denied!")
				res.redirect("back");
			}
			}
	   });
	   } else {
		   		req.flash("Please login!")
				res.redirect("back");
	   };
	};


middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
	   return next();
	   }
	req.flash("error", "Please Login!")
	res.redirect("/login");
}


module.exports = middlewareObj;
