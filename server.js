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

const inProgress = {
    "endless": false,
    "ten": false,
    "twenty": false
}

const players = {
    "endless": {},
    "ten": {},
    "twenty": {}
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

      

    socket.on('updateUsername', (player, mode) => {
        console.log('Updating player:', player);
        players[mode][socket.id].username = player.username;
        io.emit('update', players, socket.id);
    });
    socket.on('Lobby', (mode) => {
        level = 1;
        gridRow = 4;
        if (inProgress[mode]===false){
        players[mode][socket.id] = {
            score: 0,
            cellsClicked: [],
            lives: 3,
            chances: 3,
            username: 'Guest',
            ready: false,
            finished: false,
            mode: mode
        }}

        socket.join(mode);
        socket.emit('Lobby', players[mode], mode);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete players[socket.id];
        if (Object.keys(players).length === 0) {
            inProgress = false;
            socket.emit('home', players, correctData);
            return;
        }
        io.emit('disconnected', players, socket.id);
        var dead = true;
        for (const id in players) {
            if (players[id].finished === false) {
                dead = false;
            }
        }
        if (dead && remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(3);
            setTimeout(() => {
                for (const id in players) {
                    console.log('DCload')
                    loadRound(id, false);
                    break;
                }

            }, 3000);
        }
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
            loadRound(id, true);
        }
        else {
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
        for (const id in players) {
            if (players[id].finished === false) {
                dead = false;
            }
        }
        if (dead && remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(3);
            setTimeout(() => {

                loadRound(player, false);

            }, 3000);
        }
        io.emit('lostGame', frontEndPlayers, player);
    });

    socket.on('gameOver', (players) => {
        for (const p in players) {
            players[p].ready = false;
        }
        clearInterval(roundTimer);
        inProgress = false;
        io.emit('gameOver', players);

    });
    socket.on('wonRound', (frontEndPlayers, player) => {
        if (winner === null) {
            winner = player;
            players[player].score += level * 10;
        }
        players[player].finished = true;
        var allFinished = true;
        for (const id in players) {
            if (players[id].finished === false) {

                allFinished = false;
                break;
            }
        }
        console.log('dopadown');
        io.emit('finished', players[player], player);
        if (allFinished && remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(3);
            setTimeout(() => {
                if (allFinished) {
                    loadRound(player, false);
                }
            }, 3000);
        }
    });

    socket.on('deadRound', (player) => {

        if (remainingTime > 30) {
            clearInterval(roundTimer);
            startRoundTimer(3);
            setTimeout(() => {

                loadRound(player, false);
            }, 3000);
        }


    });
    socket.on('updateScore', (playerData, player) => {
        players[socket.id].lives = playerData.lives;
        players[socket.id].score = playerData.score;
        players[socket.id].chances = playerData.chances;
        console.log(players);
            let allDead = true;
            let deadRound = true;
            for (const key in players) {
                if (players[key].lives >= 1) {
                    allDead = false;
                }
                if (players[key].chances >= 1) {
                    deadRound = false;
                }
            }
            if (allDead) {
                for (const p in players) {
            players[p].ready = false;
        }
        clearInterval(roundTimer);
        inProgress = false;
        io.emit('gameOver', players);
                return;
            }
            if (deadRound && player === socket.id) {
                
                if (remainingTime > 30) {
                    clearInterval(roundTimer);
                    startRoundTimer(3);
                    setTimeout(() => {

                loadRound(player, false);
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
            startRoundTimer(3);
            setTimeout(() => {

                loadRound(player, false);

            }, 3000);
        }
        io.emit('lostGame', players, player);
                io.emit('score', players[player], player);
            }

        io.emit('score', players[socket.id], player);
    });

    // Handle other socket events here
});

function loadRound(player, isNewGame) {

    winner = null;
    var allDead = true;
    for (const id in players) {
        if (players[id].lives > 0) {
            allDead = false;
            break;
        }
    }
    if (allDead) {
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

        if (players[p].lives > 0) {
            players[p].finished = false;
            players[p].chances = 3;
        }
    }
    timeOut(level, player);
    clearInterval(roundTimer);
    startRoundTimer(23);
    io.emit('nextRound', player, players, correctData, level, gridRow, isNewGame);
}

function finished() {
    for (const id in players) {
        if (players[id].finished != true && players[id].lives > 0) {
            players[id].lives -= 1;
        }
    }
}

function timeOut(preLevel, player) {
    setTimeout(() => {
        if (level === preLevel) {
            finished();
            loadRound(player, false);
        }
    }, 23000);
}

let roundTimer = undefined;
function startRoundTimer(time) {

    remainingTime = time * 10; // Seconds for the round
    roundTimer = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(roundTimer);
        }
        remainingTime--;
        io.emit('updateTime', remainingTime);
    }, 100);
}
