var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: {type: String, required: true},
	password: String,
	isAdmin: {type: Boolean, default: false},
	image: {type: String, required: true},
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	description: String,
	email: {type: String, unique: true, required: true},
	resetPasswordToken: String,
	resetPasswordExpires: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);