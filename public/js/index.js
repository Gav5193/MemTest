
var level = 5;

const socket = io(); // Connect to the server

const screen = document.querySelector('#screen');

var gridRow = level; // Number of rows in the grid

var gridData = []; // Array to hold grid data
var remainingTime = 0;
var players = 2;
var position = 0;


const frontEndPlayers = {}

function createContainer(id, parentElement){
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';
    gridContainer.dataset.id = id;
    

    const temp = document.createElement('div');
    temp.className = 'text-container';
    temp.dataset.id = id;

    const p0 = document.createElement('p');
    const p1 = document.createElement('p');
    const p2 = document.createElement('p');
    const p3 = document.createElement('p');
    p3.className = 'timer';

    if (socket.id === id){
        gridContainer.classList.add('is-you');
        p0.textContent = frontEndPlayers[id].username + " (YOU)";
    } else {
        p0.textContent = frontEndPlayers[id].username;
    }
    
    p1.textContent = 'Lives: ' + frontEndPlayers[id].lives;
    p2.textContent = 'Score: ' + frontEndPlayers[id].score;
    
    temp.appendChild(p0)
    temp.appendChild(p1);
    temp.appendChild(p2);
    temp.appendChild(p3);
    
    gridContainer.appendChild(temp);
    parentElement.appendChild(gridContainer);
}

function createGrid(x,id) {
    const gridContainer = document.querySelector('.grid-container[data-id="' + id + '"]');
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.dataset.id= id;
    var length = Object.keys(frontEndPlayers).length;
    var size = Math.min(gridContainer.clientHeight * 0.9, (screen.clientWidth / (length <= 3 ? length : Math.ceil(length / 2)) * 0.6));
    grid.style.width = size + 'px';
    gridContainer.appendChild(grid);
    
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < x; j++) {
            const cell = document.createElement('div');
            cell.className = 'newCell';
            cell.style.width = 1/x * 100 + '%';
            cell.style.height = 1/x * 100 + "%";
            cell.style.gridArea = (i * x + j + 1);
            cell.dataset.id = id;
            grid.appendChild(cell);
        }
    }
}

function generateCorrect(id) {
    frontEndPlayers[id].correctData.forEach(index => {
        const cell = document.querySelector('.newCell[style*="grid-area: ' + index + '"][data-id="' + id + '"]');
        if (cell) {
            cell.style.backgroundColor = '#ff0'; // Retro Yellow
        }
    });

    setTimeout(() => {
        frontEndPlayers[id].correctData.forEach(index => {
            const cell = document.querySelector('.newCell[style*="grid-area: ' + index + '"][data-id="' + id + '"]');
            if (cell) {
              
                    if (cell.style.backgroundColor != '#0f0' || cell.style.backgroundColor != '#f00'){ // Not correct green
                        cell.style.transition = 'background-color 0.5s ease';
                        cell.style.backgroundColor = '#444'; // Default retro grey
                    }
            
            }
        });
    }, 3000);
}

function renderGameScreen(players, data, gridRow, isNewGame ) {
    screen.innerHTML = '';

    const playerIds = Object.keys(players);
    const playerCount = playerIds.length;

    for (const id in players) {
        if (isNewGame) {
            frontEndPlayers[id].score = 0;
            frontEndPlayers[id].lives = 3;
        }
        frontEndPlayers[id].chances = 3;
        frontEndPlayers[id].cellsClicked = [];
        frontEndPlayers[id].correctData = structuredClone(data);
    }

    if (playerCount > 3) {
        screen.className = 'game-screen-two-rows';
        const topRow = document.createElement('div');
        topRow.className = 'game-row';
        const bottomRow = document.createElement('div');
        bottomRow.className = 'game-row';
        screen.appendChild(topRow);
        screen.appendChild(bottomRow);

        const splitIndex = Math.ceil(playerCount / 2);
        playerIds.forEach((id, index) => {
            const parentRow = index < splitIndex ? topRow : bottomRow;
            // Render logic for dead/alive players
            renderPlayerGrid(id, parentRow, gridRow);
        });
    } else {
        screen.style.flexDirection = 'row';
        screen.style.justifyContent = 'center';
        screen.style.alignItems = 'center';
        screen.className = 'game-screen-single-row';
        playerIds.forEach((id) => {
            renderPlayerGrid(id, screen, gridRow);
        });
    } 
   
    generateCorrect(socket.id);
    attach();
}

function renderPlayerGrid(id, parentElement, gridRow) {
    createContainer(id, parentElement);
    if (frontEndPlayers[id].lives > 0) {
        createGrid(gridRow, id);
    } else {
        createGrid(gridRow,id);
        const container = document.querySelector('.grid[data-id="' + id + '"]');
        container.innerHTML = ''; // Clear the grid container
   
    
    container.textContent = 'UDEAD!'; // Display "You Lost!" message
    container.style.fontSize = '32px'; // Increase font size for visibility
    container.style.color = 'red'; // Set text color to red
    container.style.alignItems = 'center'; // Center the text horizontally
    container.style.justifyContent = 'center'; // Center the text vertically
    container.style.textAlign = 'center';
    }
}

socket.on('disconnected', (backEndPlayers, id) => {
    for (const id in frontEndPlayers) {
        if(!backEndPlayers[id]){
            delete frontEndPlayers[id];
        }
    }
     const container = document.querySelector('.grid[data-id="' + id + '"]');
     container.innerHTML = '';
         container.innerHTML = ''; // Clear the grid container
   
    
    container.textContent = 'RAN!'; // Display "You Lost!" message
    container.style.fontSize = '32px'; // Increase font size for visibility
    container.style.color = 'red'; // Set text color to red
    container.style.alignItems = 'center'; // Center the text horizontally
    container.style.justifyContent = 'center'; // Center the text vertically
    container.style.textAlign = 'center';
});
socket.on('home', (backEndPlayers, data) => {

    screen.innerHTML = ''; // Clear the screen before creating a new grid\
    var i = 1;
    for(const id in backEndPlayers){
        const backEndPlayer = backEndPlayers[id];
        if(!frontEndPlayers[id]){
            frontEndPlayers[id] = new Player(0, 0, 3, backEndPlayer.username, id);
        }  
        else{
            frontEndPlayers[id].username = backEndPlayers[id].username;
        }
    }
    for (const id in frontEndPlayers){
        if(!backEndPlayers[id]){
            delete frontEndPlayers[id];
        }
        
    }
    players = Object.keys(backEndPlayers).length; // Update the number of players
    loading();
});
socket.on('updateTime' , (time) => {
    remainingTime = time;
    let timer = document.querySelectorAll('.timer');
        timer.forEach((t) => {
            t.textContent = ' Time Left: ' + time;
        });
   
    });

socket.on('startGame', (players, data) => {
    setTimeout(() => {
        renderGameScreen(players, data, 5, true);
    }, 500);
});
socket.on('finished', (player, id) => {
    
        position ++;
    
    frontEndPlayers[id].score = player.score;
    const container = document.querySelector('.grid[data-id="' + id + '"]');
    container.innerHTML = ''; // Clear the grid container
    const size = container.clientHeight / 2 - 50 + 'px';
    
    container.style.width = size + 'px'; // Set the width of the grid container
    container.style.height = size + 'px'; // Set the height of
    
    container.innerHTML = 'DOPADOWN! '+ '<br>Position: ' + position; // Display "You Lost!" message
    container.style.fontSize = '32px'; // Increase font size for visibility
    container.style.color = 'GREEN'; // Set text color to red
    container.style.alignItems = 'center'; // Center the text horizontally
    container.style.justifyContent = 'center'; // Center the text vertically
});


socket.on('nextRound', (player, players, correctData, level, rows, newGame) => {

    position = 0; 
    setTimeout (() => {
        for (const id in players){
            frontEndPlayers[id].lives = players[id].lives 
        }
        if (frontEndPlayers[player]){
            console.log('hello')
        frontEndPlayers[player].score = players[player].score;
        if (newGame){
            renderGameScreen(players, correctData, 5, true);
        }
        else{
            renderGameScreen(players, correctData, rows, false);
        }
        }
    }, 20);


   
});

socket.on('score', (playerData, id) => {
   
    
    frontEndPlayers[id].lives = playerData.lives; // Update the player's data
    frontEndPlayers[id].score = playerData.score;
    const temp = document.querySelector('.text-container[data-id="' + id + '"]');
    temp.textContent = '';
    let p0 = document.createElement('p')
    let p1 = document.createElement('p');
    let p2 = document.createElement('p');
    let p3 = document.createElement('p')
    p3.className = 'timer'
    if (socket.id === id){
        
        p0.textContent = frontEndPlayers[id].username + " (YOU)";
    } else {
        p0.textContent = frontEndPlayers[id].username;
    }
    p1.textContent = ' Lives: ' + playerData.lives;
    p2.textContent = ' Score: ' + playerData.score;
    p3.textContent = ' Time Left: ' + remainingTime;
    temp.appendChild(p0);
    temp.appendChild(p1);
    temp.appendChild(p2);
    temp.appendChild(p3);
});

socket.on('update', (backEndPlayers, id) => {
    for(const id in backEndPlayers){
        frontEndPlayers[id].username = backEndPlayers[id].username;
        frontEndPlayers[id].ready = backEndPlayers[id].ready;
    }
    const list = document.querySelector('#playersList');
    list.innerHTML = ''; // Clear existing list items
    
    for(const key of Object.keys(frontEndPlayers)){
            const player = frontEndPlayers[key];
            const listItem = document.createElement('li');

            if (key === socket.id) {
                listItem.classList.add('you');
            }

            const statusClass = player.ready ? 'status-ready' : 'status-not-ready';
            const statusText = player.ready ? 'Ready' : 'Not Ready';
            listItem.innerHTML = `<span>${player.username} ${key === socket.id ? '(You)' : ''}</span> <span class="${statusClass}">${statusText}</span>`;
            
            list.appendChild(listItem);
        }
     // Update the ready button state
    const readyButton = document.querySelector('#readyButton');
    if (readyButton && frontEndPlayers[socket.id]) {
        if (frontEndPlayers[socket.id].ready) {
            readyButton.textContent = 'Unready';
            readyButton.classList.remove('not-ready');
            readyButton.classList.add('ready');
        } else {
            readyButton.textContent = 'Ready Up';
            readyButton.classList.remove('ready');
            readyButton.classList.add('not-ready');
        }
    }
});
socket.on('gameOver', (backEndPlayers) => {
    for (const p in frontEndPlayers){
        frontEndPlayers[p].ready = false;
    }
    screen.innerHTML = '';

    screen.className = ''; // Reset screen classes

    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.className = 'leaderboard-container';

    const title = document.createElement('h1');
    title.textContent = 'Game Over';

    const subtitle = document.createElement('h2');
    subtitle.textContent = 'Final Scores';

    const playersArray = Object.values(backEndPlayers);
    playersArray.sort((a, b) => b.score - a.score);

    const playerList = document.createElement('ol');

    playersArray.forEach((player, index) => {
        const playerEntry = document.createElement('li');
        let medal = '';
        if (index === 0) medal = '1ST';
        else if (index === 1) medal = '2ND';
        else if (index === 2) medal = '3RD';
        else medal = `${index + 1}TH`;
        
        playerEntry.textContent = `${medal} ${player.username} - ${player.score}`;
        playerList.appendChild(playerEntry);
    });

    const homeButton = document.createElement('button');
    homeButton.textContent = 'Return to Home';
    homeButton.addEventListener('click', () => socket.emit('goHome'));

    leaderboardContainer.append(title, subtitle, playerList, homeButton);
    screen.appendChild(leaderboardContainer);

    });
  

socket.on('lostGame', (backEndPlayers, player) => {
    const container = document.querySelector('.grid[data-id="' + player + '"]');
    container.innerHTML = ''; // Clear the grid container
   
    
    container.textContent = 'UTRASH!'; // Display "You Lost!" message
    container.style.fontSize = '32px'; // Increase font size for visibility
    container.style.color = 'red'; // Set text color to red
    container.style.alignItems = 'center'; // Center the text horizontally
    container.style.justifyContent = 'center'; // Center the text vertically
    container.style.textAlign = 'center';
});
socket.on('cellClicked', (num, player) => {
    console.log('Cell clicked:', num);
    console.log('By player:', player);
    
    const cell = document.querySelector('.newCell[style*="grid-area: ' + num + '"][data-id="' + player + '"]');
    if (cell && !(frontEndPlayers[player].cellsClicked.includes(num))) {
        frontEndPlayers[player].cellsClicked.push(num);
        if (frontEndPlayers[player].correctData.includes(num) ) {
            cell.style.backgroundColor = '#0f0'; // Change color to green if correct
            frontEndPlayers[player].correct += 1;
            frontEndPlayers[player].correctData.splice(frontEndPlayers[player].correctData.indexOf(num), 1); // Remove the number from correctData
            frontEndPlayers[player].score += 10;
            if (frontEndPlayers[player].correctData.length === 0 && player === socket.id) {
                console.log('0 cells left');
                socket.emit('wonRound', frontEndPlayers, player);
                return;
            }
            
        } else {
            cell.style.backgroundColor = '#f00'; // Change color to red if incorrect
            frontEndPlayers[player].chances -= 1;
            
           
            
            let allDead = true;
            let deadRound = true;
            for (const key in frontEndPlayers){
                if (frontEndPlayers[key].lives >= 1){
                    allDead = false;
                }
                if (frontEndPlayers[key].chances >= 1){
                    deadRound = false;
                }
            }
            if(allDead){
                socket.emit('gameOver', frontEndPlayers);
                
                return;
            }
            if (deadRound && player === socket.id){
                socket.emit('deadRound', player);
                
                
            }
            if (frontEndPlayers[player].chances <= 0 && player === socket.id) {
                frontEndPlayers[player].lives -= 1;
                socket.emit('lostGame', frontEndPlayers, player);
                socket.emit('updateScore', frontEndPlayers[player], player);
            } 
           
        }
        /*
        for (let i = 0; i < cell.length; i++) {
            console.log('Cell clicked by:', socket.id);
            console.log(cell[i].dataset.id);
            if(correctData.includes(num) && cell[i].dataset.id == socket.id){
                cell[i].style.backgroundColor = 'green'; // Change color to green if correct
            } 
            if (cell[i].dataset.id == socket.id && !correctData.includes(num)) {
                cell[i].style.backgroundColor = 'red'; // Change color to red if incorrect
            }

        }*/
    }
    if (player === socket.id){
    socket.emit('updateScore', frontEndPlayers[player], player);
    };
});
       
function loading(){
    // Clear screen and reset styles for the login view
    screen.innerHTML = '';
    screen.style.flexDirection = 'column';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';

    // 1. Create the main login container
    const loginContainer = document.createElement('div');
    loginContainer.id = 'login-container';

    // 2. Create all necessary elements
    const title = document.createElement('h1');
    const greetingOutput = document.createElement('p');

    // Username input group
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    const userLabel = document.createElement('label');
    const usernameInput = document.createElement('input');
    const submitButton = document.createElement('button');

    // Player list
    const listContainer = document.createElement('div');
    listContainer.id = 'playersList-container';
    const listTitle = document.createElement('h2');
    const list = document.createElement('ul');
    
    // Ready button
    let readyButton = document.createElement('button');

    // 3. Configure the elements
    title.textContent = 'MemTest';
    greetingOutput.id = 'greeting';

    userLabel.textContent = 'Enter Your Username';
    userLabel.htmlFor = 'usernameInput';

    usernameInput.type = 'text';
    usernameInput.id = 'usernameInput';
    usernameInput.placeholder = 'e.g., PlayerOne';
    // Set current username if it exists
    if (frontEndPlayers[socket.id] && frontEndPlayers[socket.id].username !== 'Guest') {
        usernameInput.value = frontEndPlayers[socket.id].username;
        greetingOutput.textContent = `Welcome back, ${frontEndPlayers[socket.id].username}!`;
    } else {
        greetingOutput.textContent = 'Please enter a username to begin.';
    }

    submitButton.textContent = 'Set Username';
    submitButton.id = 'submit-button';

    list.id = 'playersList';
    listTitle.textContent = 'Players in Lobby';

    // Populate player list
    for(const key of Object.keys(frontEndPlayers)){
        const player = frontEndPlayers[key];
        const listItem = document.createElement('li');
        
        if (key === socket.id) {
            listItem.classList.add('you');
        }

        const statusClass = player.ready ? 'status-ready' : 'status-not-ready';
        const statusText = player.ready ? 'Ready' : 'Not Ready';
        listItem.innerHTML = `<span>${player.username} ${key === socket.id ? '(You)' : ''}</span> <span class="${statusClass}">${statusText}</span>`;
        
        list.appendChild(listItem);
    }

    readyButton.id = 'readyButton';
    // Update ready button text and style based on current state
    if (frontEndPlayers[socket.id] && frontEndPlayers[socket.id].ready) {
        readyButton.textContent = 'Unready';
        readyButton.classList.add('ready');
    } else {
        readyButton.textContent = 'Ready Up';
        readyButton.classList.add('not-ready');
    }

    // 4. Define event listeners
    submitButton.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username) {
            greetingOutput.textContent = `Username set to: ${username}! 👋`;
            frontEndPlayers[socket.id].username = username;
            socket.emit('updatePlayers', frontEndPlayers[socket.id], socket.id);
        } else {
            greetingOutput.textContent = 'Please enter a valid username.';
        }
    });
    
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitButton.click();
        }
    });

    readyButton.addEventListener('click', () => {
        frontEndPlayers[socket.id].ready = !frontEndPlayers[socket.id].ready;
        socket.emit('ready', frontEndPlayers[socket.id], socket.id);
    });
    
    // 5. Append elements to build the structure
    formGroup.append(userLabel, usernameInput);
    listContainer.append(listTitle, list);
    loginContainer.append(title, greetingOutput, formGroup, submitButton, listContainer, readyButton);
    
    screen.appendChild(loginContainer);
}