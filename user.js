var format_user = function (user, includePassword){
    if(user){
        var u = {};

        u._id           = user._id;
        if(includePassword) u.password = user.password;
        u.name          = user.name;
        u.email         = user.email;format_user
        u.address       = user.address;
        u.mobile        = user.mobile;
        u.date_of_birth = user.date_of_birth;
        u.nationality   = user.nationality;
        u.institution   = user.institution;
        u.device_token  = user.device_token;

        try{
            u.deals = JSON.parse(user.deals);
        }
        catch (e){
            u.deals = {};
        }
        try{
            u.events = JSON.parse(user.events);
        }
        catch (e){
            u.events = {events:[]};
        }
        try{
            u.settings = JSON.parse(user.settings);
        }
        catch (e){
            u.settings = {};
        }
		try{
            u.deal_timestamp = JSON.parse(user.deal_timestamp);
        }
        catch (e){
            u.deal_timestamp = {};
        }
		try{
            u.event_timestamp = JSON.parse(user.event_timestamp);
        }
        catch (e){
            u.event_timestamp = {};
        }


        return u;
    }

    return user;
}

var format_users = function (users){
    if(users && users.constructor === Array){
        // Format Array
        if(users.length){
            var return_value = [];
            for(var i = 0; i < users.length; i++){
                return_value.push(format_user(users[i]));
            }

            return return_value;
        } else {
            return [];
        }
    } else {
        return format_user(users);
    }
}

module.exports = function (opts) {
    var userModel = opts.models.User;
    var failure_callback = require('./common.js')().failure_callback;
    var success_callback = require('./common.js')().success_callback;
        
    return {
        "format_user" : format_user,
        "format_users" : format_users,
        "post#user/create" : function (req, res) {
        	// Get Request Parameters
            var email 			= req.body.email,
            	password		= req.body.password,
            	name			= req.body.name,
            	address			= req.body.address,
            	mobile			= req.body.mobile,
            	date_of_birth	= req.body.date_of_birth,
            	nationality		= req.body.nationality,
            	institution		= req.body.institution,
            	device_token	= req.body.device_token,
            	deals			= req.body.deals,
            	events			= req.body.events,
            	settings		= req.body.settings;

            // Validate Input
            if(!email || !password || !name){
            	return failure_callback(res, "Required Parameters are empty!");
            }

            // Check If User Already Exists
			var query = userModel.findOne({email: email});
            query.exec(function (err, user) {
                if (err) {
                    console.log("-- Error : Finding User --");
                    console.log(err);
                    return failure_callback(res);
                } else if (user) {
                	return failure_callback(res, "Another user has already registered with same email.");
                }

                var u = new userModel();

                u.email 		= email;
                u.password		= password;
                u.name			= name;
                u.address		= (address)?address:"";
                u.mobile		= (mobile)?mobile:"";
                u.date_of_birth	= (date_of_birth)?date_of_birth:"";
                u.nationality	= (nationality)?nationality:"";
                u.institution	= (institution)?institution:"";
                u.device_token	= (device_token)?device_token:"";
                u.deals			= (deals)?JSON.stringify(deals):"{}";
                u.events		= (events)?events:"{\"events\":[]}";
                u.settings		= (settings)?JSON.stringify(settings):"{\"enter\":\"YES\",\"new_deal\":\"NO\",\"preference\":[\"All\"],\"redeem\":\"YES\"}";
                u.auth_token    = "";
				
				u.save(function (err, new_user) {
					if (err) {
						console.log("-- Error : Saving User --");
                    	console.log(err);
						return failure_callback(res);
					} else {
						return res.json({success: true, user_data: format_user(new_user, true)});
					}
				});
            });
        },

		"post#user/get" : function( req, res ) {
			var _id = req.body.id;
			var query;

			if(_id){
				query = userModel.findOne({_id : _id});
			} else {
				query = userModel.find({});
			}

			query.exec(function(err, users){
				if(err){
					console.log("-- Error : Querying User Failed --");
					console.log(err);
					return failure_callback(res);
				} else {
					return res.json({ success : true, users : format_users(users) });
				}
			});
		},

        "post#user/login" : function( req, res ) {
            var email       = req.body.email,
                password    = req.body.password;
                console.log(email);
                console.log(password);
            var query = userModel.findOne({email: email, password: password});

            query.exec(function(err, users){
                if(err || !users){
                    console.log("-- Error : Querying User Failed --");
                    console.log(err);
                    return failure_callback(res, "Email/Password not correct.");
                } else {
                    return res.json({ success : true, user_data : format_users(users) });
                }
            });
        },

        "post#user/forgot" : function( req, res ) {
            var email       = req.body.email;
            var query = userModel.findOne({email: email});

			var email = req.body.email;
			if(!email){
				return failure_callback(res, "Email should not be empty.");;
			}
			userModel.findOne({'email': email}, function(err, user){
				if(user){
					var nodemailer = require('nodemailer');
					var mailer = nodemailer.createTransport({service: 'Gmail',
																auth: {
																	user: "noreply.christchurcheducated@gmail.com",
																	pass: "5012Wordsworth!"
																}});
					mailer.sendMail({
						from: "noreply.christchurcheducated@gmail.com", // sender address
						to: req.body.email, // list of receivers
						subject: "Password Recovery", // Subject line
						text: "Hi " + user.name + ", \n\n" + 
							"Thank you for using the Christchurch International Student Guide mobile App!" + "\n\n" + 
							"We see you have requested some help to recover your password. No problem at all, your password is below." + "\n\n" + 
							  'Your Password: ' + user.password + '\n\n' +
							"Please try again and if you continue to have any login issues please contact us." + "\n\n" + 
							  "Warmest Regards,\nChristchurch Educated\ninfo@christchurcheducated.co.nz",
						html: "Hi " + user.name + ", <br><br>" + 
							"Thank you for using the Christchurch International Student Guide mobile App!" + "<br><br>" + 
							"We see you have requested some help to recover your password. No problem at all, your password is below." + "<br><br>" + 
							  'Your Password: ' + user.password + '<br><br>' +
							"Please try again and if you continue to have any login issues please contact us." + "<br><br>" + 
							  "Warmest Regards,<br>Christchurch Educated<br>info@christchurcheducated.co.nz"
					}, function (err) {
						console.log(err);
						if(err){
							return failure_callback(res, "Service temporarily unavailable.");
						} else {
							return res.json({ success : true });
						}
					});
				} else {
                    return failure_callback(res, "User not found.");
				}
			});
        },

		"post#user/update" : function (req, res) {
        	// Get Request Parameters
            var id 				= req.body.id,
            	email 			= req.body.email,
            	password		= req.body.password,
            	name			= req.body.name,
            	address			= req.body.address,
            	mobile			= req.body.mobile,
            	date_of_birth	= req.body.date_of_birth,
            	nationality		= req.body.nationality,
            	institution		= req.body.institution,
            	device_token	= req.body.device_token,
            	deals			= req.body.deals,
            	events			= req.body.events,
            	settings		= req.body.settings;

            // Check If Id is correctly posted
            if(!id){
            	return failure_callback(res);
            }

            // Check If User Already Exists
			var query = userModel.findOne({_id : id});
            query.exec(function (err, u) {
                if (err) {
                    console.log("-- Error : Finding User --");
                    console.log(err);
                    return failure_callback(res);
                } else if (!u) {
                	return failure_callback(res, "User Not Found!");
                }

                u.email 		= (email)?email:u.email;
                u.password		= (password && password != "")?password:u.password;
                u.name			= (name)?name:u.name;
                u.address		= (address)?address:u.address;
                u.mobile		= (mobile)?mobile:u.mobile;
                u.date_of_birth	= (date_of_birth)?date_of_birth:u.date_of_birth;
                u.nationality	= (nationality)?nationality:u.nationality;
                u.institution	= (institution)?institution:u.institution;
                u.device_token	= (device_token)?device_token:u.device_token;
                u.deals			= (deals)?JSON.stringify(deals):u.deals;
                u.events		= (events)?events:u.events;
                u.settings		= (settings)?JSON.stringify(settings):u.settings;

				if(deals){
					var timestamp = {};
					try{
						timestamp = JSON.parse(u.deal_timestamp);
					}
					catch (e){
						timestamp = {};
					}

					if(deals.wishlist){
						if(!timestamp.wishlist) timestamp.wishlist = {};
						for(var i = 0; i < deals.wishlist.length; i++){
							if(!timestamp.wishlist[deals.wishlist[i]]){
								timestamp.wishlist[deals.wishlist[i]] = new Date().getTime();
							}
						}
					}
					if(deals.redeemed){
						if(!timestamp.redeemed) timestamp.redeemed = {};
						for(var i = 0; i < deals.redeemed.length; i++){
							if(!timestamp.redeemed[deals.redeemed[i]]){
								timestamp.redeemed[deals.redeemed[i]] = new Date().getTime();
							}
						}
					}

					u.deal_timestamp = JSON.stringify(timestamp);
				}

				if(events){
					var mEvents;
					var timestamp = {};
					try{
						timestamp = JSON.parse(u.event_timestamp);
					}
					catch (e){
						timestamp = {};
					}

					try{
						mEvents = JSON.parse(events);
					}
					catch (e){
						mEvents = [];
					}

					console.log(mEvents);

					if(mEvents.events && mEvents.events.length){
						for(var i = 0; i < mEvents.events.length; i++){
							console.log(mEvents.events[i]);
							if(!timestamp[mEvents.events[i]._id]){
								timestamp[mEvents.events[i]._id] = new Date().getTime();
							}
						}

						u.event_timestamp = JSON.stringify(timestamp);
					}
				}
				
				u.save(function (err, new_user) {
					if (err) {
						console.log("-- Error : Saving User --");
                    	console.log(err);
						return failure_callback(res);
					} else {
						return res.json({ success : true, user_data : format_users(new_user) });
					}
				});
            });
        },

		"post#user/delete" : function( req, res) {
			var id = req.body.id;
			userModel.remove({ _id : id}, function(err){
				if(err){
					console.log("-- Error : Deleting User --");
                    console.log(err);
					return failure_callback(res);
				} else {
					return success_callback(res);
				}
			});
		},
    }
}