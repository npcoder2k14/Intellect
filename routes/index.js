var express = require('express');
var router = express.Router();
var teacher = require('../models/teachers');

//Get Homepage
router.get('/' ,ensureAuthenticated, function(req, res){
	res.render('index');
});

router.post('/', function(req, res) {
	var cname = req.body.cname;
	req.checkBody('cname', 'Course Name is required').notEmpty();
	var errors = req.validationErrors();

	if(errors) {
		res.render('index', {
			errors:errors
		});
	}
	else {
		teacher.saveCourses(req.user, cname, function(err,doc) {
			if(err) throw err;
			console.log('Index: ', cname);
			req.flash('success_msg' , 'Course '+cname+' has been added');
			res.redirect('/');
		}); 
		
		//console.log(res.locals.user.username);
	}
});


function ensureAuthenticated(req , res , next ){
	if(req.isAuthenticated()) {
		return next();
	}
	else
	{
		//req.flash('error_msg' , 'You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router ;
