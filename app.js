var express = require("express"),
    config  = require("./config.js"),
    utils   = require("./utils.js"),
    path = require('path'),
	async = require('async');
var multer = require('multer');

var app       = express();
var fs = require('fs');

var models = null;
var signinModels = {};


    app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "http://54.191.82.84/");
        res.header("Access-Control-Allow-Origin", "http://172.16.1.50/");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.use(express.static(__dirname + '/frontend'));
    app.use(express.bodyParser());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(app.router);
    //app.use(app.router);

var deeplink = require('node-deeplink');

function getParameterByName(name, url){
    if(!url) return null;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);

    if(!results) return null;
    if(!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ""));
}

var startApp = function (err) {
    if (err) {
        console.log(err);
    } else {

    app.listen(80, function () {
       console.log("App started on port: 80");
    });

    app.post('/upload', function(req, res) {
        fs.readFile(req.files.file.path, function (err, data) {
            var newPath = __dirname + "/frontend/email/" + req.body.key + ".html";
            fs.writeFile(newPath, data, function (err) {
                if(err){
                    res.json({success: false});
                    return;
                }
                res.json({success: true});
            });
        });
    });
    
    app.get('/track', function(req, res){
        var url = req.query.token;
        if(!url || url == ""){
            res.redirect("/deeplink_fail");
            res.end();
            return;
        }
        res.sendfile(__dirname + "/frontend/track.html", {});
        
    });
        
        app.get('/eula', function(req, res){
                res.sendfile(__dirname + "/frontend/eula.html", {});
                
                });
        app.get('/privacy', function(req, res){
                res.sendfile(__dirname + "/frontend/privacy.html", {});
                
                });
        
        app.get('/deeplink', function(req, res){
            var url = req.query.url;
            if(!url || url == ""){
                res.redirect("/deeplink_fail");
                res.end();
            }
            url = decodeURIComponent(url);
            if(url.indexOf('pathgo://') == -1){
                res.redirect("/deeplink_fail");
                res.end();
            }

            var url = decodeURIComponent(url);
            var userModel = models.User;

            var action  = getParameterByName("action", url);
                _id     = getParameterByName("id", url);
                code    = getParameterByName("code", url);
            var query = userModel.findOne({_id : _id, code : code});

            if(action == "verify"){
                query.exec(function(err, u){
                    if(err){
                        res.write("Something Went Wrong");
                        res.end();
                    }
                    else if(!u || !u.verified || u.verified.toLowerCase() == "yes"){
                        res.write("Something Went Wrong");
                        res.end();
                    }
                    u.verified = "YES";
                    u.save(function(err, nu){
                        if(err){
                            res.write("Something Went Wrong");
                            res.end();
                        }
                        res.write("Your PathGO account has been verified. You can log into the app now.");
                        res.end();
                    })
                });
            } else {
                var str = '<script>setTimeout(function () { if (window.confirm("Not installed yet? Please install the app first.")){ window.location = "' + config.app_store_link_raw + '"; }else{  }}, 2000);';
                str = str + 'window.location = "' + url + '"</script>';
                res.write(str);
            }

            /*

            var str = '<script>setTimeout(function () { if (window.confirm("Not installed yet? Please install the app first.")){ window.location = "' + config.app_store_link_raw + '"; }else{  }}, 2000);';
            str = str + 'window.location = "' + url + '"</script>';
            res.write(str);
            */
        });

        app.get('/deeplink_fail', function(req, res){
            res.write('Something went wrong.');
            res.end();
        });
        
       
		app.get("/login", function (req, res) {
			res.sendfile(__dirname + "/frontend/login.html", {});
		});

		app.get("/*", function (req, res) {
			res.sendfile(__dirname + "/frontend/index.html", {});
		});

    }
}

async.parallel([
    function (callback) {
        utils.loadMiddlewares({}, callback);
    },
    function (callback) {
        utils.loadModels({ dbConnection : config.dbConnection }, callback);
    },
    function (callback) {
        utils.loadControllers({}, callback);
    },
], function (err, results) {
    async.parallel([
        function (callback) {
			models = results[1];
            /*
			crons = require('./crons.js')({reminders: reminders, schedules: schedules, sites: sites, models: models, signinModels: signinModels});
			results.push(crons);
			*/
            utils.sync(app, results, callback);
        }
    ], startApp);
});
