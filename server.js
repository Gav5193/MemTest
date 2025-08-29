const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { v4: uuidV4 } = require('uuid');
const { Server } = require('socket.io');

const db = require('./db/queries');
const io = new Server(server);

const port = 3000;

// Centralized object to hold all data for each lobby, organized by mode then roomId
const lobbyData = {
    "endless": {},
    "ten": {},
    "twenty": {},
    'fifteen': {},
    'five': {}
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
        remainingTime: 10,
        timer: 0,
        roundTimer: null,
        correctData: [],
        mode: mode,
        targetLevel: 0, 
        fastestTime: 10000,
        fastestTimeID: null,
        highestLevel: 0,
        highestLevelID: null

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
    
    const currentLobby = lobbyData[mode][roomId];
    currentLobby.correctData = [];
    for(let j = 0; j < currentLobby.targetLevel; j++){
        currentLobby.level++;
        currentLobby.gridRow = 4 + Math.ceil(currentLobby.level / 3);
        if(currentLobby.gridRow>9) currentLobby.gridRow = 9;
        let i = 0;
        currentLobby.correctData.push([]);
        while (i < currentLobby.level + 2) {
            var randomIndex = Math.ceil(Math.random() * (currentLobby.gridRow * currentLobby.gridRow));
            if (!currentLobby.correctData[j].includes(randomIndex)) {
                currentLobby.correctData[j].push(randomIndex);
                i++;
            }
        }
    }
}


server.listen(port, () => {
    console.log(`Server is running on ${port}`);
});

io.on('connection', (socket) => {

    socket.on('joinLobby', async (roomId, username) => {
        
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
        const lobby = lobbyData[roomMode][roomId]
        if (!lobbyData[roomMode][roomId].inProgress){
            if (players[roomId][lobbyData[roomMode][roomId].winner]){
            players[roomId][lobbyData[roomMode][roomId].winner].gamesWon++;
            }
            clearInterval(lobbyData[roomMode][roomId].roundTimer)
            var target = null;
            if (roomMode === 'ten'){
                target = 10;
            }else if(roomMode === 'twenty'){
                target = 20;
            }
            else if (roomMode === 'five'){
                target = 5;
            }
            else if (roomMode === 'fifteen'){
                target = 15;
            }
            else{
                target = 50 ;

            }
            
          
                lobby.inProgress= false,
                lobby.level= 0,
                lobby.gridRow= 4,
                lobby.winner= null,
                lobby.remainingTime= 10,
                lobby.roundTimer= null,
                lobby.correctData= [],
            
                lobby.targetLevel= target,
                lobby.timer= 0
            
            if (!players[roomId][socket.id]){
                players[roomId][socket.id] = {
                level: 1,
                    score: 0,
                    cellsClicked: [],
                    correctData: [],
                    lives: 3,
                    gridRow: 4,
                    chances: 3,
                    username: username || 'Guest',
                    ready: false,
                    finished: false,
                    mode: roomMode,
                    timeFinished: undefined,
                    gamesWon: 0
                };
            }
            else{
                const player = players[roomId][socket.id];
                player.level = 1;
                player.score = 0;
                player.cellsClicked = [];
                player.correctData = [];
                player.lives = 3;
                player.chances = 3;
                player.gridRow = 4;
                player.ready = false;
                player.finished = false;
                player.timeFinished = 0;

            }
        
        // If the game is in progress, the new player is a spectator.
    } 
        const records = await db.getRecord(socket.mode);
        io.to(roomId).emit('updateLobby', players[roomId], records, lobby.fastestTime, lobby.fastestTimeID, lobby.highestLevel, lobby.highestLevelID, socket.mode);
        
    
        
    });

    socket.on('updateUsername', (player) => {
        const { roomId } = socket;
        if (roomId && players[roomId] && players[roomId][socket.id]) {
            players[roomId][socket.id].username = player.username;
            io.to(roomId).emit('updateUsername', players[roomId]);
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

        io.to(roomId).emit('disconnected', lobbyPlayers, socket.id, lobbyData[mode][roomId].inProgress);
        /*
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
        }*/
    });

    socket.on('ready', (player, id) => {
        const { roomId, mode } = socket;
        if (!roomId || !players[roomId] || !players[roomId][id]) return;
        
        players[roomId][id].ready = player.ready;
        const lobbyPlayers = players[roomId];
        let allReady = true;
        
        for (const p in lobbyPlayers) {
            // Spectators don't need to be ready to start the game.
            if (!lobbyPlayers[p].ready ) {
                allReady = false;
                break;
            }
        }

        if (allReady) {
            lobbyData[mode][roomId].inProgress = true;
            generateCorrect(mode, roomId)
            console.log(lobbyData[mode][roomId].correctData)
            startGameTimer(0, roomId);
            for (const p in lobbyPlayers) {
                //lobbyPlayers[p].isSpectator = false;
                lobbyPlayers[p].correctData = lobbyData[mode][roomId].correctData
                loadRound(p, true, roomId);
            }
           
            
            
        } else {
            io.to(roomId).emit('updateUsername', lobbyPlayers);
        }
    });

    socket.on('cellClicked', (num, player) => {
        const { roomId } = socket;
        if (roomId && players[roomId] && players[roomId][socket.id]) {
            players[roomId][socket.id].cellsClicked.push(num);
            io.to(roomId).emit('cellClicked', num, socket.id);
        }
    });

    socket.on('wonRound', async (frontEndPlayers, player) => {
        const { roomId, mode } = socket;
        if (!roomId || !mode || !lobbyData[mode][roomId]) return;

        const lobbyPlayers = players[roomId];
        lobbyPlayers[player].level++;
        

        const currentLobby = lobbyData[mode][roomId];
        let allFinished = true;
        if (lobbyPlayers && lobbyPlayers[player]) {
            if (lobbyPlayers[player].level === currentLobby.targetLevel) {
                    if (currentLobby.highestLevel < lobbyPlayers[player].level){
                        currentLobby.fastestTimeID = players[roomId][player].username;
                        currentLobby.fastestTime = currentLobby.timer;
                        currentLobby.highestLevel = lobbyPlayers[player].level;
                        currentLobby.highestLevelID = lobbyPlayers[player].username;
                    }
                 
                
                lobbyPlayers[player].finished = true;
                lobbyPlayers[player].timeFinished = currentLobby.timer;
            }
            }
            
            for (const id in lobbyPlayers) {
                if (lobbyPlayers[id].finished === false) {
                    allFinished = false;
                    break;
                }
            }
        
        if (allFinished){
            currentLobby.inProgress = false;
            for(const p in lobbyPlayers){
                
                await db.addTime(mode, lobbyPlayers[p].username, lobbyPlayers[p].level, lobbyPlayers[p].timeFinished);

            }

           
            io.to(roomId).emit('gameOver', lobbyPlayers, mode)
            
            return;
        }
        if (lobbyPlayers[player].finished === true){
            io.to(roomId).emit('finished', lobbyPlayers[player], player);
            
              if (mode !== 'endless'){
                    setTimeout(async () => {
                        for(const p in lobbyPlayers){
                            if(lobbyPlayers[p].finished === false){
                                lobbyPlayers[p].timeFinished = currentLobby.timer;
                            }
                            await db.addTime(mode, lobbyPlayers[p].username, lobbyPlayers[p].level, lobbyPlayers[p].timeFinished)
                        }
                        currentLobby.inProgress = false;
                        io.to(roomId).emit('gameOver', lobbyPlayers, mode);
                    }, 10000);
                }
            return;
        }
        
        loadRound(player, false, roomId)
    });

    socket.on('updateScore', async (playerData, player) => {
        const { roomId, mode } = socket;
        if (!roomId || !mode || !lobbyData[mode][roomId]) return;
        
        const lobbyPlayers = players[roomId];
        const currentLobby = lobbyData[mode][roomId];

        if (lobbyPlayers && lobbyPlayers[socket.id]) {
            lobbyPlayers[socket.id].lives = playerData.lives;
            lobbyPlayers[socket.id].score = playerData.score;
            lobbyPlayers[socket.id].chances = playerData.chances;
            if (lobbyPlayers[socket.id].lives <= 0){
                lobbyPlayers[socket.id].timeFinished = currentLobby.timer;
              if (currentLobby.highestLevel < lobbyPlayers[player].level){
                    currentLobby.winner = player;
                    currentLobby.highestLevel = lobbyPlayers[player].level
                    currentLobby.highestLevelID = lobbyPlayers[player].username
                    currentLobby.fastestTime = lobbyPlayers[player].timeFinished
                    currentLobby.fastestTimeID = lobbyPlayers[player].username
                }
            }

            let allDeadInGame = true;
            
            for (const key in lobbyPlayers) {
                if (lobbyPlayers[key].lives >= 1) allDeadInGame = false;
                
            }

            if (allDeadInGame) {
                for (const p in lobbyPlayers) {
                    lobbyPlayers[p].ready = false
                    lobbyPlayers[p].timeFinished = currentLobby.timer
                    await db.addTime(mode, lobbyPlayers[p].username, lobbyPlayers[p].level, lobbyPlayers[p].timeFinished)


                }
                clearInterval(currentLobby.roundTimer);
                currentLobby.inProgress = false;
                
              
                
                io.to(roomId).emit('gameOver', lobbyPlayers, mode);
                return;
            }

           

            if (lobbyPlayers[player].chances <= 0) {
                loadRound(player, false, roomId);
               
              
            }
            
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

    
    const lobbyPlayers = players[roomId];

    let allDead = true;
    for (const id in lobbyPlayers) {
        if (lobbyPlayers[id].lives > 0) allDead = false;
    }
    if (allDead) {
        currentLobby.inProgress = false;
        io.to(roomId).emit('gameOver', lobbyPlayers, mode);
        
        return;
    }

    // Loadgrid
    lobbyPlayers[player].gridRow = 4 + Math.ceil(lobbyPlayers[player].level / 3);
    if (lobbyPlayers[player].gridRow > 9) lobbyPlayers[player].gridRow = 9;

    // Reset Player attributes
    lobbyPlayers[player].cellsClicked = [];
    lobbyPlayers[player].ready = false;
    if (lobbyPlayers[player].lives > 0) {
        lobbyPlayers[player].chances = 3;
    }
    

    //timeOut(currentLobby.level, player, roomId, mode);
    //clearInterval(currentLobby.roundTimer);
    //startRoundTimer(player, 23, roomId);
    io.to(roomId).emit('nextRound', player, lobbyPlayers, isNewGame);
}


 



function startGameTimer(time, roomId) {
    let mode;
    for (const m in lobbyData) {
        if (lobbyData[m][roomId]) { mode = m; break; }
    }
    if (!mode) return;

    const currentLobby = lobbyData[mode][roomId];
    currentLobby.roundTimer = setInterval(() => {
        currentLobby.timer = (currentLobby.timer + 0.1);
        io.to(roomId).emit('updateTime', currentLobby.timer);
    }, 100);
}