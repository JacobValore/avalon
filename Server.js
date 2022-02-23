var fs = require('fs');
var express = require('express');
// var session = require('express-session');
var body_parser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const Game = require('./Game.js');

var rooms_list = [];
var server_port = process.env.PORT || 8080;

// https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x
// https://www.npmjs.com/package/express-socket.io-session
// https://github.com/Manason/CS340-Library/blob/master/Server.js
// console.log(session);

server.listen(server_port, function(){
	console.log("listening on port " + server_port);
});
app.use(express.static('public'));
app.get('/:gameid', function(req, res){
	//check if room is valid, if so add socket to room and send them game.html
	//otherwise, send them to the homepage at index.html
	if(getRoomByID(req.params.gameid) != null)
		res.sendFile(__dirname + '/public/game.html');
	else
		res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
	socket.on('room_connection', function(data){
		if(getRoomByID(data.room_id) != null){
			getRoomByID(data.room_id).addPlayer(data.username, socket);
		}
	});

	socket.on('public_game', function(data){
		//find a game that already exists to join or make a new game for them to be the host
		for(var i = 0; i < rooms_list.length; i++){
			if(!rooms_list[i].private_game && rooms_list[i].playerlist.length < rooms_list[i].max_players){
				socket.emit('redirect', {"url":"/"+rooms_list[i].id});
				return;
			}
		}
		var room_id = generateRoomID();
		rooms_list.push(new Game(room_id,io,false));
		socket.emit('redirect', {"url":"/"+room_id});
	});
	socket.on('private_game', function(data){
		//send them to the new game creator screen eventually
		//for now it will just generate a room with defaults
		var room_id = generateRoomID();
		rooms_list.push(new Game(room_id,io,true));
		socket.emit('redirect', {"url":"/"+room_id});
	});
});

function generateRoomID(){
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	for(var str = ''; str.length < 16;)
		str += chars[Math.floor(Math.random() * chars.length)];

	if(getRoomByID(str) != null)
		return generateRoomID();
	return str;
}
function getRoomByID(id){
	for(var i = 0; i < rooms_list.length; i++)
		if(rooms_list[i].id == id)
			return rooms_list[i];
	return null;
}
