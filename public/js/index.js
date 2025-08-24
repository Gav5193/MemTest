
var level = 5;

const socket = io(); // Connect to the server

const screen = document.querySelector('#screen');

var gridRow = level; // Number of rows in the grid

var gridData = []; // Array to hold grid data

var correctData = [];

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
    temp.textContent = frontEndPlayers[id].username + frontEndPlayers[id].lives ;// Add player ID text
    screen.appendChild(gridContainer); // Append the grid container to the screen
}
function createGrid(x,id) {

    
    const gridContainer = document.querySelector('.gridContainer[data-id="' + id + '"]');
    // Center the grid container
    const grid = document.createElement('div');
    grid.style.display = 'flex';
    grid.style.flexDirection = 'row';
    grid.style.flexWrap = 'wrap';
   
    
     // Use screen's clientWidth and clientHeight to set grid size
    const screenWidth = screen.clientWidth;
    const screenHeight = screen.clientHeight;

    // Make the grid a square that is half the smaller dimension of the screen
    const gridSize = Math.min(screenWidth, screenHeight) / 2;

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



function generateCorrect() {
    
     // Highlight correct cells
    correctData.forEach(index => {
        const cell = document.querySelectorAll(`.newCell[style*="grid-area: ${index}"]`);
        if (cell) {
            cell.forEach(c => c.style.backgroundColor = 'green');
            
        }
    });

    // Fade out after a delay
    setTimeout(() => {
        correctData.forEach(index => {
            const cell = document.querySelectorAll(`.newCell[style*="grid-area: ${index}"]`);
            if (cell) {
                cell.forEach(c => {
                    c.style.transition = 'background-color 0.5s ease', // Add transition for smooth fading
                    c.style.backgroundColor = 'grey'});
                
            }
        });
    }, 3000); // Delay of 3 seconds (3000 milliseconds)
}
// ...existing code...

socket.on('players', (backEndPlayers, data) => {
    screen.innerHTML = ''; // Clear the screen before creating a new grid\
    var i = 1;
    for(const id in backEndPlayers){
        const backEndPlayer = backEndPlayers[id];
        if(!frontEndPlayers[id]){
            frontEndPlayers[id] = new Player(0,0,i++,'Guest', id);
        }  
        createContainer(id);
        createGrid(level, id);
    }
    for (const id in frontEndPlayers){
        if(!backEndPlayers[id]){
            delete frontEndPlayers[id];
        }
    }
    players = Object.keys(backEndPlayers).length; // Update the number of players
   

    correctData = data;// Ensure correctData is defined
    generateCorrect();
    attach();
    console.log('Correct data:', correctData);
    console.log('Number of players:', players);
    console.log('Updated players:', frontEndPlayers);
});

socket.on('score', (playerData, id) => {
    console.log('hello'+id);
    frontEndPlayers[id].lives = playerData.lives; // Update the player's data
    const temp = document.querySelector('.textContainer[data-id="' + id + '"]');
    temp.textContent = playerData.username + ' Lives: ' + playerData.lives; // Update the text content
});


socket.on('cellClicked', (num, player) => {
    console.log('Cell clicked:', num);
    console.log('By player:', player);
    
    const cell = document.querySelector('.newCell[style*="grid-area: ' + num + '"][data-id="' + player + '"]');
    if (cell && !(frontEndPlayers[player].cellsClicked.includes(num))) {
        if (correctData.includes(num) ) {
            cell.style.backgroundColor = 'green'; // Change color to green if correct
            frontEndPlayers[player].correct += 1;
            
        } else {
            cell.style.backgroundColor = 'red'; // Change color to red if incorrect
            frontEndPlayers[player].lives -= 1;
            
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
        frontEndPlayers[player].cellsClicked.push(num);
    }
    socket.emit('updateScore', frontEndPlayers[player], player);
});
       
