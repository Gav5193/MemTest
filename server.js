const express = require('express');
const { appendFileSync } = require('fs');
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
var winner = null;
var remainingTime = 0;

const gameData = {
    
}
const inProgress = {
    "endless": false,
    "ten": false,
    "twenty": false
}

const players = {
    
}
var correctData = [];


app.set('view engine', 'ejs');

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
    res.render('home');
});

app.get('/multiplayer', (req, res)=>{
    res.render('multiplayer');
});

app.get('/endlessMode' , (req,res)=>{
    res.render('endlessMulti');
});

server.listen(
    port,
    () => {
        console.log(`Server is running on ${port}`);
    }
)
io.on('connection', (socket) => {
    
    socket.emit('check', inProgress);

    socket.on('updateUsername', (player, mode) => {
        console.log('Updating player:', player);
        players[socket.id].username = player.username;
        io.to(mode).emit('update', players, socket.id);
    });
    socket.on('Lobby', (username, mode) => {
        if (inProgress[mode] === false){
        level = 1;
        gridRow = 4;
       
        players[socket.id] = {
            score: 0,
            cellsClicked: [],
            lives: 3,
            chances: 3,
            username: 'Guest' || username,
            ready: false,
            finished: false,
            mode: mode
        }

        socket.join(mode);
        io.to(mode).emit('Lobby', getPlayersInMode(mode), mode);

    }
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (players[socket.id]){
        var mode = players[socket.id].mode;
        delete players[socket.id];
        var length = 0;
        for(const id in players){
            if (players[id].mode === mode){
                length++;
            }
        }
        if (length === 0) {
            console.log('loaded out')
            clearInterval(roundTimer)
            inProgress[mode] = false;
            return;
        }
        io.to(mode).emit('disconnected', players, socket.id);
        var dead = true;
        for (const id in players) {
            if (players[id].finished === false && players[id].mode === mode) {
                dead = false;
            }
        }

        if (dead && remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(socket.id, 3);
            setTimeout(() => {
                for (const id in players) {
                    if (players[id].mode === mode){
                    console.log('DCload')
                    loadRound(id, false, mode);
                    break;
                    }
                }

            }, 3000);
        }
        }
    });
    socket.on('ready', (player, id) => {
        var mode = players[socket.id].mode
        players[id].ready = player.ready;
        let allReady = true;
        var length = 0;
        for (const p in players) {
            
            if (!players[p].ready && players[p].mode === players[socket.id].mode) {
                allReady = false;
                break;
            }
        }
        if (allReady) {
            inProgress[mode] = true;
            loadRound(id, true, mode);
        }
        else {
            io.to(players[socket.id].mode).emit('update', getPlayersInMode(players[socket.id].mode), socket.id);

        }
    });

    socket.on('cellClicked', (num, player) => {
        console.log('Cell clicked by:', player);
        players[socket.id].cellsClicked.push(num);
        io.to(players[socket.id].mode).emit('cellClicked', num, socket.id);
    });

    /*
    socket.on('lostGame', (frontEndPlayers, player) => {
        players[socket.id].finished = true;
        console.log('Game lost by:', player);
        var dead = true;
        for (const id in players) {
            if (players[id].finished === false && players[id].mode === players[socket.id].mode) {
                dead = false;
            }
        }
        if (dead && remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(socket.id, 3);
            setTimeout(() => {

                loadRound(player, false);

            }, 3000);
        }
        io.to(players[socket.id].mode).emit('lostGame', frontEndPlayers, player);
    });
    /*
    socket.on('gameOver', (players) => {
        for (const p in players) {
            players[p].ready = false;
        }
        clearInterval(roundTimer);
        inProgress = false;
        io.to(players[socket.id].mode).emit('gameOver', players);

    });*/
    socket.on('wonRound', (frontEndPlayers, player) => {
        var mode = players[socket.id].mode
        if (winner === null) {
            winner = player;
            players[player].score += level * 10;
        }
        players[player].finished = true;
        var allFinished = true;
        for (const id in players) {
            if (players[id].finished === false && players[id].mode === players[socket.id].mode) {

                allFinished = false;
                break;
            }
        }
        console.log('dopadown');
        io.to(players[socket.id].mode).emit('finished', players[player], player);
        if (allFinished && remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(socket.id, 3);
            setTimeout(() => {
                if (allFinished) {
                    
                    loadRound(player, false, mode);
                }
            }, 3000);
        }
    });
    /*
    socket.on('deadRound', (player) => {

        if (remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(socket.id, 3);
            setTimeout(() => {

                loadRound(player, false);
            }, 3000);
        }


    });*/
    socket.on('updateScore', (playerData, player) => {
        var mode = players[socket.id].mode
        players[socket.id].lives = playerData.lives;
        players[socket.id].score = playerData.score;
        players[socket.id].chances = playerData.chances;
        console.log(players);
            let allDead = true;
            let deadRound = true;
            for (const key in players) {
                if (players[key].mode === players[socket.id].mode){
                    if (players[key].lives >= 1) {
                        allDead = false;
                    }
                    if (players[key].chances >= 1) {
                        deadRound = false;
                    }
                }
            }
            if (allDead) {
                for (const p in players) {
                    if (players[p].mode === players[socket.id].mode){
                    players[p].ready = false;
                    }
                }
                clearInterval(roundTimer);
                inProgress[players[socket.id].mode] = false;
                io.to(players[socket.id].mode).emit('gameOver', getPlayersInMode(players[socket.id].mode));
                io.emit('check', inProgress);
                return;
            }
            if (deadRound && player === socket.id) {
                
                if (remainingTime > 30) {
                    clearInterval(roundTimer);
                    startRoundTimer(socket.id, 3);
                    setTimeout(() => {
                        if(players[socket.id]){

                loadRound(player, false, mode);
                    }
            }, 3000);
        }
            }
            if (players[player].chances <= 0) {

                 players[player].finished = true;
        console.log('Game lost by:', player);
        var dead = true;
        for (const id in players) {
            if (players[id].finished === false) {
                dead = false;
            }
        }
        if (dead && remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(socket.id, 3);
            setTimeout(() => {
                if (players[player]){
                loadRound(player, false, mode);

            }
            }, 3000);
        }
                io.to(players[socket.id].mode).emit('lostGame', getPlayersInMode(players[socket.id].mode), player);
                io.to(players[socket.id].mode).emit('score', players[player], player);
            }

        io.to(players[socket.id].mode).emit('score', players[socket.id], player);
    });

    // Handle other socket events here
});

function loadRound(player, isNewGame, currentmode) {
    if (inProgress[currentmode] == false){
        return;
    }
    var mode = currentmode
    winner = null;
    var allDead = true;
    for (const id in players) {
        if (players[id].lives > 0 && players[id].mode === mode) {
            allDead = false;
            break;
        }
    }
    if (allDead) {
        io.to(mode).emit('gameOver', players);
        return;
    }
    level++;
    gridRow = 4 + Math.ceil(level / 3)
    if (gridRow > 9) {
        gridRow = 9;
    }
    generateCorrect();
    for (const p in players) {

        if (players[p].mode === mode){
        players[p].cellsClicked = [];
        players[p].ready = false;

        if (players[p].lives > 0) {
            players[p].finished = false;
            players[p].chances = 3;
        }
    }
    }
    timeOut(level, player);
    clearInterval(roundTimer);
    startRoundTimer(player, 23);
    io.to(mode).emit('nextRound', player, getPlayersInMode(mode), correctData, level, gridRow, isNewGame);
}

function finished(socketID) {
    for (const id in players) {
        if (players[id].finished != true && players[id].lives > 0 && players[id].mode === players[socketID].mode) {
            players[id].lives -= 1;
        }
    }
}

function timeOut(preLevel, player) {
    setTimeout(() => {
        if (level === preLevel) {
            
            if (players[player]){
                var mode = players[player].mode
                finished(player);
                loadRound(player, false,mode);
            }
        }
    }, 23000);
}

let roundTimer = undefined;
function startRoundTimer(id, time) {
    var mode = players[id].mode
    remainingTime = time * 10; // Seconds for the round
    roundTimer = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(roundTimer);
        }
        remainingTime--;
        io.to(mode).emit('updateTime', remainingTime);
    }, 100);
}
function getPlayersInMode(mode) {
    const playersInMode = {};
    for (const id in players) {
        if (players[id].mode === mode) {
            playersInMode[id] = players[id];
        }
    }
    return playersInMode;
}