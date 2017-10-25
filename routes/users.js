var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');
var async = require('async');
var nodemailer = require('nodemailer');
var User = require('../models/user');
var teacher = require('../models/teachers');
var teach_flag = 0;
//console.log(user);
//Register
router.get('/register' , function(req, res){
	res.render('register');
});

//login
router.get('/login' , function(req, res){
	res.render('login');
});
//Forgot Password
router.get('/forgotPassword',function(req,res){
	res.render('forgotPassword');
});


		
//Register User
router.post('/register' , function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	//Validation
	req.checkBody('name' , 'Name is required').notEmpty();
	req.checkBody('email' , 'Email is required').notEmpty();
	req.checkBody('email' , 'Email is not valid').isEmail();
	req.checkBody('username' , 'username is required').notEmpty();
	req.checkBody('password' , 'password is required').notEmpty();
	req.checkBody('password2' , 'Passwords do not match').equals(req.body.password);
	var errors = req.validationErrors();


	if(errors)
	{
		res.render('register' , {
			errors:errors
		});
	}
	
	else
	{
		//var cnt = 0;
		var promise = User.count({username: username}).exec();
		promise.then(function(data)
		{
			if(data == 0)
			{
				var newUser = new User({
					name: name,
					email: email,
					username: username,
					password: password
				});
				User.createUser(newUser , function(err , user){
					if(err) throw err;
					console.log(user);
				});

				req.flash('success_msg' , 'You are registered and can now login.');
				res.redirect('/users/login');
			}
			else
			{
				req.flash('error_msg' , 'Username Already Exist ');
				res.redirect('/users/register');
			}		
		});



		
	}
});

passport.use(new LocalStrategy({
  passReqToCallback: true
  },
  function(req,username, password,  done) {
   //console.log('hi');
   var checkbox = req.body.checkbox ;
   var tmp_user = User;
   //console.log(User);
   if(checkbox)
    {
      console.log("logging as teacher");
      tmp_user = teacher;
      teach_flag = 1;
    } 
    else
    {
    	teach_flag = 0;
    }
   tmp_user.getUserByUsername(username,function(err, user){
   	if(err) return done(err);
   	if(!user){
   		return done(null,false,{message: 'Unknown User'});
   	}

   	tmp_user.comparePassword(password,user.password ,  function(err,isMatch) {
   	    
   		if(err) throw err;
   		if(isMatch){
   			console.log(user);
   			return done(null,user);
   		}
   		else
   		{
   			return done(null, false , {message: 'Invalid password'});
   		}
   	});
   }); 
}));


passport.serializeUser(function(user, done) {

  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  if(teach_flag)
  {
  	teacher.getUserById(id , function(err,user) {
  		done(err , user)
  	});
  }
  else
  {
    User.getUserById(id, function(err, user) {
        done(err, user);
  		
    });	
  }
  
});
		
router.post('/login',passport.authenticate('local',{successRedirect: '/', failureRedirect: '/users/login', failureFlash: true})
 ,function(req, res) {
    res.redirect('/');
  });
/*
router.post('/login',function(req, res) {
	var teacher = req.body.checkbox;
	if(teacher)
	{
	}
	else
	{
		console.log('helo');
    	console.log('helo');
    	res.redirect('/');	
	}
	//console.log(teacher);
    
  });
  */

router.get('/logout' , function(req , res){
	req.logout();
	
	req.flash('success_msg','You are successfully logged out');

	res.redirect('/users/login');
});

//Forgot password Post

router.post('/forgotPassword', function(req, res, next) {
	//console.log('hi');
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
          return res.redirect('/users/forgotPassword');
        }
        console.log(user);

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      //console.log('***Sending via '+process.env.http_proxy);
      
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {

          user: 'Hello',
          pass: 'hello'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'narendrapal67@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgotPassword');
  });
});

//Reset

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.1');
      return res.redirect('/users/forgotPassword');
    }
    res.render('reset');
  });
});

//Reset Post

router.post('/reset/:token', function(req, res) {
    var token = req.params.token ;
    var password = req.body.password;
	var password2 = req.body.password2;

    req.checkBody('password' , 'password is required').notEmpty();
 	req.checkBody('password2' , 'password is required').notEmpty();
	req.checkBody('password2' , 'Passwords do not match').equals(req.body.password);
	var errors = req.validationErrors();
    if(errors)
    {
	    console.log('errors');

    	req.flash('error_msg' , errors);
    	res.render('reset');
    }
     else
	  async.waterfall([
	    function(done) {

	      User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	      	console.log(user);
	        if (!user) {
	          req.flash('error', 'Password reset token is invalid or has expired.');
	          return res.redirect('back');
	        }

	        user.password = req.body.password;
	        user.resetPasswordToken = undefined;
	        user.resetPasswordExpires = undefined;

	        User.saveUser(user , function(err) 
	        {
	          req.logIn(user, function(err) 
	          {
	            done(err, user);
	          });
	        });
	        //user.save();

	      });
	    },
	    function(user, done) {
	      var smtpTransport = nodemailer.createTransport( {
	        service: 'Gmail',
	        auth: {
	          user: '',
	          pass: ''
	        }
	      });
	      var mailOptions = {
	        to: user.email,
	        from: 'narendrapal67@gmail.com',
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
	    res.redirect('/');
	  });
});

module.exports = router ;
