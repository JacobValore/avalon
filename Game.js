var fs = require('fs');
const Player = require('./Player.js');
const State = require('./States.js');
const Tracks = require('./Tracks.js');

class Game{
	constructor(id, io, private_game){
		//Game Settings
		this.private_game = private_game;

		//Game Setup
		this.id = id;
		this.io = io;
		this.playerlist = [];
		this.state = new State.Lobby(this);
		this.tracks = null;

		this.module_timer = null;
		this.timer_interval = null;
	}

	addPlayer(username, socket){
		var game = this;
		username = game.assignUsername(username);
		var player = new Player(username, socket);
		player.socket.join(game.id);
		if(game.state.name == "Lobby")
			game.playerlist.push(player);
		game.sendMessage("Server", player.name+" has connected.");
		game.sendPlayerlist();
		player.sendCurGame(game);

		//Commands List
		socket.on('ready', function(){
			if(game.state.name == "Lobby"){
				player.is_ready = !player.is_ready;
				game.sendVotes();
				//if all players ready
				for(var i = 0; i < game.playerlist.length; i++)
					if(!game.playerlist[i].is_ready)
						return;
				//and there are 5 or more players, start game.
				if(game.playerlist.length >= 5){
					game.tracks = new Tracks(game.playerlist.length);
					game.state.endState();
					game.sendState();
				}
			}
		});
		socket.on('voting', function(data){
			if(game.state.name == "KingChoose" || game.state.name == "Voting"){
				if(game.state.name == "KingChoose" && player.voted && player.vote_approve == data.vote_tile){
					player.voted = false;
					player.vote_approve = false;
				}
				else{
					player.voted = true;
					player.vote_approve = data.vote_tile;
				}
				player.sendTileSelection(game.state.name);
				game.sendVotes();
			}
		});
		socket.on('questing', function(data){
			if(game.state.name == "Questing" && player.is_quester){
				if(player.quested==false)
					game.sendQuestCard();
				player.quested = true;
				player.quest_succeed = player.character.allegiance=="Good" ? true : data.quest_tile;
				player.sendTileSelection(game.state.name);

				//if all players quested
				for(var i = 0; i < game.playerlist.length; i++)
					if(game.playerlist[i].is_quester && !game.playerlist[i].quested)
						return;
				//then start 5s timer to endstate
				if(game.timer_interval==null){
					var timer = 5;
					game.sendTimer(timer);
					game.timer_interval = setInterval(function(){
						timer--;
						game.sendTimer(timer);
						if(timer==0){
							game.state.endState();
							game.sendState();
							if(game.timer_interval != null){
								clearInterval(game.timer_interval);
								game.timer_interval = null;
							}
						}
					},1000);
				}
			}
		});
		socket.on('assassinate', function(data){
			if(game.state.name == "Assassin" && player.character.name == "Assassin"){
				var target = null;
				for(var i = 0; i < game.playerlist.length; i++)
					if(game.playerlist[i].is_target)
						target = game.playerlist[i];
				if(target == null)
				 	return;
				if(target.character.name == "Merlin")
					game.state.got_merlin = true;
				game.state.endState();
				game.sendState();
			}
		});
		socket.on('next_game', function(){
			console.log("next_game");
			if(game.state.name == "Win"){
				game.state.endState();
				game.sendState();
			}
		});
		socket.on('king_next', function(){
			if(game.state.name == "KingChoose"){
				//if correct number of players chosen
				var count = 0;
				for(var i = 0; i < game.playerlist.length; i++)
					if(game.playerlist[i].is_quester)
						count++;
				if(count != game.tracks.getCurQuesters())
					return;
				//then move on to VOTING
				game.state.endState();
				game.sendState();
			}
			else if(game.state.name == "Voting"){
				//if all players voted
				for(var i = 0; i < game.playerlist.length; i++)
					if(!game.playerlist[i].voted)
						return;
				//then start 5s timer to endstate
				if(game.timer_interval==null){
					var timer = 5;
					game.sendTimer(timer);
					game.timer_interval = setInterval(function(){
						timer--;
						game.sendTimer(timer);
						if(timer==0){
							game.state.endState();
							game.sendState();
							if(game.timer_interval != null){
								clearInterval(game.timer_interval);
								game.timer_interval = null;
							}
						}
					},1000);
				}
			}
		});
		socket.on('player_clicked', function(data){
			if(game.state.name == "KingChoose" && player.is_king){
				var target = game.getPlayerByName(data.target_name);
				if(target == null)
				 	return;
				target.is_quester = !target.is_quester;
				game.sendPlayerlist();
			}
			if(game.state.name == "Assassin" && player.character.name == "Assassin"){
				var target = game.getPlayerByName(data.target_name);
				if(target == null || target.character.allegiance == "Evil")
				 	return;
				for(var i = 0; i < game.playerlist.length; i++)
					game.playerlist[i].is_target = false;
				target.is_target = true;
				game.sendPlayerlist();
			}
		});
		socket.on('set_username', function(data){
			console.log(data);
			player.name = game.assignUsername(data.username);
			game.sendPlayerlist();
		});
		socket.on('chat_message', function(data){
			console.log(data);
			game.sendMessage(player.name, data.message);
		});
		socket.on('disconnect', function() {
			//If is_host give host to the next person in playerlist
			game.sendMessage("Server",player.username+" has disconnected.");
			if(game.state.name == "Lobby")
				game.remove(game.playerlist,player);
			game.sendPlayerlist();
  		});
	}

	//Emit Functions
	sendMessage(name, message){
		this.io.to(this.id).emit('chat_message', {"username":name,"message":message});
	}
	sendGameSettings(){
		this.io.to(this.id).emit('game_settings', {"chat_enabled":this.chat_enabled});
	}
	sendPlayerlist(){
		if(this.state.name=="Assassin")
			this.io.to(this.id).emit('playerlist2', {"list":this.getPlayerlist2Obj(false)});
		else if(this.state.name=="Win")
			this.io.to(this.id).emit('playerlist2', {"list":this.getPlayerlist2Obj(true)});
		else
			this.io.to(this.id).emit('playerlist', {"list":this.getPlayerlistObj(false)});
	}
	sendVotes(){
		var votes = [];
		for(var i = 0; i < this.playerlist.length; i++)
			votes.push(this.playerlist[i].getVote(this.state.name));
		this.io.to(this.id).emit('vote_cards', {"votes":votes});
	}
	sendPlayerInfo(){
		for(var i = 0; i < this.playerlist.length; i++){
			var p = this.playerlist[i];
			p.socket.emit('player_info', {"title":p.character.name,"description":p.character.description,"info":p.character.getInfo(p,this.playerlist)});
		}
	}
	sendModule(moduleType){
		for(var i = 0; i < this.playerlist.length; i++){
			var p = this.playerlist[i];
			if(p.is_king && moduleType=="King"){
				p.socket.emit('show_module', {"module":"next-button", "is_disabled":true});
				this.module_timer = setTimeout(function(player){
					player.socket.emit('show_module', {"module":"next-button", "is_disabled":false});
				}, 10000, p);
			}
			else if(p.character.name=="Assassin" && moduleType=="Assassin"){
				p.socket.emit('show_module', {"module":"kill-button", "is_disabled":true});
				this.module_timer = setTimeout(function(player){
					player.socket.emit('show_module', {"module":"kill-button", "is_disabled":false});
				}, 10000, p);
			}
			else if(p.is_quester && moduleType=="Quester"){
				p.socket.emit('show_module', {"module":"questing", "is_disabled":true});
			}
		}
	}
	sendState(){
		if(this.state != null)
			this.io.to(this.id).emit('state', this.state.getStateObj());
	}
	sendTimer(timer){
		this.io.to(this.id).emit('timer', {"timer": timer});
	}
	sendQuestCard(){
		this.io.to(this.id).emit('quest_card');
	}

	//Get Functions
	getPlayerByName(name){
		for(var i = 0; i < this.playerlist.length; i++)
			if(this.playerlist[i].name == name)
				return this.playerlist[i];
	}
	getPlayerByChar(character){
		for(var i = 0; i < this.playerlist.length; i++)
			if(this.playerlist[i].character.name==character)
				return this.playerlist[i];
	}
	getPlayerlistObj(){
		var list = [];
		for(var i = 0; i < this.playerlist.length; i++){
			var p = this.playerlist[i];
			var tags = (p.is_king ? " king" : "") + (p.is_quester ? " quester" : "") + (p.is_target ? " target" : "") + (p.is_lady ? " lady" : "");
			list.push({"username":p.name,"tags":tags,"vote":p.getVote(this.state.name)});
		}
		return list;
	}
	getPlayerlist2Obj(with_character){
		var list = [];
		for(var i = 0; i < this.playerlist.length; i++){
			var p = this.playerlist[i];
			var tags = (p.is_king ? " king" : "") + (p.is_quester ? " quester" : "") + (p.is_target ? " target" : "") + (p.is_lady ? " lady" : "") + (p.character.allegiance=="Good" ? " good": " evil");
			list.push({"username":p.name,"tags":tags,"vote":p.getVote(this.state.name), "character": (with_character ? p.character.name : "")});
		}
		return list;
	}
	getVotes(){
		var votes = [];
		for(var i = 0; i < this.playerlist.length; i++)
			votes.push(this.playerlist[i].getVote(this.state.name));
		return votes;
	}
	getQuestCards(){
		var cards = [];
		for(var i = 0; i < this.playerlist.length; i++){
			if(this.playerlist[i].is_quester){
				if(this.state.name == "QuestingReveal"){
					cards.push(this.playerlist[i].quest_succeed ? "good" : "evil");
				}
				else if(this.playerlist[i].quested){
					cards.push("back");
				}
			}
		}
		return this.shuffle(cards);
	}
	setNextKing(){
		for(var i = 0; i < this.playerlist.length; i++){
			if(this.playerlist[i].is_king){
				this.playerlist[i].is_king = false;
				if(i+1==this.playerlist.length)
					this.playerlist[0].is_king = true;
				else
					this.playerlist[i+1].is_king = true;
				return;
			}
		}
	}

	//Username Functions
	assignUsername(username){
		if(username==null)
			username="";
		username = username.trim();
		username = username.substring(0, 10);
		var curnames = [];
		for(var i = 0; i < this.playerlist.length; i++)
			curnames.push(this.playerlist[i].name);
		if(username=="")
			return this.anonUsername(curnames).trim();
		if(curnames.includes(username)){
			if(username.startsWith("Anon"))
				return this.anonUsername(curnames).trim();
			else
				return this.usernamePlusOne(curnames,username).trim();
		}
		return username.trim();
	}
	anonUsername(curnames){
		var data = fs.readFileSync(__dirname+'/animals.txt', 'utf8').split("\n");
		var animal = "";
		var username = "Anon";
		while(animal==""||animal==null||curnames.includes(username+animal)){
			animal = data[Math.floor(Math.random() * data.length)];
		}
		return username+animal;
	}
	usernamePlusOne(curnames,username){
		username = username.substring(0, 9);
		if(!curnames.includes(username))
			return username;
		var i=1;
		while(curnames.includes(username+i))
			i++;
		return username+i;
	}

	//Array Functions
	shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;
		//While there remain elements to shuffle
		while (0 != currentIndex) {
			//Pick a remaining element
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			//And swap it with the current element
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}
		return array;
	}
	remove(array, element) {
    	var index = array.indexOf(element);
    	if (index != -1)
        	array.splice(index, 1);
	}
}

module.exports = Game;
