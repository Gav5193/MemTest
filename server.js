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
       const roomId = uuidV4();

    // Initialize room data within the correct mode
    lobbyData[roomId] = {
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
        highestLevelID: null,
        roundHighestLevel: 0,
        gameOverTimeSet: false,
        finishedTimer: null,
        fade: true,
        click: true

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
    for (const roomID in lobbyData) {
        if (lobbyData[roomId]) {
            roomInfo = lobbyData[roomId];
            mode = lobbyData[roomId].mode;
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
    
    const currentLobby = lobbyData[roomId];
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

    socket.on('updateMessages', (message)=>{
        socket.broadcast.to(socket.roomId).emit('updateMessages', message);
    });
    socket.on('updateSocket', (mode) =>{
        socket.mode = mode;
    });
    socket.on('updateSettings', async(mode, fade, click) => {

        if (!lobbyData[socket.roomId] || lobbyData[socket.roomId].inProgress) return;
        const curLobby = lobbyData[socket.roomId];
        curLobby.mode = mode;
        curLobby.fade = fade;
        curLobby.click = click; 
        curLobby.fastestTime = 10000;
        curLobby.fastestTimeID = null;
        curLobby.highestLevel = 0;
        curLobby.highestLevelID = null;
        if (curLobby.mode === 'ten'){
                curLobby.targetLevel = 10;
            }else if(curLobby.mode === 'twenty'){
                curLobby.targetLevel = 20;
            }
            else if (curLobby.mode === 'five'){
                curLobby.targetLevel = 5;
            }
            else if (curLobby.mode === 'fifteen'){
                curLobby.targetLevel = 15;
            }
            else if (curLobby.mode === 'twentyfive'){
                curLobby.targetLevel = 25;
            }
            else{
                curLobby.targetLevel = 50 ;
            }
        const records = await db.getRecord(curLobby.mode, curLobby.fade, curLobby.click);

        io.to(socket.roomId).emit('updateSettings', curLobby.mode, curLobby.fade, curLobby.click, records);

    });
    socket.on('joinLobby', async (roomId, username) => {
        if (!lobbyData[roomId]) {
            socket.emit('error', 'Room not found')
            return;
        }
        let roomMode = lobbyData[roomId].mode;
        if (!roomMode || !players[roomId]) {
            socket.emit('error', 'Room not found');
            return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.mode = roomMode;
        const lobby = lobbyData[roomId]
        if (!lobbyData[roomId].inProgress){
            if (lobby.winner && players[roomId][lobby.winner]){

                players[roomId][lobby.winner].gamesWon++;
            }
            clearInterval(lobbyData[roomId].roundTimer)
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
            else if (roomMode === 'twentyfive'){
                target = 25;
            }
            else{
                target = 50 ;
            }
            

            lobby.gameOverTimeSet= false
                lobby.inProgress= false
                lobby.level= 0,
                lobby.gridRow= 4
                lobby.winner= null
                lobby.remainingTime= 10
                lobby.roundTimer= null
                lobby.correctData= []
                lobby.roundHighestLevel = 0
                lobby.targetLevel= target
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
        const records = await db.getRecord(lobby.mode, lobby.fade, lobby.click);

        io.to(roomId).emit('updateLobby', players[roomId], records, lobby.fastestTime, lobby.fastestTimeID, lobby.highestLevel, lobby.highestLevelID, lobby.mode, lobby.fade, lobby.click);
        
    
        
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
            if (lobbyData[roomId]) {
                clearInterval(lobbyData[roomId].roundTimer);
                delete lobbyData[roomId];
            }
            delete players[roomId];
            return;
        }

        io.to(roomId).emit('disconnected', lobbyPlayers, socket.id, lobbyData[roomId].inProgress);
       
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
            io.to(roomId).emit('updateUsername', lobbyPlayers);
            lobbyData[roomId].inProgress = true; 
            setTimeout (() => {
            
            generateCorrect(mode, roomId)
            console.log(lobbyData[roomId].correctData)
            startGameTimer(0, roomId);
            for (const p in lobbyPlayers) {
                //lobbyPlayers[p].isSpectator = false;
                    lobbyPlayers[p].correctData = JSON.parse(JSON.stringify(lobbyData[roomId].correctData));

                loadRound(p, true, roomId);
            }
         }, 750);
           
            
            
        } else {
            io.to(roomId).emit('updateUsername', lobbyPlayers);
        }
    });

    // In server.js


socket.on('cellClicked', (num) => {
    const { roomId, mode, id: playerId } = socket;
    if (!roomId || !mode || !players[roomId] || !players[roomId][playerId]) return;

    const pData = players[roomId][playerId];

    // Ignore clicks if player is out of lives, has finished, or has already clicked this cell
    if (pData.lives <= 0 || pData.finished || pData.cellsClicked.includes(num)) {
        return;
    }

    pData.cellsClicked.push(num);
    const currentLevelIndex = pData.level - 1;

    // Check if the clicked cell number is in the correct data for the current level
    const isCorrect = pData.correctData[currentLevelIndex]?.includes(num);

    // Broadcast the result to all clients for UI updates
    io.to(roomId).emit('cellUpdate', { playerId, num, isCorrect });

    if (isCorrect) {
        
        
        // Check if all correct cells for the level have been clicked
        const correctCellsForLevel = pData.correctData[currentLevelIndex];
        const clickedCorrectCells = pData.cellsClicked.filter(cell => correctCellsForLevel.includes(cell));

        if (clickedCorrectCells.length === correctCellsForLevel.length) {
            
            socket.emit('wonRound', pData, playerId);
        }
    } else {
        pData.chances--;
        if (pData.chances === 0 ) pData.lives--;
        

        socket.emit('updateState', pData, playerId);
    }
});

    socket.on('wonRound', async (frontEndPlayers, player) => {
        const { roomId, mode } = socket;
        if (!roomId || !mode || !lobbyData[roomId]) return;

        const lobbyPlayers = players[roomId];
        lobbyPlayers[player].level++;
        

        const currentLobby = lobbyData[roomId];
        let allFinished = true;
        if (lobbyPlayers && lobbyPlayers[player]) {
            if (lobbyPlayers[player].level === currentLobby.targetLevel) {
                if (currentLobby.roundHighestLevel < lobbyPlayers[player].level){
                    currentLobby.roundHighestLevel = lobbyPlayers[player].level
                    currentLobby.winner = player;
                }
                        if (currentLobby.highestLevel <= lobbyPlayers[player].level){
                            if (currentLobby.fastestTime > currentLobby.timer){
                            currentLobby.fastestTimeID = players[roomId][player].username;
                            currentLobby.fastestTime = currentLobby.timer;
                            currentLobby.highestLevel = lobbyPlayers[player].level;
                            currentLobby.highestLevelID = lobbyPlayers[player].username;
                        }
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
                    await db.addTime(mode, currentLobby.fade, currentLobby.click, lobbyPlayers[p].username, lobbyPlayers[p].level, lobbyPlayers[p].timeFinished);
                }
                clearInterval(currentLobby.roundTimer)
                io.to(roomId).emit('gameOver', lobbyPlayers, mode)
                
                return;
            }
            if (lobbyPlayers[player].finished === true){
                io.to(roomId).emit('finished', lobbyPlayers[player], player);
                
                if (mode !== 'endless' && !currentLobby.gameOverTimeSet){

                    currentLobby.gameOverTimeSet = true;
                        setTimeout(async () => {
                        if (currentLobby.inProgress === true){
                        for(const p in lobbyPlayers){
                            if(lobbyPlayers[p].finished === false){
                                lobbyPlayers[p].timeFinished = currentLobby.timer;
                            }
                            await db.addTime(mode, currentLobby.fade, currentLobby.click, lobbyPlayers[p].username, lobbyPlayers[p].level, lobbyPlayers[p].timeFinished)
                        }
                        currentLobby.inProgress = false;
                        io.to(roomId).emit('gameOver', lobbyPlayers, mode);
                        }
                    }, 10000);
                }
            return;
        }
        
        // Start the next round if player isn't finished
        loadRound(player, false, roomId)
    });

    socket.on('updateState', async (playerData, player) => {
        const { roomId, mode } = socket;
        if (!roomId || !mode || !lobbyData[roomId]) return;
        
        const lobbyPlayers = players[roomId];
        const currentLobby = lobbyData[roomId];

        if (lobbyPlayers && lobbyPlayers[socket.id]) {
    
            if (lobbyPlayers[socket.id].lives <= 0){
                lobbyPlayers[socket.id].finished = true;
                lobbyPlayers[socket.id].timeFinished = currentLobby.timer;
                if (currentLobby.roundHighestLevel < lobbyPlayers[player].level){
                    currentLobby.roundHighestLevel = lobbyPlayers[player].level
                    currentLobby.winner = player;
                }
             if (currentLobby.highestLevel <= lobbyPlayers[player].level){
                        if (currentLobby.fastestTime > currentLobby.timer){
                        currentLobby.fastestTimeID = players[roomId][player].username;
                        currentLobby.fastestTime = currentLobby.timer;
                        currentLobby.highestLevel = lobbyPlayers[player].level;
                        currentLobby.highestLevelID = lobbyPlayers[player].username;
                    }
                    }
            }

            let allDeadInGame = true;
            let allFinished = true; 
            for (const key in lobbyPlayers) {
                if (lobbyPlayers[key].lives >= 1) allDeadInGame = false;
                if (lobbyPlayers[key].finished === false) allFinished = false;
            }

            if (allDeadInGame || allFinished) {
                for (const p in lobbyPlayers) {
                    await db.addTime(mode, currentLobby.fade, currentLobby.click, lobbyPlayers[p].username, lobbyPlayers[p].level, lobbyPlayers[p].timeFinished)

                }
                // Clear the Timer set inprogress to false
             
                currentLobby.inProgress = false;
                
         
    
                clearInterval(currentLobby.roundTimer)
                io.to(roomId).emit('gameOver', lobbyPlayers, mode);
                return;
            }

           

            if (lobbyPlayers[player].chances <= 0 || lobbyPlayers[player].lives <= 0) {
             
                loadRound(player, false, roomId);
               
              
            }
            
        }
    });
});

function loadRound(player, isNewGame, roomId) {
    let mode = lobbyData[roomId].mode

  
    if (!mode) return;

    const currentLobby = lobbyData[roomId];
    if (!currentLobby || !currentLobby.inProgress) return;

    
    const lobbyPlayers = players[roomId];

    /*
    let allDead = true;
    let allFinished = true;
    for (const id in lobbyPlayers) {
        if (lobbyPlayers[id].lives > 0) allDead = false;
        if (!lobbyPlayers[id].finished) allFinished = false;
    }
    if (allDead) {
        currentLobby.inProgress = false;
        io.to(roomId).emit('gameOver', lobbyPlayers, mode);
        return;
    }
    if (allFinished){
        currentLobby.inProgress = false;
        io.to(roomId).emit('gameOver', lobbyPlayers, mode)
        return;
    }*/

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
    let mode = lobbyData[roomId].mode
   
    if (!mode) return;

    const currentLobby = lobbyData[roomId];
    currentLobby.roundTimer = setInterval(() => {
        currentLobby.timer = (currentLobby.timer + 0.01);
        
        io.to(roomId).emit('updateTime', currentLobby.timer);
    }, 10);
}