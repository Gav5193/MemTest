const express = require('express');
const { appendFileSync } = require('fs');
const app = express();

const http = require('http');
const { eventNames } = require('process');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const port = 3000;

// Centralized object to hold all data for each lobby
const lobbyData = {
    "endless": {
        inProgress: false,
        level: 1,
        gridRow: 4,
        winner: null,
        remainingTime: 0,
        roundTimer: null,
        correctData: []
    },
    "ten": {
        inProgress: false,
        level: 1,
        gridRow: 4,
        winner: null,
        remainingTime: 0,
        roundTimer: null,
        correctData: []
    },
    "twenty": {
        inProgress: false,
        level: 1,
        gridRow: 4,
        winner: null,
        remainingTime: 0,
        roundTimer: null,
        correctData: []
    }
};

const players = {
    "endless": {},
    "ten": {},
    "twenty": {}
};

app.set('view engine', 'ejs');

function generateCorrect(mode) {
    let i = 0;
    const currentLobby = lobbyData[mode];
    currentLobby.correctData = [];
    while (i < currentLobby.level + 2) {
        var randomIndex = Math.ceil(Math.random() * (currentLobby.gridRow * currentLobby.gridRow));
        if (!currentLobby.correctData.includes(randomIndex)) {
            currentLobby.correctData.push(randomIndex);
            i++;
        }
    }
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/multiplayer', (req, res) => {
    res.render('multiplayer');
});

app.get('/endlessMode', (req, res) => {
    res.render('endlessMulti');
});

server.listen(
    port,
    () => {
        console.log(`Server is running on ${port}`);
    }
)

io.on('connection', (socket) => {
    // Construct and send the inProgress status to the client
    const progressStatus = {};
    for (const mode in lobbyData) {
        progressStatus[mode] = lobbyData[mode].inProgress;
    }
    socket.emit('check', progressStatus);

    socket.on('updateUsername', (player, mode) => {
        if (players[mode] && players[mode][socket.id]) {
            players[mode][socket.id].username = player.username;
            io.to(mode).emit('update', players[mode], socket.id);
        }
    });

    socket.on('Lobby', (username, mode) => {
        if (!lobbyData[mode].inProgress) {
            socket.join(mode);
            socket.mode = mode;

            // Reset lobby state for a new game
            lobbyData[mode].level = 1;
            lobbyData[mode].gridRow = 4;
            lobbyData[mode].winner = null;

            players[mode][socket.id] = {
                score: 0,
                cellsClicked: [],
                lives: 3,
                chances: 3,
                username: username || 'Guest',
                ready: false,
                finished: false,
                mode: mode
            }
            io.to(mode).emit('Lobby', players[mode], mode);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        const mode = socket.mode;
        if (mode && players[mode] && players[mode][socket.id]) {
            delete players[mode][socket.id];

            const lobbyPlayers = players[mode];
            const length = Object.keys(lobbyPlayers).length;

            if (length === 0) {
                console.log(`Lobby ${mode} is empty. Resetting.`);
                clearInterval(lobbyData[mode].roundTimer);
                lobbyData[mode].inProgress = false;
                return;
            }

            io.to(mode).emit('disconnected', lobbyPlayers, socket.id);

            let allFinished = true;
            for (const id in lobbyPlayers) {
                if (lobbyPlayers[id].finished === false) {
                    allFinished = false;
                    break;
                }
            }

            if (allFinished && lobbyData[mode].remainingTime > 30) {
                clearInterval(lobbyData[mode].roundTimer);
                const firstPlayerId = Object.keys(lobbyPlayers)[0];
                startRoundTimer(firstPlayerId, 3, mode);
                setTimeout(() => {
                    loadRound(firstPlayerId, false, mode);
                }, 3000);
            }
        }
    });

    socket.on('ready', (player, id, mode) => {
        if (players[mode] && players[mode][id]) {
            players[mode][id].ready = player.ready;

            const lobbyPlayers = players[mode];
            let allReady = true;
            for (const p in lobbyPlayers) {
                if (!lobbyPlayers[p].ready) {
                    allReady = false;
                    break;
                }
            }

            if (allReady) {
                lobbyData[mode].inProgress = true;
                loadRound(id, true, mode);
            } else {
                io.to(mode).emit('update', lobbyPlayers, socket.id);
            }
        }
    });

    socket.on('cellClicked', (num, player, mode) => {
        if (players[mode] && players[mode][socket.id]) {
            players[mode][socket.id].cellsClicked.push(num);
            io.to(mode).emit('cellClicked', num, socket.id);
        }
    });

    socket.on('wonRound', (frontEndPlayers, player, mode) => {
        const lobbyPlayers = players[mode];
        if (lobbyPlayers && lobbyPlayers[player]) {
            if (lobbyData[mode].winner === null) {
                lobbyData[mode].winner = player;
                lobbyPlayers[player].score += lobbyData[mode].level * 10;
            }
            lobbyPlayers[player].finished = true;

            let allFinished = true;
            for (const id in lobbyPlayers) {
                if (lobbyPlayers[id].finished === false) {
                    allFinished = false;
                    break;
                }
            }

            io.to(mode).emit('finished', lobbyPlayers[player], player);

            if (allFinished && lobbyData[mode].remainingTime > 30) {
                clearInterval(lobbyData[mode].roundTimer);
                startRoundTimer(player, 3, mode);
                setTimeout(() => {
                    loadRound(player, false, mode);
                }, 3000);
            }
        }
    });

    socket.on('updateScore', (playerData, player, mode) => {
        const lobbyPlayers = players[mode];
        if (lobbyPlayers && lobbyPlayers[socket.id]) {
            lobbyPlayers[socket.id].lives = playerData.lives;
            lobbyPlayers[socket.id].score = playerData.score;
            lobbyPlayers[socket.id].chances = playerData.chances;

            let allDeadInGame = true;
            let allDeadInRound = true;
            for (const key in lobbyPlayers) {
                if (lobbyPlayers[key].lives >= 1) allDeadInGame = false;
                if (lobbyPlayers[key].chances >= 1) allDeadInRound = false;
            }

            if (allDeadInGame) {
                for (const p in lobbyPlayers) lobbyPlayers[p].ready = false;
                clearInterval(lobbyData[mode].roundTimer);
                lobbyData[mode].inProgress = false;
                io.to(mode).emit('gameOver', lobbyPlayers);
                io.emit('check', { [mode]: false });
                return;
            }

            if (allDeadInRound && player === socket.id) {
                if (lobbyData[mode].remainingTime > 30) {
                    clearInterval(lobbyData[mode].roundTimer);
                    startRoundTimer(socket.id, 3, mode);
                    setTimeout(() => {
                        if (lobbyPlayers[socket.id]) loadRound(player, false, mode);
                    }, 3000);
                }
            }

            if (lobbyPlayers[player].chances <= 0) {
                lobbyPlayers[player].finished = true;

                let roundOver = true;
                for (const id in lobbyPlayers) {
                    if (lobbyPlayers[id].finished === false) roundOver = false;
                }
                if (roundOver && lobbyData[mode].remainingTime > 30) {
                    clearInterval(lobbyData[mode].roundTimer);
                    startRoundTimer(socket.id, 3, mode);
                    setTimeout(() => {
                        if (lobbyPlayers[player]) loadRound(player, false, mode);
                    }, 3000);
                }
                io.to(mode).emit('lostGame', lobbyPlayers, player);
            }
            io.to(mode).emit('score', lobbyPlayers[socket.id], socket.id);
        }
    });
});

function loadRound(player, isNewGame, mode) {
    const currentLobby = lobbyData[mode];
    if (!currentLobby.inProgress) return;

    currentLobby.winner = null;
    const lobbyPlayers = players[mode];

    let allDead = true;
    for (const id in lobbyPlayers) {
        if (lobbyPlayers[id].lives > 0) allDead = false;
    }
    if (allDead) {
        io.to(mode).emit('gameOver', lobbyPlayers);
        currentLobby.inProgress = false;
        return;
    }

    currentLobby.level++;
    currentLobby.gridRow = 4 + Math.ceil(currentLobby.level / 3);
    if (currentLobby.gridRow > 9) currentLobby.gridRow = 9;

    generateCorrect(mode);

    for (const p in lobbyPlayers) {
        lobbyPlayers[p].cellsClicked = [];
        lobbyPlayers[p].ready = false;
        if (lobbyPlayers[p].lives > 0) {
            lobbyPlayers[p].finished = false;
            lobbyPlayers[p].chances = 3;
        }
    }

    timeOut(currentLobby.level, player, mode);
    clearInterval(currentLobby.roundTimer);
    startRoundTimer(player, 23, mode);
    io.to(mode).emit('nextRound', player, lobbyPlayers, currentLobby.correctData, currentLobby.level, currentLobby.gridRow, isNewGame);
}

function finished(socketID, mode) {
    const lobbyPlayers = players[mode];
    if (lobbyPlayers && lobbyPlayers[socketID]) {
        for (const id in lobbyPlayers) {
            if (lobbyPlayers[id].finished != true && lobbyPlayers[id].lives > 0) {
                lobbyPlayers[id].lives -= 1;
            }
        }
    }
}

function timeOut(preLevel, player, mode) {
    setTimeout(() => {
        if (lobbyData[mode] && lobbyData[mode].level === preLevel) {
            if (players[mode] && players[mode][player]) {
                finished(player, mode);
                loadRound(player, false, mode);
            }
        }
    }, 23000);
}

function startRoundTimer(id, time, mode) {
    const currentLobby = lobbyData[mode];
    currentLobby.remainingTime = time * 10;
    currentLobby.roundTimer = setInterval(() => {
        if (currentLobby.remainingTime <= 0) {
            clearInterval(currentLobby.roundTimer);
        }
        currentLobby.remainingTime--;
        io.to(mode).emit('updateTime', currentLobby.remainingTime);
    }, 100);
}