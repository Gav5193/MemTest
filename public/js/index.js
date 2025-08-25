
var level = 5;

const socket = io(); // Connect to the server

const screen = document.querySelector('#screen');

var gridRow = level; // Number of rows in the grid

var gridData = []; // Array to hold grid data
var remainingTime = 0;
var players = 2;


const frontEndPlayers = {}

function createContainer(id, parentElement){
     // Clear the screen before creating a new grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'gridContainer'; // Correctly set the class name
    gridContainer.style.display = 'flex';
    gridContainer.style.flexDirection = 'row';
    gridContainer.dataset.id = id;
    gridContainer.style.border = '2px solid black'; // Add border to the grid container
    gridContainer.style.justifyContent = 'center';
    gridContainer.style.alignItems = 'center';
     // Set width of the grid container
    // Add properties to center the grid within its container
    gridContainer.style.flex = '1 1 0';
   
    if (parentElement.id != 'screen'){
        gridContainer.style.height = '100%'
    }
    else{
        gridContainer.style.height = '50vh';
    }
    
 
    var width = 1/Object.keys(frontEndPlayers).length *100;
    gridContainer.style.width =  width + '%';
    gridContainer.style.margin = '0px';
    gridContainer.style.boxSizing = 'border-box';
    gridContainer.style.alignItems = 'center'; 

    const temp = document.createElement('div');
    temp.className = 'textContainer';
    temp.dataset.id = id; // Set the data-id attribute
    console.log(temp.dataset.id);
    temp.style.textAlign = 'center'; // Center he text
    temp.style.width = '150px';
    temp.style.fontSize = '20px'; // Set font size for better visibility
    temp.style.color = 'black'; // Set text color
    temp.style.fontWeight = 'bold'; // Make the text bold
    gridContainer.appendChild(temp); // Append the text container to the grid container
    if (socket.id === id){
        temp.textContent = frontEndPlayers[id].username + " (YOU) ";
        gridContainer.style.backgroundColor = 'orange';
    }
    else{
        temp.textContent = frontEndPlayers[id].username 
        gridContainer.style.backgroundColor = '#ADD8E6';
    };
        
    let p1 = document.createElement('p');
    let p2 = document.createElement('p')
    let p3 = document.createElement('p')
    p3.className = 'timer'
    p1.textContent = ' Lives: ' + frontEndPlayers[id].lives 
    p2.textContent = ' Score: ' + frontEndPlayers[id].score;// Add player ID text
    p3.textContent = ' Time Left: ' + remainingTime;
    temp.appendChild(p1);
    temp.appendChild(p2);
    temp.appendChild(p3);

    

    parentElement.appendChild(gridContainer);

}
function createGrid(x,id) {

    
    const gridContainer = document.querySelector('.gridContainer[data-id="' + id + '"]');
    // Center the grid container
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.dataset.id= id;
    grid.style.display = 'flex';
    grid.style.flexDirection = 'row';
    grid.style.flexWrap = 'wrap';
    grid.style.width = '40vh';
    grid.style.height = '40vh';
   
    
     // Use screen's clientWidth and clientHeight to set grid size
    const screenWidth = screen.clientWidth;
    const screenHeight = screen.clientHeight;

    // Make the grid a square that is half the smaller dimension of the screen
    const gridSize = Math.min(screen.clientHeight, screen.clientWidth) / 1.5; // Adjust size based on number of players

    
    gridContainer.appendChild(grid); // Append the grid to the grid container
    
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < x; j++) {
            const cell = document.createElement('div');
            cell.className = 'newCell';
            cell.style.width = 1/x * 100 + '%'; // Set width of each cell
            cell.style.height = 1/x * 100 + "%"; // Set height of each cell
            cell.style.display = 'inline-block'; // Display cells inline
            cell.style.border = '1px solid black'; // Add border to cells
            cell.style.boxSizing = 'border-box'; // Include border in width/height calculations
            cell.style.backgroundColor = 'grey'; // Set background color for cells
            cell.style.gridArea = (i * x + j + 1); // Unique identifier for each cell
            cell.dataset.id = id; // Set the data-index attribute
            grid.appendChild(cell);
        }
    }
}


function generateCorrect(id) {
    
     // Highlight correct cells
    frontEndPlayers[id].correctData.forEach(index => {
        for(let i = 0; i < Object.keys(frontEndPlayers).length; i++){
            const cell = document.querySelector('.newCell[style*="grid-area: ' + index + '"][data-id="' + id + '"]');
            console.log(cell);
            cell.style.backgroundColor = 'yellow'; // Highlight correct cells in yellow
            
        }
    });

    // Fade out after a delay
    setTimeout(() => {
        frontEndPlayers[id].correctData.forEach(index => {
            const cell = document.querySelectorAll('.newCell[style*="grid-area: ' + index + '"][data-id="' + id + '"]');
            if (cell) {
                cell.forEach(c => {
                    if (c.style.backgroundColor != 'green'){
                    c.style.transition = 'background-color 0.5s ease', // Add transition for smooth fading
                    c.style.backgroundColor = 'grey'
                    }
                });
                }
            });
            
        
    }, 3000); // Delay of 3 seconds (3000 milliseconds)
}

function renderGameScreen(players, data, gridRow, isNewGame = false) {
    screen.innerHTML = ''; // Clear the screen

    const playerIds = Object.keys(players);
    const playerCount = playerIds.length;

    // Set up player data
    for (const id in players) {
        if (isNewGame) {
            frontEndPlayers[id].score = 0;
            frontEndPlayers[id].lives = 3;
        }
        frontEndPlayers[id].chances = 3;
        frontEndPlayers[id].cellsClicked = [];
        frontEndPlayers[id].correctData = structuredClone(data);
    }
    console.log(playerCount);
    if (playerCount > 3) {
        // Two-row layout for more than 3 players
        screen.style.display = 'flex';
        screen.style.flexDirection = 'column';
        screen.style.justifyContent = 'center';
        screen.style.alignItems = 'center';
        screen.style.height = '100vh';
        screen.style.width = '100vw'

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'center';
        topRow.style.alignItems = 'center';
        topRow.style.width = '100%';
        topRow.style.height = '50%'

        const bottomRow = document.createElement('div');
        bottomRow.style.display = 'flex';
        bottomRow.style.justifyContent = 'center';
        bottomRow.style.alignItems = 'center';
        bottomRow.style.width = '100%';
        bottomRow.style.height = '50%'

        screen.appendChild(topRow);
        screen.appendChild(bottomRow);

        const splitIndex = Math.ceil(playerCount / 2);

        playerIds.forEach((id, index) => {
            const parentRow = index < splitIndex ? topRow : bottomRow
            if (frontEndPlayers[id].lives > 0){
            createContainer(id, parentRow);
            createGrid(gridRow, id);
            }
            else{
                createContainer(id, parentRow);
                createGrid(gridRow, id);
                const container = document.querySelector('.grid[data-id="' + id + '"]');
    container.innerHTML = ''; // Clear the grid container
    const size = screen.clientHeight / 2 - 50 + 'px';
    
    container.style.width = size + 'px'; // Set the width of the grid container
    container.style.height = size + 'px'; // Set the height of
    
    container.textContent = 'UDEAD!'; // Display "You Lost!" message
    container.style.fontSize = '48px'; // Increase font size for visibility
    container.style.color = 'red'; // Set text color to red
    container.style.alignItems = 'center'; // Center the text horizontally
    container.style.justifyContent = 'center'; // Center the text vertically
            }
        });
    } else {
        // Single-row layout for 3 or fewer players
        screen.style.display = 'flex';
        screen.style.flexDirection = 'row';
        screen.style.flexWrap = 'wrap';
        screen.style.justifyContent = 'center';
        screen.style.alignItems = 'center';
        screen.style.height = '100vh';
        screen.style.row = '100vw'

            playerIds.forEach((id) => {
            if (frontEndPlayers[id].lives > 0){
            createContainer(id, screen);
            createGrid(gridRow, id);
            }
            else{
                createContainer(id, screen);
                createGrid(gridRow, id);
                const container = document.querySelector('.grid[data-id="' + id + '"]');
                container.innerHTML = ''; // Clear the grid container
                const size = screen.clientHeight / 2 - 50 + 'px';
                
                container.style.width = size + 'px'; // Set the width of the grid container
                container.style.height = size + 'px'; // Set the height of
                
                container.textContent = 'UDEAD!'; // Display "You Lost!" message
                container.style.fontSize = '48px'; // Increase font size for visibility
                container.style.color = 'red'; // Set text color to red
                container.style.alignItems = 'center'; // Center the text horizontally
                container.style.justifyContent = 'center'; // Center the text vertically
            }
        });
    } 
   
    generateCorrect(socket.id);
    attach();
}

socket.on('disconnected', (backEndPlayers, id) => {
    for (const id in frontEndPlayers) {
        if(!backEndPlayers[id]){
            delete frontEndPlayers[id];
        }
    }
});
socket.on('players', (backEndPlayers, data) => {

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
        renderGameScreen(players, data, 4, true);
    }, 500);
});
socket.on('finished', (player, id) => {
   frontEndPlayers[id].score = player.score;
    const container = document.querySelector('.grid[data-id="' + id + '"]');
    container.innerHTML = ''; // Clear the grid container
    const size = screen.clientHeight / 2 - 50 + 'px';
    
    container.style.width = size + 'px'; // Set the width of the grid container
    container.style.height = size + 'px'; // Set the height of
    
    container.textContent = 'DOPADOWN!'; // Display "You Lost!" message
    container.style.fontSize = '48px'; // Increase font size for visibility
    container.style.color = 'GREEN'; // Set text color to red
    container.style.alignItems = 'center'; // Center the text horizontally
    container.style.justifyContent = 'center'; // Center the text vertically
});


socket.on('nextRound', (player, players, correctData, level, rows) => {
    
    setTimeout (() => {
        for (const id in players){
            frontEndPlayers[id].lives = players[id].lives 
        }
        frontEndPlayers[player].score = players[player].score;
        renderGameScreen(players, correctData, rows, false);
    }, 20);


   
});

socket.on('score', (playerData, id) => {
   
    frontEndPlayers[id].lives = playerData.lives; // Update the player's data
    frontEndPlayers[id].score = playerData.score;
    const temp = document.querySelector('.textContainer[data-id="' + id + '"]');
    let p1 = document.createElement('p');
    let p2 = document.createElement('p');
    let p3 = document.createElement('p')
    p3.className = 'timer'
    p1.textContent = ' Lives: ' + playerData.lives;
    p2.textContent = ' Score: ' + playerData.score;
    p3.textContent = ' Time Left: ' + remainingTime;
    temp.textContent = playerData.username; 
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
    list.innerHTML = 'Current Players:'; // Clear existing list items
    
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
 
    screen.style.flexDirection = 'column';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';

    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.style.border = '3px solid gold';
    leaderboardContainer.style.padding = '25px';
    leaderboardContainer.style.borderRadius = '10px';
    leaderboardContainer.style.backgroundColor = '#f0f8ff';
    leaderboardContainer.style.textAlign = 'center';

    const title = document.createElement('h1');
    title.textContent = 'Game Over!';
    title.style.color = 'navy';
    leaderboardContainer.appendChild(title);

    const subtitle = document.createElement('h2');
    subtitle.textContent = 'Final Scores';
    subtitle.style.color = 'darkslategray';
    subtitle.style.borderBottom = '2px solid navy';
    subtitle.style.paddingBottom = '10px';
    subtitle.style.marginBottom = '20px';
    leaderboardContainer.appendChild(subtitle);

    const playersArray = Object.values(backEndPlayers);
    playersArray.sort((a, b) => b.score - a.score);

    const playerList = document.createElement('ol');
    playerList.style.listStyle = 'none';
    playerList.style.padding = '0';

    playersArray.forEach((player, index) => {
        const playerEntry = document.createElement('li');
        playerEntry.style.fontSize = '20px';
        playerEntry.style.padding = '10px';
        playerEntry.style.borderBottom = '1px solid #ccc';
        
        if (index === 0) { // Highlight the winner
            playerEntry.style.fontWeight = 'bold';
            playerEntry.style.color = 'green';
            playerEntry.textContent = `🥇 1. ${player.username} - ${player.score} points`;
        } else if (index === 1) {
            playerEntry.style.color = 'saddlebrown';
            playerEntry.textContent = `🥈 ${index + 1}. ${player.username} - ${player.score} points`;
        } else if (index === 2) {
            playerEntry.style.color = 'darkgray';
            playerEntry.textContent = `🥉 ${index + 1}. ${player.username} - ${player.score} points`;
        } else {
            playerEntry.textContent = `${index + 1}. ${player.username} - ${player.score} points`;
        }

        if (index === playersArray.length - 1) {
            playerEntry.style.borderBottom = 'none';
        }

        playerList.appendChild(playerEntry);
    });

    leaderboardContainer.appendChild(playerList);

       const homeButton = document.createElement('button');
    homeButton.textContent = 'Return to Home';
    homeButton.style.marginTop = '20px';
    homeButton.style.padding = '10px 20px';
    homeButton.style.fontSize = '16px';
    homeButton.style.cursor = 'pointer';
    homeButton.style.border = 'none';
    homeButton.style.borderRadius = '5px';
    homeButton.style.backgroundColor = 'navy';
    homeButton.style.color = 'white';

    homeButton.addEventListener('click', () => {
        socket.emit('goHome');
    });

    leaderboardContainer.appendChild(homeButton);
    screen.appendChild(leaderboardContainer);

    });
  

socket.on('lostGame', (backEndPlayers, player) => {
    const container = document.querySelector('.grid[data-id="' + player + '"]');
    container.innerHTML = ''; // Clear the grid container
    const size = screen.clientHeight / 2 - 50 + 'px';
    
    container.style.width = size + 'px'; // Set the width of the grid container
    container.style.height = size + 'px'; // Set the height of
    
    container.textContent = 'UTRASH!'; // Display "You Lost!" message
    container.style.fontSize = '48px'; // Increase font size for visibility
    container.style.color = 'red'; // Set text color to red
    container.style.alignItems = 'center'; // Center the text horizontally
    container.style.justifyContent = 'center'; // Center the text vertically
});
socket.on('cellClicked', (num, player) => {
    console.log('Cell clicked:', num);
    console.log('By player:', player);
    
    const cell = document.querySelector('.newCell[style*="grid-area: ' + num + '"][data-id="' + player + '"]');
    if (cell && !(frontEndPlayers[player].cellsClicked.includes(num))) {
        frontEndPlayers[player].cellsClicked.push(num);
        if (frontEndPlayers[player].correctData.includes(num) ) {
            cell.style.backgroundColor = 'green'; // Change color to green if correct
            frontEndPlayers[player].correct += 1;
            frontEndPlayers[player].correctData.splice(frontEndPlayers[player].correctData.indexOf(num), 1); // Remove the number from correctData
            frontEndPlayers[player].score += 10;
            if (frontEndPlayers[player].correctData.length === 0 && player === socket.id) {
                console.log('0 cells left');
                socket.emit('wonRound', frontEndPlayers, player);
                return;
            }
            
        } else {
            cell.style.backgroundColor = 'red'; // Change color to red if incorrect
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