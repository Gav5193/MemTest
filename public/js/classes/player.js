class Player {
    constructor(score, correct, lives, username, num, mode){
        this.score = score;
        this.correct = correct;
        this.lives = lives;
        this.chances = 3;
        this.username = username;
        this.cellsClicked = [];
        this.correctData = [];
        this.playerNumber = num;
        this.ready = false;
        this.mode = mode;
    }
}