const Character = require('./Characters.js');

class Player{
	constructor(name, socket){
		this.name = name;
		this.socket = socket;
		this.character = new Character.Spectator();
		this.is_king = false;
		this.is_quester = false;
		this.is_target = false;
		this.is_lady = false;

		//for LOBBY
		this.is_ready = false;
		//for VOTING
		this.voted = false;
		this.vote_approve = false;
		//for QUESTING
		this.quested = false;
		this.quest_succeed = false;
	}

	getVote(state){
		switch(state) {
			case "Lobby": return this.is_ready ? "ready" : "";
			case "KingChoose": return this.voted ? "ready" : "";
			case "Voting": return this.voted ? "ready" : "";
			case "VotingReveal": return this.vote_approve ? "yes" : "no";
			default: return this.vote_approve ? "yes" : "no";
		}
	}

	sendTileSelection(state){
		if(state=="KingChoose" || state=="Voting"){
			this.socket.emit('select_tile', {"selected":(this.voted?(this.vote_approve?"whiteball":"blackball"):"deselect")});
		}
		else if(state=="Questing"){
			this.socket.emit('select_tile', {"selected":this.quest_succeed?"succeed":"fail"});
		}
	}

	sendCurGame(game){
		this.socket.emit('playerlist', {"list":game.getPlayerlistObj()});
		this.socket.emit('state', game.state.getStateObj());
	}
}

module.exports = Player;
