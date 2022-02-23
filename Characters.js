class Character{
	constructor(name, description, allegiance){
		this.name = name;
		this.description = description;
		this.allegiance = allegiance;
	}

	getInfo(player, playerlist){
		return "";
	}

	newCharacter(charName){
		switch(charName){
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

class Spectator extends Character{
	constructor(){
		super("Spectator","For watching the game or waiting for it to start.","None");
	}
}

class Merlin extends Character{
	constructor(){
		super("Merlin","Knows evil, must remain hidden.","Good");
	}

	getInfo(player, playerlist){
		var info = '<p>Evil Players:</p>';
		for(var i = 0; i < playerlist.length; i++){
			if(playerlist[i].character.allegiance=="Evil" && playerlist[i].character.name!="Mordred"){
				info+='<p>'+playerlist[i].name+'</p>';
			}
		}
		return info;
	}
}

class Assassin extends Character{
	constructor(){
		super("Assassin","Minion of Mordred. Gets a chance to assassinate Merlin at the end of the game.","Evil");
	}

	getInfo(player, playerlist){
		var info = '<p>Other Evil Players:</p>';
		for(var i = 0; i < playerlist.length; i++){
			if(playerlist[i].character.allegiance=="Evil" && playerlist[i].character.name!="Oberon" && player.name!=playerlist[i].name){
				info+='<p>'+playerlist[i].name+'</p>';
			}
		}
		return info;
	}
}

class Percival extends Character{
	constructor(){
		super("Percival","Knows Merlin and Morgana, but not which is which.","Good");
	}

	getInfo(player, playerlist){
		var info = '<p>Merlin/Morgana:</p>';
		for(var i = 0; i < playerlist.length; i++){
			if(playerlist[i].character.name=="Merlin" || playerlist[i].character.name=="Morgana"){
				info+='<p>'+playerlist[i].name+'</p>';
			}
		}
		return info;
	}
}

class Morgana extends Character{
	constructor(){
		super("Morgana","Appears as Merlin to Percival.","Evil");
	}

	getInfo(player, playerlist){
		var info = '<p>Other Evil Players:</p>';
		for(var i = 0; i < playerlist.length; i++){
			if(playerlist[i].character.allegiance=="Evil" && playerlist[i].character.name!="Oberon" && player.name!=playerlist[i].name){
				info+='<p>'+playerlist[i].name+'</p>';
			}
		}
		return info;
	}
}

class Mordred extends Character{
	constructor(){
		super("Mordred","Unknown to Merlin.","Evil");
	}

	getInfo(player, playerlist){
		var info = '<p>Other Evil Players:</p>';
		for(var i = 0; i < playerlist.length; i++){
			if(playerlist[i].character.allegiance=="Evil" && playerlist[i].character.name!="Oberon" && player.name!=playerlist[i].name){
				info+='<p>'+playerlist[i].name+'</p>';
			}
		}
		return info;
	}
}

class Oberon extends Character{
	constructor(){
		super("Oberon","Unknown to evil.","Evil");
	}
}

class BasicGood extends Character{
	constructor(){
		super("BasicGood","Loyal Servant of Arthur.","Good");
	}
}

class BasicEvil extends Character{
	constructor(){
		super("BasicEvil","Minion of Mordred.","Evil");
	}

	getInfo(player, playerlist){
		var info = '<p>Other Evil Players:</p>';
		for(var i = 0; i < playerlist.length; i++){
			if(playerlist[i].character.allegiance=="Evil" && playerlist[i].character.name!="Oberon" && player.name!=playerlist[i].name){
				info+='<p>'+playerlist[i].name+'</p>';
			}
		}
		return info;
	}
}

module.exports = {Character, Spectator, Merlin, Assassin, Percival, Morgana, Mordred, Oberon, BasicGood, BasicEvil};
