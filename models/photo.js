var mongoose = require("mongoose");

var photoSchema = new mongoose.Schema({
	name: {type: String, required: true},
	image: {type: String, required: true},
	description: String,
    location: String,
    lat: Number,
    lng: Number,
	createdAt: {type: Date, default: Date.now},
	author: {
		id :{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports = mongoose.model("Photo", photoSchema);