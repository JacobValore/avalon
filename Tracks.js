class Tracks{
	constructor(num_players){
		this.quest_track = this.getNewQT();
		this.num_questers = [];
		this.cur_vote = 1;
		this.cur_quest = 1;
        switch(num_players) {
            case 5: this.num_questers = [2,3,2,3,3]; break;
            case 6: this.num_questers = [2,3,4,3,4]; break;
            case 7: this.num_questers = [2,3,3,4,4]; break;
            default: this.num_questers = [3,4,4,5,5]; break;
        }
	}

	getNewQT(){
		return [{"token": "", "questers": ""}, {"token": "", "questers": ""}, {"token": "", "questers": ""}, {"token": "", "questers": ""}, {"token": "", "questers": ""}];
	}

	getWinner(){
		var good = 0;
		var evil = 0;
		for(var i = 0; i < this.quest_track.length; i++){
			if(this.quest_track[i].token == "good")
				good++;
			else if(this.quest_track[i].token == "evil")
				evil++;
		}
		if(good == 3)
			return "good";
		else if(evil == 3)
			return "evil";
		else
			return "none";
	}

	failsReq(){
		return (this.cur_quest == 4 && this.num_questers[3] >= 4) ? 2 : 1;
	}

	resetVT(){
		this.cur_vote=1;
	}
	setQT(quest_succeed, playerlist){
		this.quest_track[this.cur_quest-1].token = quest_succeed ? "good" : "evil";
		for(var i = 0; i < playerlist.length; i++){
			if(playerlist[i].is_quester)
				this.quest_track[this.cur_quest-1].questers += "<p>"+playerlist[i].name+"</p>";
		}
		this.cur_quest++;
	}
	getCurQuesters(){
		return this.num_questers[this.cur_quest-1];
	}
	getLastQT(){
		return this.quest_track[this.cur_quest-2];
	}
}

module.exports = Tracks;
