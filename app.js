const express = require('express');
const app = express();

const http = require('http');
const { eventNames } = require('process');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

var level = 1;
var gridRow = 4; // Number of rows in the grid
const port = 3000;
var playerLength = 1;
var playerNum = 0;
var inProgress = false;
var winner = null;
var remainingTime = 0;

const players = {
}
var correctData = [];

function generateCorrect() {
    var i = 0;
    correctData = [];
    while (i < level + 2) {
        var randomIndex = Math.ceil(Math.random() * (gridRow * gridRow));
            if (!correctData.includes(randomIndex)) {
                correctData.push(randomIndex);
                i++;

        }
    }
}


app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(
    port, 
    () => {
        console.log(`Server is running on ${port}`);
    }
)
io.on('connection', (socket) => {
    level = 1;
    gridRow = 4;
    console.log('a user connected');
    players[socket.id] = {  
        score: 0,
        cellsClicked: [],
        lives: 3,
        chances: 3,
        username: 'Guest',
        ready: false,
        finished: false
    }
    
    if (!inProgress){
generateCorrect();
    io.emit('players', players, correctData);
    console.log(players);
    console.log(correctData);
    }
    

    socket.on('updatePlayers', (player, id) => {
        console.log('Updating player:', player);
        players[id].username = player.username;
        io.emit('update', players, socket.id);
    });
    socket.on('goHome' , () => {
        level = 1;
        gridRow = 4;
        for(const p in players){
        players[p].ready = false;
        players[p].score = 0;
        players[p].cellsClicked = [];
        players[p].lives =3;
        players[p].chances = 3;
        }
        socket.emit('players', players, correctData);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete players[socket.id];
        io.emit('disconnected', players, socket.id);
    });
    socket.on('ready', (player, id) => {
        players[id].ready = player.ready;
        let allReady = true;
        for (const p in players) {
            if (!players[p].ready) {
                allReady = false;
                break;
            }
        }
        if (allReady) {
            inProgress = true;
            loadRound(id);
        }
        else{
        io.emit('update', players, socket.id);
        }
    });
    
    socket.on('cellClicked', (num, player) => {
        console.log('Cell clicked by:', player);
        players[socket.id].cellsClicked.push(num);
        io.emit('cellClicked', num, player);
    });

    socket.on('lostGame', (frontEndPlayers, player) => {
        players[player].finished = true;
        console.log('Game lost by:', player); 
        var dead = true;
        for (const id in players){
            if (players[id].finished === false){
                dead = false;
            }
        }
        if (dead && remainingTime > 50){
                 clearInterval(roundTimer);
           startRoundTimer(5);
  setTimeout(()=>{
            
                loadRound(player);
            
        }, 5000);
        }
        io.emit('lostGame', frontEndPlayers, player);
    });

    socket.on('gameOver', (players) => {
        for (const p in players){
            players[p].ready = false;
        }
        clearInterval(roundTimer);
        inProgress = false;
        io.emit('gameOver', players);

    });
    socket.on('wonRound', (frontEndPlayers, player) => {
        if (winner === null){
            winner = player;
            players[player].score += level * 10;
        }
        players[player].finished = true;
        var allFinished = true;
        for(const id in players){
            if (players[id].finished === false){

                allFinished = false;
                break;
            }
        }
         console.log('dopadown');
            io.emit('finished', players[player], player);
        if (allFinished && remainingTime > 50){
           clearInterval(roundTimer);
           startRoundTimer(5);
  setTimeout(()=>{
            if (allFinished){
                loadRound(player);
            }
        }, 5000);
        }
        
           
   
   
       
    });

    socket.on('deadRound', (player) => {
        
        if (remainingTime > 50){
clearInterval(roundTimer);
        startRoundTimer(5);
            setTimeout(() => {
            
            loadRound(player);
        }, 5000);
        }
        
        
    });
    socket.on('updateScore', (playerData, player) => {
        players[socket.id].lives = playerData.lives;
        players[socket.id].score = playerData.score;
        players[socket.id].chances = playerData.chances;

        io.emit('score', players[socket.id], player);
    });

    // Handle other socket events here
});

function loadRound(player){
     winner = null;   
     var allDead = true;
     for(const id in players){
        if (players[id].lives > 0){
            allDead = false;
            break;
        }
     }
     if (allDead){
        io.emit('gameOver', players);
        return;
     }
     level++;
        gridRow = 4 + Math.ceil(level / 3)
        if (gridRow > 9) {
            gridRow = 9;
        }
        generateCorrect();
        for (const p in players) {
            players[p].cellsClicked = [];
            players[p].ready = false;
            players[p].chances = 3;
            if (players[p].lives > 0){
            players[p].finished = false;
            }
        }
        timeOut(level, player);
        clearInterval(roundTimer);
        startRoundTimer(23);
        io.emit('nextRound', player, players, correctData, level, gridRow);
}

function finished (){
    for (const id in players){
        if (players[id].finished != true){
            players[id].lives-=1;
        }
    }
}

function timeOut(preLevel, player){
    setTimeout(() => {
        if (level === preLevel){
            finished();
            loadRound(player);
        }
    }, 23000);
}

let roundTimer = undefined;
function startRoundTimer(time) {

    remainingTime = time * 10; // Seconds for the round
    roundTimer = setInterval(() => {
        if (remainingTime <= 0){
            clearInterval(roundTimer);
        }
        remainingTime--;
        io.emit('updateTime',remainingTime);
    }, 100);
}
