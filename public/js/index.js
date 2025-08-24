
var level = 5;

const socket = io(); // Connect to the server

const screen = document.querySelector('#screen');

var gridRow = level; // Number of rows in the grid

var gridData = []; // Array to hold grid data


var players = 2;


const frontEndPlayers = {}

function createContainer(id){
     // Clear the screen before creating a new grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'gridContainer'; // Correctly set the class name
    gridContainer.style.display = 'flex';
    gridContainer.style.flexDirection = 'column';
    gridContainer.dataset.id = id;
    gridContainer.style.border = '2px solid black'; // Add border to the grid container
     // Set width of the grid container
    // Add properties to center the grid within its container
    
    gridContainer.style.margin = 'auto'; // Center the grid container horizontally
    const temp = document.createElement('div');
    temp.className = 'textContainer';
    temp.dataset.id = id; // Set the data-id attribute
    console.log(temp.dataset.id);
    temp.style.textAlign = 'center'; // Center he text
    temp.style.marginBottom = '10px'; // Add some space below the text
    temp.style.fontSize = '20px'; // Set font size for better visibility
    temp.style.color = 'black'; // Set text color
    temp.style.fontWeight = 'bold'; // Make the text bold
    gridContainer.appendChild(temp); // Append the text container to the grid container
    temp.textContent = frontEndPlayers[id].username + ' Lives: ' + frontEndPlayers[id].lives + ' Score: ' + frontEndPlayers[id].score;// Add player ID text
    screen.appendChild(gridContainer); // Append the grid container to the screen
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
   
    
     // Use screen's clientWidth and clientHeight to set grid size
    const screenWidth = screen.clientWidth;
    const screenHeight = screen.clientHeight;

    // Make the grid a square that is half the smaller dimension of the screen
    const gridSize = Math.min(screenWidth, screenHeight) / 2; // Adjust size based on number of players

    grid.style.width = gridSize + 'px'; // Set the width of the grid
    grid.style.height = gridSize + 'px'; // Set the height of the grid
    gridContainer.appendChild(grid); // Append the grid to the grid container
    
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < x; j++) {
            const cell = document.createElement('div');
            cell.className = 'newCell';
            cell.style.width = 1/gridRow * 100 + '%'; // Set width of each cell
            cell.style.height = 1/gridRow * 100 + '%'; // Set height of each cell
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
// ...existing code...

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

socket.on('startGame', (players, data) => {
    screen.style.width = '95vw';
    screen.style.height = '90vh';
    
    screen.style.flexWrap = 'wrap';
    screen.style.flexDirection = 'row';
    gridRow = 4;
    for (const id in frontEndPlayers){
        frontEndPlayers[id].score = 0;
        frontEndPlayers[id].cellsClicked = [];
        frontEndPlayers[id].lives = 3;
        frontEndPlayers[id].chances = 3;
        
    }

    setTimeout(() => {
    screen.innerHTML = ''; // Clear the screen before creating a new grid\
    for (const id in frontEndPlayers){
        frontEndPlayers[id].lives = 3;
        frontEndPlayers[id].cellsClicked = [];
        frontEndPlayers[id].correctData = [];
        createContainer(id);
        createGrid(gridRow, id);
        frontEndPlayers[id].correctData = structuredClone(data);
    }
    generateCorrect(socket.id)
    attach();
    }, 500);
});

socket.on('nextRound', (player, players, correctData, level, rows) => {
    
    setTimeout (() => {
    screen.innerHTML = ''; // Clear the screen before creating a new grid\
    gridRow = rows;
    frontEndPlayers[player].score = players[player].score;
    for (const id in frontEndPlayers){
       
        frontEndPlayers[id].chances = 3;
        frontEndPlayers[id].cellsClicked = [];
        frontEndPlayers[id].correctData = [];
        createContainer(id);
        createGrid(gridRow,id);
        frontEndPlayers[id].correctData = structuredClone(correctData);
        
    }
    generateCorrect(socket.id)
    attach();
    console.log(frontEndPlayers[player].correctData);
    }, 20);
});

    /*
    
   

    correctData = data;// Ensure correctData is defined
    generateCorrect();
    attach();
    console.log('Correct data:', correctData);
    console.log('Number of players:', players);
    console.log('Updated players:', frontEndPlayers);
});
*/

socket.on('score', (playerData, id) => {
    console.log('hello'+id);
    frontEndPlayers[id].lives = playerData.lives; // Update the player's data
    frontEndPlayers[id].score = playerData.score;
    const temp = document.querySelector('.textContainer[data-id="' + id + '"]');
    temp.textContent = playerData.username + ' Lives: ' + playerData.lives + ' Score: ' + playerData.score ; // Update the text content
});

socket.on('update', (backEndPlayers, id) => {
    for(const id in backEndPlayers){
        frontEndPlayers[id].username = backEndPlayers[id].username;
        frontEndPlayers[id].ready = backEndPlayers[id].ready;
    }
    const list = document.querySelector('#playersList');
    list.innerHTML = 'Current Players:'; // Clear existing list items
    
    for(const key of Object.keys(frontEndPlayers)){
        const listItem = document.createElement('li');
        if (key === socket.id && frontEndPlayers[key].ready === false) {
        listItem.textContent = frontEndPlayers[key].username + "(You) - Not Ready";
        }
        else if (key === socket.id && frontEndPlayers[key].ready === true) {
            listItem.textContent = frontEndPlayers[key].username + "(You) - Ready";
        }
        else if (frontEndPlayers[key].ready === true) {
            listItem.textContent = frontEndPlayers[key].username + " - Ready";
        }
        else{
            listItem.textContent = frontEndPlayers[key].username + " - Not Ready";
        }
        listItem.style.margin = '5px 0'; // Add some space between list items
        listItem.style.fontSize = '18px'; // Increase font size for better visibility
        listItem.style.color = 'blue'; // Change text color for better visibility
        listItem.style.fontWeight = 'bold';
        listItem.style.textAlign = 'center'; // Center the list items
         // Style the list items for better visibility  
        list.appendChild(listItem);
    }
    const container = document.querySelector('#container');
    const readyButton = document.querySelector('#readyButton');
    container.appendChild(readyButton);
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
    const size = Math.min(screen.clientWidth, screen.clientHeight) / 2;
    
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
            
            if (frontEndPlayers[player].chances <= 0 && player === socket.id) {
                frontEndPlayers[player].lives -= 1;
                socket.emit('lostGame', frontEndPlayers, player);
                socket.emit('updateScore', frontEndPlayers[player], player);
            } 
            
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
                socket.emit('updateScore', frontEndPlayers[player], player);
                return;
            }
            if (deadRound && player === socket.id){
                socket.emit('deadRound', player);
                socket.emit('updateScore', frontEndPlayers[player], player);
                return;
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
    // 1. Get the container element from the HTML
    screen.style.flexDirection = 'column';
    screen.style.alignItems = 'center';
    const container = document.createElement('div');
    container.id = 'container';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    // Ensure the screen is in column mode
    // 2. Create all necessary elements in memory
    const title = document.createElement('h1');
    const userLabel = document.createElement('label');
    const usernameInput = document.createElement('input');
    const submitButton = document.createElement('button');
    const greetingOutput = document.createElement('p');


    // 3. Configure the elements
    title.textContent = 'LOGIN!';

    userLabel.textContent = 'Username:';
    userLabel.htmlFor = 'usernameInput'; // Links label to input for accessibility

    usernameInput.type = 'text';
    usernameInput.id = 'usernameInput';
    usernameInput.placeholder = 'e.g., user123';

    submitButton.textContent = 'Submit';

    greetingOutput.id = 'greeting';

    const list = document.createElement('ul');
    list.id = 'playersList';
    list.style.listStyleType = 'none'; // Remove default list styling
    list.style.padding = '0'; // Remove default padding
    list.style.marginTop = '20px'; // Add some space above the list for better visibility  
    list.textContent = 'Current Players:';
    list.textAlign = 'center'; // Center the list title

    submitButton.addEventListener('click', () => {
        const username = usernameInput.value; // Get value from the created input
        if (username) {
            greetingOutput.textContent = `Hello, ${username}! 👋`;
            frontEndPlayers[socket.id].username = username;
            socket.emit('updatePlayers', frontEndPlayers[socket.id], socket.id);
        } else {
            greetingOutput.textContent = 'Please enter a username.';
            
        }
    });

    for(const key of Object.keys(frontEndPlayers)){
        const listItem = document.createElement('li');
        if (key === socket.id) {
        listItem.textContent = frontEndPlayers[key].username + "(You)";
        }
        else{
        listItem.textContent = frontEndPlayers[key].username;
        }
        listItem.style.margin = '5px 0'; // Add some space between list items
        listItem.style.fontSize = '18px'; // Increase font size for better visibility
        listItem.style.color = 'blue'; // Change text color for better visibility
        listItem.style.fontWeight = 'bold';
        listItem.style.textAlign = 'center'; // Center the list items
         // Style the list items for better visibility  
        list.appendChild(listItem);
    }

    readyButton = document.createElement('button');
    readyButton.id = 'readyButton';
    readyButton.textContent = 'Ready';
    readyButton.addEventListener('click', () => {
        if (frontEndPlayers[socket.id].ready === false) {
            frontEndPlayers[socket.id].ready = true;
            console.log(frontEndPlayers[socket.id]);
            socket.emit('ready', frontEndPlayers[socket.id], socket.id);
        }
        else{
            frontEndPlayers[socket.id].ready = false;
            socket.emit('ready', frontEndPlayers[socket.id], socket.id);
        }
    });
    // 4. Define what happens when the button is clicked
    
    
    container.append(title, userLabel, usernameInput, submitButton, greetingOutput, list, readyButton); // 4. Append all elements to the container
    screen.appendChild(container); // 5. Append the container to the screen
}