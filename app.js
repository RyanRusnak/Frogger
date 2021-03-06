var handler = function(req, res) {
	fs.readFile('./index.html', function(err, data) {
		if (err)
			throw err;
		res.writeHead(200);
		res.end(data);
	});
};
//============================ Begin Mongoose ================================///
// Pre- Heoku mongoose stuff
// var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/test');
// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function callback () {
//   // yay!
// });

// //Post heroku mongoose stuff
// var http = require ('http');             // For serving a basic web page.
// var mongoose = require ("mongoose"); // The reason for this demo.

// // Here we find an appropriate database to connect to, defaulting to
// // localhost if we don't find one.
// var uristring =
// process.env.MONGOLAB_URI ||
// process.env.MONGOHQ_URL ||
// 'mongodb://localhost/heroku_app22500191';

// // The http server will listen to an appropriate port, or default to
// // port 5000.
// var theport = process.env.PORT || 3000;

// // Makes connection asynchronously.  Mongoose will queue up database
// // operations and release them when the connection is complete.
// mongoose.connect(uristring, function (err, res) {
//   if (err) {
//   console.log ('ERROR connecting to: ' + uristring + '. ' + err);
//   } else {
//   console.log ('Succeeded connected to: ' + uristring);
//   }
// });

// var userSchema = mongoose.Schema({
//     name: String
// });

// var User = mongoose.model('User', userSchema);

// User.find(function (err, users) {
//   if (err) return console.error(err);
//   console.log('users!!!!!');
//   console.log(users.length);
// });
//============================ End Mongoose ================================///

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
// var Moniker = require('moniker');
var port = process.env.PORT || 3000;

app.listen(port);

// socket.io
io.sockets.on('connection', function(socket) {
	var user = addUser();
	var data = {
		'currentUser' : user,
		'users' : users,
		'names' : userNames(users)
	};
	socket.emit("welcome", data);
	socket.on('disconnect', function() {
		removeUser(user);
	});
	socket.on("onKeyPress", function(k) {
		for (var i = 0; i < users.length; i++) {
			if (user.name === users[i].name) {
				if (k == 'left') {
					if (data.users[i].location.x > 20) {
						users[i].location.x -= 50;
					}
				} else if (k == 'right') {
					if (data.users[i].location.x < 800) {
						users[i].location.x += 50;
					}
				} else if (k == 'up') {
					if (data.users[i].location.y > 20) {
						users[i].location.y -= 50;
					}
				} else if (k == 'down') {
					if (data.users[i].location.y < 500) {
						users[i].location.y += 50;
					}
				}
				break;
			}
		}
		io.sockets.emit("updateLocation", users);
	});

	socket.on("UpdateUserName", function(n) {;
		for (var i = 0; i < users.length; i++) {
			if (user.id === users[i].id) {
				users[i].name = n;
				// var dbUser = new User({ name: n });    //create user in database
				// dbUser.save(function(err, thor) {
				// 	if (err) return console.error(err);
				// 	console.dir(thor);
				// });										// end create user
				break;
			}
		}
		io.sockets.emit("users", {
			'names' : userNames(users),
			'users' : users
		});
	});

});

var users = [];

function userNames(users) {
	var str = '';
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		if (user.lost == true){
			str += user.name + 'lost!<br />';
		}else if(user.won == true){
			str += user.name + 'won!<br />';
		}else{
			str += user.name + '<br />';
		}
	}
	return str;
}

function newUserLocation() {

}

var addUser = function() {
	var user = {
		id : users.length,
		won : false,
		lost : false,
		name : "New User" + (users.length + 1),
		location : {
			x : users.length * 60 + 10,
			y : 540
		}
	};
	users.push(user);
	return user;
};
var removeUser = function(user) {
	for (var i = 0; i < users.length; i++) {
		if (user.name === users[i].name) {
			users.splice(i, 1);
			return;
		}
	}
};

function Car(width, height, x, y) {
	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
}

var cars = [];
setInterval(function() {
	var c1 = new Car(20, 20, 0, 400);
	var c2 = new Car(20, 20, 850, 200);
	cars.push(c1);
	cars.push(c2);
}, 2000);

function detectCollisons() {
	for (var i = 0; i < cars.length; i += 1) {
		for (var j = 0; j < users.length; j += 1) {
			if (Math.abs((cars[i].x - users[j].location.x)) < 50) {
				if (Math.abs((cars[i].y - users[j].location.y)) < 50) {
					var loser = users[j];
					users[j].location.y = 540;
					users[j].lost = true;
					// io.sockets.emit("lose", loser.name);                ///may not need a lose event
					io.sockets.emit("users", {
						'names' : userNames(users),
						'users' : users
					});
				}
			}
			if(users[j].location.y<0){
				users[j].won = true;
				io.sockets.emit("users", {
						'names' : userNames(users),
						'users' : users
					});
			}
		}
	}
}

var speed = -10;
setInterval(function() {
	for (var i = 0; i < cars.length; i += 1) {
		if (cars[i].y == 200) {// cars at top
			cars[i].x += speed;
		} else {// cars at bottom
			cars[i].x += -speed;
		}
	}

	io.sockets.emit("draw", {
		'cars' : cars,
		'users' : users
	});
	detectCollisons();
}, 100);

