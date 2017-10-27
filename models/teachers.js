var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var teacherSchema = mongoose.Schema({
	name: {type: String },
	username: {type: String , index: true},
	email: {type: String},
	password: {type: String},
	courses : {type: Array  , "default": []},
	role: {
		type: String,
		default: "teacher"
	},
	Courses : {type: Array  , "default": []}
});

var User  = module.exports = mongoose.model('teachers' , teacherSchema);

module.exports.getUserByUsername = function(username , callback){
	console.log('hi');
	var query = {username: username};
	User.findOne(query , callback);

}

module.exports.getUserById = function(id , callback){
	//var query = {username: username};
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword , hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    if(err) throw err;
    callback(null , isMatch);
   });
}

module.exports.saveCourses = function(user, cname, callback) {
	var query = {_id:user._id};
	user.courses.push(cname);
	User.findOneAndUpdate(query , user , {upsert:true},callback);
	//User.update({_id:id}, {$push: {courses: cname}});
	
}