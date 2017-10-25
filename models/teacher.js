var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var teacherSchema = mongoose.Schema({
	name: {type: String },
	username: {type: String , index: true},
	email: {type: String},
	password: {type: String},
	Courses : {type: Array  , "default": []}
});

var teachers  = module.exports = mongoose.model('teachers' , teacherSchema);