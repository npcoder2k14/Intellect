bcrypt = require('bcryptjs');
password = 'mad' ; 
bcrypt.genSalt(10 , function(err, salt)
	{
		bcrypt.hash(password, salt, function(err,hash)
		{
			console.log(hash);
		});
	});
