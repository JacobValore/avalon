const Character = require('./Characters.js');

class State{
	constructor(name, description){
		this.name = name;
		this.description = description;

		//IF JOIN IN PROGRESS:
		//Send playerlist w votes
		//Send player their player-info
		//Remove ready-button and set-playername
		//Set cur on QT and update qt-good/qt-evil
		//Set cur on VT and update vt-color
	}
	getStateObj(){}
	endState(){}

	newCharacter(charName){
		switch (charName) {
			case "Spectator": return new Character.Spectator(); break;
			case "Merlin": return new Character.Merlin(); break;
			case "Assassin": return new Character.Assassin(); break;
			case "Percival": return new Character.Percival(); break;
			case "Morgana": return new Character.Morgana(); break;
			case "Mordred": return new Character.Mordred(); break;
			case "Oberon": return new Character.Oberon(); break;
			case "BasicGood": return new Character.BasicGood(); break;
			case "BasicEvil": return new Character.BasicEvil(); break;
		}
	}
}

class Lobby extends State{
	constructor(game){
		super("Lobby","Waiting for players to join.");
		this.game = game;
		//Remove all characteristics from characters
		for(var i = 0; i < this.game.playerlist.length; i++){
			var p = this.game.playerlist[i];
			p.is_ready = false;
			p.is_king = false;
			p.is_quester = false;
			p.is_target = false;
			p.is_lady = false;
			p.voted = false;
			p.vote_approve = false;
			p.quested = false;
			p.quest_succeed = false;
			p.character = this.newCharacter("Spectator");
		}
		this.game.sendPlayerInfo();
		//reset tracks
		this.game.tracks = null;
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"playerlist":this.game.getPlayerlistObj()};
	}
	endState(){
		if(this.game.playerlist.length < 5)
			return;
		//Assign characters
		var characters = ["BasicGood","Merlin","Assassin","Percival","Morgana","BasicGood","Mordred","BasicGood","BasicGood","Oberon"];
		characters.length = this.game.playerlist.length;
		this.game.shuffle(characters);
		for(var i = 0; i < this.game.playerlist.length; i++){
			this.game.playerlist[i].character = this.newCharacter(characters.pop());
		}
		//Choose king
		this.game.playerlist[Math.floor(Math.random()*this.game.playerlist.length)].is_king = true;
		//Set QT to 1 and VT to 1
		//Send players their player-info
		this.game.sendPlayerInfo();
		//Set state to KingChoose
		this.game.state = new KingChoose(this.game);
	}
}
class KingChoose extends State{
	constructor(game){
		super("KingChoose","King is choosing quest.");
		this.game = game;
		for(var i = 0; i < this.game.playerlist.length; i++){
			var p = this.game.playerlist[i];
			p.is_quester = false;
			p.voted = false;
			p.vote_approve = false;
			p.quested = false;
			p.quest_succeed = false;
		}
		this.game.sendVotes();
		this.game.sendModule("King");
		//IF FROM LOBBY, VOTING, OR QUESTING REVEAL:
		//Remove old king's next button
		//Remove questing cards
		//Remove shields from players
		//Remove ready-button and set-playername
		//Set cur on QT and update qt-good/qt-evil
		//Set cur on VT and update vt-color
		//Set state message
		//Send current shields and send king icon (w/ playerlist)


		//Send king their next button (and send them "Click player's dot to give them a shield!")


		//DURING: UPDATE SHIELDS
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"playerlist":this.game.getPlayerlistObj(),
		"qt":this.game.tracks.quest_track,
		"num_qs":this.game.tracks.num_questers,
		"c_qt":this.game.tracks.cur_quest,
		"c_vt":this.game.tracks.cur_vote};
	}
	endState(){
		this.game.state = new Voting(this.game);
	}
}
class Voting extends State{
	constructor(game){
		super("Voting","Vote on the quest.");
		this.game = game;
		this.game.sendModule("King");
		//IF FROM KING CHOOSE
		//Set votes to gray (unready)
		//Remove old king's next button
		//Show voting tiles
		//Set state message

		//Send message to players: "Vote on quest by clicking the bottom-left tiles."

		//DURING: Update ready vote tags
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"votes":this.game.getVotes()};
	}
	endState(){
		//Count the vote, set state to Voting Reveal and include result
		var count = 0;
		for(var i = 0; i < this.game.playerlist.length; i++)
			if(this.game.playerlist[i].vote_approve)
				count++;
		this.game.state = new VotingReveal(this.game, count > this.game.playerlist.length/2 ? "approved" : "rejected");
	}
}
class VotingReveal extends State{
	constructor(game, result){
		super("VotingReveal","The vote "+result+".");
		this.game = game;
		this.result = result;

		//if vote failed and VT==5
		if(this.result=="rejected" && this.game.tracks.cur_vote == 5)
			this.endState();

		var timer = 10;
		game.sendTimer(timer);
		this.timerInterval = setInterval(function(){
			timer--;
			game.sendTimer(timer);
			if(timer==0){
				game.state.endState();
				game.sendState();
			}
		},1000);
		//IF FROM VOTING:
		//Remove voting tiles in sb
		//Set state message
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"votes":this.game.getVotes()};
	}
	endState(){
		if(this.timerInterval != null)
			clearInterval(this.timerInterval);
		//IF VOTE FAILED && VT==5:
		//Set state to Win (Evil)
		if(this.result=="rejected" && this.game.tracks.cur_vote == 5)
			this.game.state = new Win(this.game, "Evil");
		//IF VOTE FAILED:
		//Add one to VT
		//Set next king
		//Set state to King Choose
		else if(this.result=="rejected"){
			this.game.tracks.cur_vote++;
			this.game.setNextKing();
			this.game.state = new KingChoose(this.game);
		}
		//IF VOTE PASSED:
		//Set state to Questing
		else if(this.result=="approved")
			this.game.state = new Questing(this.game);
	}
}
class Questing extends State{
	constructor(game){
		super("Questing","Waiting for questers.");
		this.game = game;
		this.game.sendModule("Quester");
		//IF FROM VOTING REVEAL:
		//Set state message

		//Give questers their quest cards
		//Send message to questers: "Choose whether to succeed or fail quest."

		//DURING: Place quest cards on table
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"cards":this.game.getQuestCards()};
	}
	endState(){
		var fail_count = 0;
		for(var i = 0; i < this.game.playerlist.length; i++)
			if(this.game.playerlist[i].is_quester && !this.game.playerlist[i].quest_succeed)
				fail_count++;
		this.game.state = new QuestingReveal(this.game, fail_count >= this.game.tracks.failsReq() ? "failed" : "succeeded");
		//Check quest result, set state to Questing Reveal and include result
	}
}
class QuestingReveal extends State{
	constructor(game, result){
		super("QuestingReveal","The quest "+result+"!");
		this.game = game;
		this.game.tracks.setQT((result=="succeeded" ? true : false), this.game.playerlist);

		var timer = 10;
		game.sendTimer(timer);
		this.timerInterval = setInterval(function(){
			timer--;
			game.sendTimer(timer);
			if(timer==0){
				game.state.endState();
				game.sendState();
			}
		},1000);
		//IF FROM QUESTING:
		//Set cur on QT and update qt-good/qt-evil
		//Remove quest cards from questers
		//Set state message

		//Give king next button
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"result":this.game.tracks.getLastQT(),
		"cards":this.game.getQuestCards()};
	}
	endState(){
		if(this.timerInterval != null)
			clearInterval(this.timerInterval);
		switch(this.game.tracks.getWinner()){
			case "none":
				this.game.setNextKing();
				this.game.tracks.resetVT();
				this.game.state = new KingChoose(this.game);
				this.game.sendState();
				break;
			case "evil":
				this.game.state = new Win(this.game, "Evil");
				break;
			case "good":
				this.game.state = new Assassin(this.game);
				break;
		}
		//IF NOBODY WON: (continue play)
		//Set next king
		//Set vote track to 1
		//Set state to King Choose
		//IF EVIL WON:
		//Set state to Win (Evil)
		//IF GOOD WON:
		//Set state to Assassin
	}
}
class Assassin extends State{
	constructor(game){
		super("Assassin","Assassin deliberating on target.");
		this.game = game;
		this.got_merlin = false;
		this.game.sendModule("Assassin");
		//IF FROM QUESTING REVEAL:
		//Set state message

		//Add assassin's kill button
		//Send message to assassin: "Click the player you want to assassinate and then press Kill"


		//DURING: Assassin token
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"playerlist":this.game.getPlayerlist2Obj(false)};
	}
	endState(){
		if(this.got_merlin){
			this.game.state = new Win(this.game, "Evil");
		}
		else{
			this.game.state = new Win(this.game, "Good");
		}
		//Check if assassin got merlin
		//Post a message in chat about whether or not the assassin killed merlin
		//Set state to Win (winner)
	}
}
class Win extends State{
	constructor(game, winner){
		super("Win",winner+" wins!");
		this.game = game;
		//IF FROM VOTING REVEAL:
		//Remove king's next button
		//Set state message
		//Remove assassin's kill button
		//Add next game button
		//Reveal characters under name?
	}
	getStateObj(){
		return {"state":this.name,
		"description":this.description,
		"playerlist":this.game.getPlayerlist2Obj(true)};
	}
	endState(){
		this.game.state = new Lobby(this.game);
		//Set state to Lobby
	}
}

module.exports = {State, Lobby, KingChoose, Voting, VotingReveal, Questing, QuestingReveal, Assassin, Win};
