var express 	= require("express");
var router    	= express.Router({mergeParams: true});
var Photo 		= require("../models/photo");
var Comment  	= require("../models/comment");
var middleware  = require("../middleware");


//Comments - create
router.post("/", middleware.isLoggedIn, function(req, res){
	Photo.findById(req.params.id, function(err, foundPhoto){
		if(err){
			console.log(err);
		} else {
			if (req.body.comment.text === undefined || req.body.comment.text === '') {
				req.flash("error", "Comment can't be empty!");
				res.redirect("back");
			} else {
				Comment.create(req.body.comment, function(err, comment){
				if(err){
				   console.log(err);
					} else {
						comment.author.id = req.user._id;
						comment.author.username = req.user.username;
						comment.save();
						foundPhoto.comments.push(comment);
						foundPhoto.save();
						res.redirect("/photos/" + foundPhoto._id);
						   }
				   		})
					}
				}
	})
});


//Comments - update (get)
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			res.redirect("back")
		} else {
			res.render("../views/comments/edit.ejs", {photo: req.params.id, comment: foundComment});
		}
	});
});


//Comments - update (put)
router.put("/:comment_id", function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			res.redirect("back");
		} else {
			res.redirect("/photos/" + req.params.id);
		}
	});
});


// DESTROY Comment Router
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req,res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("back");
		}else{
			req.flash("success", "Comment deleted");
			res.redirect("/photos/" + req.params.id);
		}
	});
});



module.exports = router;