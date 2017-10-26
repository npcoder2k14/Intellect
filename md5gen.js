bcrypt = require('bcryptjs');
password = 'pd' ; 
bcrypt.genSalt(10 , function(err, salt)
	{
		bcrypt.hash(password, salt, function(err,hash)
		{
			console.log(hash);
		});
	});
