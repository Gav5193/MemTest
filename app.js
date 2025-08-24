const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

var level = 1;
var gridRow = 5; // Number of rows in the grid
const port = 3000;
var playerLength = 1;
var playerNum = 0;
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
    console.log('a user connected');
    players[socket.id] = {  
        score: 0,
        cellsClicked: [],
        lives: 3,
        }

    generateCorrect();

    if(playerNum < 7){
    io.emit('players', players, correctData);
    console.log(players);
    console.log(correctData);
    playerNum++;
    }
     socket.on('disconnect', () => {
        console.log('user disconnected');
        delete players[socket.id];
        io.emit('players', players);
        
    });
    

    

    socket.on('cellClicked', (num, player) => {
        console.log('Cell clicked by:', player);
        players[socket.id].cellsClicked.push(num);
        io.emit('cellClicked', num, player);
    });

    socket.on('updateScore', (playerData, player) => {
        players[socket.id].lives = playerData.lives;
        players[socket.id].score = playerData.score;
        io.emit('score', playerData, player);
    });

    // Handle other socket events here
});