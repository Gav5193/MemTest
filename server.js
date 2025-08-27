const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { v4: uuidV4 } = require('uuid');
const { Server } = require('socket.io');
const io = new Server(server);

const port = 3000;

// Centralized object to hold all data for each lobby, organized by mode then roomId
const lobbyData = {
    "endless": {},
    "ten": {},
    "twenty": {}
};

// Players are now stored by roomId
const players = {};

app.set('view engine', 'ejs');
app.use(express.static('public'));

// --- Routes ---
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/multiplayer', (req, res) => {
    res.render('multiplayer');
});

// Route to create a new lobby and redirect
app.get('/multiplayer/create/:mode', (req, res) => {
    const mode = req.params.mode;
    if (!lobbyData.hasOwnProperty(mode)) {
        return res.status(404).send('Game mode not found');
    }

    const roomId = uuidV4();

    // Initialize room data within the correct mode
    lobbyData[mode][roomId] = {
        inProgress: false,
        level: 0,
        gridRow: 4,
        winner: null,
        remainingTime: 0,
        roundTimer: null,
        correctData: [],
        mode: mode
    };
    players[roomId] = {};
    console.log(`New room created: ${roomId} for mode ${mode}`);

    res.redirect(`/multiplayer/room/${roomId}`);
});

// Route to join/view a specific lobby
app.get('/multiplayer/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    let roomInfo = null;
    let mode = null;

    // Find the room across all modes
    for (const gameMode in lobbyData) {
        if (lobbyData[gameMode][roomId]) {
            roomInfo = lobbyData[gameMode][roomId];
            mode = gameMode;
            break;
        }
    }

    if (roomInfo) {
        res.render('multiplayerLobby', { 
            roomId: roomId,
            inProgress: roomInfo.inProgress,
            mode: mode
        });
    } else {
        res.redirect('/multiplayer?error=roomNotFound');
    }
});


function generateCorrect(mode, roomId) {
    let i = 0;
    const currentLobby = lobbyData[mode][roomId];
    currentLobby.correctData = [];
    while (i < currentLobby.level + 2) {
        var randomIndex = Math.ceil(Math.random() * (currentLobby.gridRow * currentLobby.gridRow));
        if (!currentLobby.correctData.includes(randomIndex)) {
            currentLobby.correctData.push(randomIndex);
            i++;
        }
    }
}


server.listen(port, () => {
    console.log(`Server is running on ${port}`);
});

io.on('connection', (socket) => {

    socket.on('joinLobby', (roomId, username) => {
        let roomMode = null;
        for (const mode in lobbyData) {
            if (lobbyData[mode][roomId]) {
                roomMode = mode;
                break;
            }
        }

        if (!roomMode || !players[roomId]) {
            socket.emit('error', 'Room not found');
            return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.mode = roomMode;
        
        if (!lobbyData[roomMode][roomId].inProgress){
            lobbyData[roomMode][roomId] = {
                inProgress: false,
                level: 0,
                gridRow: 4,
                winner: null,
                remainingTime: 0,
                roundTimer: null,
                correctData: [],
                mode: roomMode
            };
        players[roomId][socket.id] = {
            score: 0,
            cellsClicked: [],
            lives: 3,
            chances: 3,
            username: username || 'Guest',
            ready: false,
            finished: false,
            mode: roomMode
        };
        }
        // If the game is in progress, the new player is a spectator.
       
        
        io.to(roomId).emit('updateLobby', players[roomId]);
        
    });

    socket.on('updateUsername', (player) => {
        const { roomId } = socket;
        if (roomId && players[roomId] && players[roomId][socket.id]) {
            players[roomId][socket.id].username = player.username;
            io.to(roomId).emit('updateLobby', players[roomId]);
        }
    });

    socket.on('disconnect', () => {
        const { roomId, mode } = socket;
        if (!roomId || !mode || !players[roomId] || !players[roomId][socket.id]) return;

        console.log(`Player ${socket.id} disconnected from room ${roomId}`);
        delete players[roomId][socket.id];
        
        const lobbyPlayers = players[roomId];
        const length = Object.keys(lobbyPlayers).length;

        if (length === 0) {
            console.log(`Room ${roomId} is empty. Deleting.`);
            if (lobbyData[mode][roomId]) {
                clearInterval(lobbyData[mode][roomId].roundTimer);
                delete lobbyData[mode][roomId];
            }
            delete players[roomId];
            return;
        }

        io.to(roomId).emit('disconnected', lobbyPlayers, socket.id);

        let allFinished = true;
        for (const id in lobbyPlayers) {
            if (lobbyPlayers[id].finished === false) {
                allFinished = false;
                break;
            }
        }

        if (allFinished && lobbyData[mode][roomId].inProgress && lobbyData[mode][roomId].remainingTime > 30) {
            clearInterval(lobbyData[mode][roomId].roundTimer);
            const firstPlayerId = Object.keys(lobbyPlayers)[0];
            startRoundTimer(firstPlayerId, 3, roomId);
            setTimeout(() => {
                loadRound(firstPlayerId, false, roomId);
            }, 3000);
        }
    });

    socket.on('ready', (player, id) => {
        const { roomId, mode } = socket;
        if (!roomId || !players[roomId] || !players[roomId][id]) return;
        
        players[roomId][id].ready = player.ready;
        const lobbyPlayers = players[roomId];
        let allReady = true;
        
        for (const p in lobbyPlayers) {
            // Spectators don't need to be ready to start the game.
            if (!lobbyPlayers[p].ready && !lobbyPlayers[p].isSpectator) {
                allReady = false;
                break;
            }
        }

        if (allReady) {
            lobbyData[mode][roomId].inProgress = true;
            
            for (const p in lobbyPlayers) {
                lobbyPlayers[p].isSpectator = false;
            }
            loadRound(id, true, roomId);
        } else {
            io.to(roomId).emit('updateLobby', lobbyPlayers);
        }
    });

    socket.on('cellClicked', (num, player) => {
        const { roomId } = socket;
        if (roomId && players[roomId] && players[roomId][socket.id]) {
            players[roomId][socket.id].cellsClicked.push(num);
            io.to(roomId).emit('cellClicked', num, socket.id);
        }
    });

    socket.on('wonRound', (frontEndPlayers, player) => {
        const { roomId, mode } = socket;
        if (!roomId || !mode || !lobbyData[mode][roomId]) return;

        const lobbyPlayers = players[roomId];
        if (lobbyPlayers && lobbyPlayers[player]) {
            const currentLobby = lobbyData[mode][roomId];
            if (currentLobby.winner === null) {
                currentLobby.winner = player;
                lobbyPlayers[player].score += currentLobby.level * 10;
            }
            lobbyPlayers[player].finished = true;

            let allFinished = true;
            for (const id in lobbyPlayers) {
                if (lobbyPlayers[id].finished === false) {
                    allFinished = false;
                    break;
                }
            }

            io.to(roomId).emit('finished', lobbyPlayers[player], player);

            if (allFinished && currentLobby.remainingTime > 30) {
                clearInterval(currentLobby.roundTimer);
                startRoundTimer(player, 3, roomId);
                setTimeout(() => {
                    loadRound(player, false, roomId);
                }, 3000);
            }
        }
    });

    socket.on('updateScore', (playerData, player) => {
        const { roomId, mode } = socket;
        if (!roomId || !mode || !lobbyData[mode][roomId]) return;
        
        const lobbyPlayers = players[roomId];
        const currentLobby = lobbyData[mode][roomId];

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
                clearInterval(currentLobby.roundTimer);
                currentLobby.inProgress = false;
                io.to(roomId).emit('gameOver', lobbyPlayers);
                return;
            }

            if (allDeadInRound && player === socket.id && currentLobby.remainingTime > 30) {
                clearInterval(currentLobby.roundTimer);
                startRoundTimer(socket.id, 3, roomId);
                setTimeout(() => {
                    if (lobbyPlayers[socket.id]) loadRound(player, false, roomId);
                }, 3000);
            }

            if (lobbyPlayers[player].chances <= 0) {
                lobbyPlayers[player].finished = true;
                let roundOver = true;
                for (const id in lobbyPlayers) {
                    if (lobbyPlayers[id].finished === false) roundOver = false;
                }
                if (roundOver && currentLobby.remainingTime > 30) {
                    clearInterval(currentLobby.roundTimer);
                    startRoundTimer(socket.id, 3, roomId);
                    setTimeout(() => {
                        if (lobbyPlayers[player]) loadRound(player, false, roomId);
                    }, 3000);
                }
                io.to(roomId).emit('lostGame', lobbyPlayers, player);
            }
            io.to(roomId).emit('score', lobbyPlayers[socket.id], socket.id);
        }
    });
});

function loadRound(player, isNewGame, roomId) {
    let mode;
    for (const m in lobbyData) {
        if (lobbyData[m][roomId]) { mode = m; break; }
    }
    if (!mode) return;

    const currentLobby = lobbyData[mode][roomId];
    if (!currentLobby || !currentLobby.inProgress) return;

    currentLobby.winner = null;
    const lobbyPlayers = players[roomId];

    let allDead = true;
    for (const id in lobbyPlayers) {
        if (lobbyPlayers[id].lives > 0) allDead = false;
    }
    if (allDead) {
        io.to(roomId).emit('gameOver', lobbyPlayers);
        currentLobby.inProgress = false;
        return;
    }

    currentLobby.level++;
    currentLobby.gridRow = 4 + Math.ceil(currentLobby.level / 3);
    if (currentLobby.gridRow > 9) currentLobby.gridRow = 9;

    generateCorrect(mode, roomId);

    for (const p in lobbyPlayers) {
        lobbyPlayers[p].cellsClicked = [];
        lobbyPlayers[p].ready = false;
        if (lobbyPlayers[p].lives > 0) {
            lobbyPlayers[p].finished = false;
            lobbyPlayers[p].chances = 3;
        }
    }

    timeOut(currentLobby.level, player, roomId, mode);
    clearInterval(currentLobby.roundTimer);
    startRoundTimer(player, 23, roomId);
    io.to(roomId).emit('nextRound', player, lobbyPlayers, currentLobby.correctData, currentLobby.level, currentLobby.gridRow, isNewGame);
}

function finished(socketID, roomId) {
    const lobbyPlayers = players[roomId];
    if (lobbyPlayers && lobbyPlayers[socketID]) {
        for (const id in lobbyPlayers) {
            if (lobbyPlayers[id].finished !== true && lobbyPlayers[id].lives > 0) {
                lobbyPlayers[id].lives -= 1;
            }
        }
    }
}

function timeOut(preLevel, player, roomId, mode) {
    setTimeout(() => {
        const currentLobby = lobbyData[mode] ? lobbyData[mode][roomId] : null;
        if (currentLobby && currentLobby.level === preLevel) {
            if (players[roomId] && players[roomId][player]) {
                finished(player, roomId);
                loadRound(player, false, roomId);
            }
        }
    }, 23000);
}

function startRoundTimer(id, time, roomId) {
    let mode;
    for (const m in lobbyData) {
        if (lobbyData[m][roomId]) { mode = m; break; }
    }
    if (!mode) return;

    const currentLobby = lobbyData[mode][roomId];
    currentLobby.remainingTime = time * 10;
    currentLobby.roundTimer = setInterval(() => {
        if (currentLobby.remainingTime <= 0) {
            clearInterval(currentLobby.roundTimer);
        }
        currentLobby.remainingTime--;
        io.to(roomId).emit('updateTime', currentLobby.remainingTime);
    }, 100);
}