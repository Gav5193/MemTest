

const socket = io({ autoConnect: false });

const screen = document.querySelector('#screen');
let currentGameMode = '';


const correct = new Audio('/Sounds/correct.mp3');
const incorrect = new Audio('/Sounds/incorrect.wav');

var timeElapsed = 0;
var position = 0;
var yourUsername = 'guest';
var localMode = null;
var localFade = null;
var localClick = null;
var roundListener = null;
var clickListener = null;
var state = "";
const frontEndPlayers = {};

// --- New Entry Point for Lobby Page ---
function initializeLobby() {
    socket.connect();
    yourUsername = sessionStorage.getItem('username') || 'Guest';
    currentGameMode = GAME_MODE; // Use global const from EJS

    socket.emit('joinLobby', ROOM_ID, yourUsername);
    multiLobby(GAME_MODE, IS_IN_PROGRESS);
}

function container() {
    screen.innerHTML = '';
    screen.style.flexDirection = 'column';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';
    const title = document.createElement('h1');
    title.textContent = 'BETA';
    loginContainer.append(title);
    screen.appendChild(loginContainer);
}

function getUsername() {
    const loginContainer = document.querySelector(".login-container");
    const greetingOutput = document.createElement('p');
    const formGroup = document.createElement('div');
    formGroup.className = 'username-group';
    const userLabel = document.createElement('label');
    const usernameInput = document.createElement('input');
    const submitButton = document.createElement('button');
    greetingOutput.id = 'greeting';
    userLabel.textContent = 'Enter Your Username';
    userLabel.htmlFor = 'usernameInput';
    usernameInput.type = 'text';
    usernameInput.id = 'usernameInput';
    usernameInput.placeholder = 'e.g., PlayerOne';
    
    
    if (sessionStorage.getItem('username') != null){
        yourUsername = sessionStorage.getItem('username');
        greetingOutput.textContent = `Welcome back: ${yourUsername}!`;
    }
    else{
        greetingOutput.textContent = 'Please enter a username to begin.';
    }
    
    submitButton.textContent = 'Set Username';
    submitButton.id = 'submit-button';

    submitButton.addEventListener('click', () => {
        yourUsername = usernameInput.value.trim();
        sessionStorage.setItem('username', yourUsername);
        greetingOutput.textContent = yourUsername ? `Username set to: ${yourUsername}!` : 'Please enter a valid username.';
    });
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitButton.click();
    });

    formGroup.append(userLabel, usernameInput);
    loginContainer.append(greetingOutput, formGroup, submitButton);
}

function home() {
    container();
    getUsername();
    const loginContainer = document.querySelector(".login-container");
    
    const multiButton = document.createElement('button');
   
    multiButton.textContent = "Play";
    
    multiButton.addEventListener('click', () => {
        if (sessionStorage.getItem('username')) {
            window.location.href = '/multiplayer';

        } else {
            alert('Please set a username first.');
        }
    });
    loginContainer.append(multiButton);
}

function multiLobby(mode, isInProgress) {
    screen.innerHTML = '';
    screen.style.flexDirection = 'column';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';

    const lobbyContainer = document.createElement('div');
    lobbyContainer.className = 'login-container';

    const title = document.createElement('h1');

    
    title.textContent = 'BETA'
  
    
    const lobbyLink = document.createElement('input');
    lobbyLink.type = 'text';
    lobbyLink.value = window.location.href;
    lobbyLink.readOnly = true;
    lobbyLink.title = 'Click to copy lobby link';
    lobbyLink.onclick = () => {
        lobbyLink.select();
        document.execCommand('copy');
    };
    
    
    const usernameGroup = document.createElement('div');
    usernameGroup.className = 'username-group';
    
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'usernameInputLobby';
    usernameInput.placeholder = 'Change your username';
    usernameInput.value = sessionStorage.getItem('username') || 'Guest';

    
    const setUsernameButton = document.createElement('button');
    setUsernameButton.textContent = 'Set Username';
    setUsernameButton.id = 'submit-button'

    const homeButton = document.createElement('button')
    homeButton.textContent = 'Back to Home';
    homeButton.addEventListener('click', () => {
        window.location.href = '/'
        });

    const handleUsernameUpdate = () => {
        const newUsername = usernameInput.value.trim();
        if (newUsername) {
            yourUsername = newUsername;
            sessionStorage.setItem('username', newUsername);
            if (frontEndPlayers[socket.id]) {
                frontEndPlayers[socket.id].username = newUsername;
                socket.emit('updateUsername', frontEndPlayers[socket.id]);
            }
           
        } else {
            
        }
    };

    setUsernameButton.addEventListener('click', handleUsernameUpdate);

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUsernameUpdate();
        }
    });
    usernameGroup.append(usernameInput);

    
    const listContainer = document.createElement('div');
    listContainer.className = 'playerslist-container';
    const listTitle = document.createElement('h2');
    listTitle.textContent = 'Players in Lobby';
    listTitle.style.fontSize = '1vw'
    const list = document.createElement('ul');
    list.className = 'playerslist';
    list.id = 'players';

    let readyButton = document.createElement('button');
    readyButton.id = 'readyButton';
    
   

    listContainer.append(listTitle, list);
    lobbyContainer.append(title,  lobbyLink, usernameGroup, setUsernameButton, homeButton,  listContainer, readyButton);

    screen.appendChild(lobbyContainer);

    if (isInProgress){
        readyButton.textContent = 'Game is in Progress'
    }
    else{
        readyButton.textContent = 'Ready Up';
    }
    
    readyButton.classList.add('not-ready');
    
    readyButton.addEventListener('click', () => {
        if(frontEndPlayers[socket.id]) {
            frontEndPlayers[socket.id].ready = !frontEndPlayers[socket.id].ready;
            socket.emit('ready', frontEndPlayers[socket.id], socket.id);
        }
    });
}

function createContainer(id, parentElement) {
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';
    gridContainer.dataset.id = id;
    if(socket.id === id){
        gridContainer.classList.add('is-you')
    }
    const temp = document.createElement('div');
    temp.className = 'text-container';
    temp.dataset.id = id;
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.dataset.id = id;
    gridContainer.append(temp, grid)
    parentElement.appendChild(gridContainer);
}

function generateText(id){
    
    const textContainer = document.querySelector(`.text-container[data-id="${id}"]`);
    textContainer.innerHTML = ''
    const p0 = document.createElement('p');
    const p1 = document.createElement('p');
    const p2 = document.createElement('p');
    const p3 = document.createElement('p');
    p3.className = 'timer';
    if (socket.id === id) {
      
        p0.textContent = frontEndPlayers[id].username + " (YOU)";
    } else {
        p0.textContent = frontEndPlayers[id].username;
    }
    p1.textContent = 'Lives: ' + frontEndPlayers[id].lives;
    p2.textContent = 'Level: ' + frontEndPlayers[id].level;
    textContainer.append(p0, p1, p2, p3);
    
}
function createGrid(x, id) {

    const gridContainer = document.querySelector(`.grid-container[data-id="${id}"]`)
    const grid = document.querySelector(`.grid[data-id="${id}"]`);
    grid.innerHTML = ''
    const activePlayerCount = Object.values(frontEndPlayers).length
    const size = Math.min(gridContainer.clientHeight * 0.9, (screen.clientWidth / (activePlayerCount < 3 ? activePlayerCount : Math.ceil(activePlayerCount / 2)) * 0.5));
    grid.style.width = size + 'px';
    
  
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < x; j++) {
            const cell = document.createElement('div');
            cell.className = 'newCell';
            cell.style.width = `${100 / x}%`;
            cell.style.height = `${100 / x}%`;
            cell.style.gridArea = (i * x + j + 1);
            cell.dataset.id = id;
            grid.appendChild(cell);
        }
    }
 
}

function generateCorrect(id) {

    if(socket.id === id){
    let level = frontEndPlayers[id].level 
    frontEndPlayers[id].correctData[level-1].forEach(index => {
        const cell = document.querySelector(`.newCell[style*="grid-area: ${index}"][data-id="${id}"]`);
        if (cell) cell.style.backgroundColor = '#ede8d0';
    });

    if (ourFade){
    roundListener= setTimeout(() => {
        
         
        const pData = frontEndPlayers[id];
        pData.correctData[level-1].forEach(index => {
            if (!pData.cellsClicked.includes(index)) {
            const cell = document.querySelector(`.newCell[style*="grid-area: ${index}"][data-id="${id}"]`);
            if (cell ) {
                cell.style.transition = 'background-color 0.5s ease';
                cell.style.backgroundColor = '#222222';
            }
        }
        });
    }, 3000);
    }
}
}
/*
function attach() {
    const screen = document.querySelector('#screen');

    // A single, smart event listener on the parent container
    var delay = 0;
    if (ourClick === false){
        delay = 3000;
    }
    clickListener = setTimeout(() => {

        const squares = document.querySelectorAll()
    screen.onclick = function(event) {
        const cell = event.target;
        
        // Check if the clicked element is a cell for the current player
        if (cell.classList.contains('newCell') && cell.dataset.id === socket.id) {
            console.log('cell was clicked: ' + socket.id);
            socket.emit('cellClicked', parseInt(cell.style.gridArea));
        }
    };
    }, delay);
}*/
function attach() {
    // Need to access currentGameMode from index.js
    // Ensure index.js is loaded before this script and currentGameMode is a global variable.

    const click = document.querySelectorAll('.newCell[data-id="' + socket.id + '"]');

         var delay = 0;
    if (ourClick === false){
        delay = 3000;
    }
    clickListener = setTimeout(() => {
        click.forEach(cell => {
            cell.addEventListener('click', () => {
                console.log('cell was clicked' + socket.id)
                // Pass the current game mode to the backend
                socket.emit('cellClicked', parseInt(cell.style.gridArea));
            });
        });

    }, delay);
  
}




function renderGameScreen(player, isNewGame) { // Player refers to playerID
    
    screen.innerHTML = '';
      

    const activePlayers = Object.fromEntries(Object.entries(frontEndPlayers).filter(([_, p]) => !p.isSpectator));
    const playerIds = Object.keys(activePlayers);
    const playerCount = playerIds.length;
    
     console.log(playerCount)
        if (playerCount > 2) {
    
            const screenContainer = document.createElement('div')
            screenContainer.flexDirection = 'column';
            screenContainer.style.width = '85%';
            screenContainer.style.height = '100%'
            screen.style.flexDirection = 'column'; 
        screen.className = 'game-screen-two-rows';
        const topRow = document.createElement('div');
        topRow.className = 'game-row';
        const bottomRow = document.createElement('div');
        bottomRow.className = 'game-row';
        screenContainer.append(topRow);
        screenContainer.append(bottomRow);
        screen.appendChild(screenContainer);
        const splitIndex = Math.ceil(playerCount / 2);
        playerIds.forEach((id, index) => {
            const parentRow = index < splitIndex ? topRow : bottomRow;
            renderPlayerGrid(id, parentRow, frontEndPlayers[id].gridRow);
        });
    } else {
        screen.className = 'game-screen-single-row';
        
        playerIds.forEach((id) => {
            renderPlayerGrid(id, screen, frontEndPlayers[id].gridRow);
        });
    }

    screen.style.flexDirection = 'row';
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chatContainer';
    
    
    chatContainer.style.height = '95%';
    chatContainer.style.width = '18%';

    const chatTitle = document.createElement('h1')
    chatTitle.textContent = 'Chat';

    messageBox = document.createElement('div')
    messageBox.id = 'messages';

    inputArea = document.createElement('div')
    input = document.createElement('input')
    input.type = 'text'
    input.placeholder= 'type your message'
    inputArea.append(input);
     
   input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value !== ''){
            const newMessageText = yourUsername + ": " + input.value.trim();
            

            const newMessageDiv = document.createElement('div');
            newMessageDiv.style.borderBottom = '1px'
            newMessageDiv.textContent = newMessageText;
            messageBox.appendChild(newMessageDiv)
            messageBox.scrollTop = messageBox.scrollHeight
            
            socket.emit('updateMessages', newMessageText);
            input.value = '';
        }
    });
    chatContainer.append(chatTitle, messageBox, inputArea)
 
    screen.append(chatContainer)
    generateCorrect(socket.id);
    attach();

}

function renderPlayerGrid(id, parentElement, gridRow) {
    createContainer(id, parentElement);
    generateText(id);
    createGrid(gridRow, id);
    if (frontEndPlayers[id].lives <= 0) {
        const container = document.querySelector(`.grid[data-id="${id}"]`);
        container.innerHTML = 'UTRASH!';
        Object.assign(container.style, { fontSize: '3vw', color: '#e94560', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    }
}

// --- Socket Listeners ---
socket.on('disconnected', (backEndPlayers, id, inProgress) => {
    delete frontEndPlayers[id];
    const container = document.querySelector(`.grid-container[data-id="${id}"]`);
    console.log(inProgress);
    if (inProgress) {
    for(const p in frontEndPlayers){
        renderGameScreen(frontEndPlayers[p], false);
        return;
    }
    }
    if (container) {
        container.innerHTML = '<h2>Player Disconnected</h2>';
    } else {
        const list = document.querySelector('#players');
        const itemToRemove = list?.querySelector(`li[data-id="${id}"]`);
        if (itemToRemove) list.removeChild(itemToRemove);
    }
});


socket.on('updateUsername', (backEndPlayers) =>{
    
    Object.assign(frontEndPlayers, backEndPlayers);
    const list = document.querySelector('#players');
    if (!list) return;

    console.log('yay');
    list.innerHTML = '';
    for (const key in frontEndPlayers) {
        const player = frontEndPlayers[key];
        const listItem = document.createElement('li');
        listItem.style.fontSize = ' 0.8vw'
        listItem.dataset.id = key;
        if (key === socket.id) listItem.classList.add('you');

        const statusClass = player.ready ? 'status-ready' : 'status-not-ready';
        const statusText = player.ready ? 'Ready' : 'Not Ready';
        const spectatorText = player.isSpectator ? ' (Spectating)' : '';

        listItem.innerHTML = `<span>${player.username} ${key === socket.id ? '(You)' : ''}${spectatorText}</span> <span class="${statusClass}">${statusText}</span>`;
        list.appendChild(listItem);
    }
});

socket.on('updateSettings', (mode, fade, click, records) => {
     ourMode = mode;
    ourFade = fade;
    ourClick = click;
        const allModes = document.querySelectorAll('.mode')
        allModes.forEach((item)=> {
            item.style.backgroundColor = '#3b3b3b'
        });
        const modeSelect = document.querySelector('#'+mode);
        modeSelect.style.backgroundColor = '#aaaaaa'
    
    
        const fadeSelect = document.querySelector('#fade')
        if (ourFade){
             fadeSelect.textContent = 'Fade'
        }
        else{
            fadeSelect.textContent = 'No fade'
        }
    

    
        const clickSelect = document.querySelector('#click')

        if (ourClick){
             clickSelect.textContent = 'Early Click'
        }
        else{
             clickSelect.textContent = 'Late Click'
        }
    
    const container = document.querySelector('#leaderboardPlayers');
    console.log(records)
    container.innerHTML = '';
    container.style.fontSize = '0.5vw';
    const playerList = document.createElement('ol');
    records.forEach((player, index) => {
        const medal = ['🥇 1ST', '🥈 2ND', '🥉 3RD'][index] || `${index + 1}TH`
        playerList.innerHTML += `<li class="homeLeaderboard">${medal} ${player.username} Lvl: ${player.level} - Time: ${player.time}</li>`;
    });

    container.append(playerList)
    socket.emit('updateSocket', ourMode);
   
});
socket.on('updateLobby', (backEndPlayers, records, fastestTime, fastestTimeID, highestLevel, highestLevelID, mode, fade_, click_) => {
    
    ourMode = mode;
    ourFade = fade_
    ourClick = click_

    screen.style.flexDirection = 'row';
    
    Object.assign(frontEndPlayers, backEndPlayers);
    const list = document.querySelector('#players');
    if (!list) return;

    list.innerHTML = '';
    for (const key in frontEndPlayers) {
        const player = frontEndPlayers[key];
        const listItem = document.createElement('li');
        listItem.style.fontSize = ' 0.8vw'
        listItem.dataset.id = key;
        if (key === socket.id) listItem.classList.add('you');

        const statusClass = player.ready ? 'status-ready' : 'status-not-ready';
        const statusText = player.ready ? 'Ready' : 'Not Ready';
        const spectatorText = player.isSpectator ? ' (Spectating)' : '';
        
        listItem.innerHTML = `<span>${player.username} ${key === socket.id ? '(You)' : ''}${spectatorText}</span> <span class="${statusClass}">${statusText}</span>`;
        list.appendChild(listItem);
    }

    const oldContainer = document.querySelector(".leaderboard-container");
    if (oldContainer){
        oldContainer.remove();
    }
    const container = document.createElement('div');
    container.className = "leaderboard-container";

    container.innerHTML = "<h1> All Time Leaderboard </h1>";
    container.style.fontSize = '0.5vw';
    const playerList = document.createElement('ol');

    playerList.id = 'leaderboardPlayers';
    records.forEach((player, index) => {
        const medal = ['🥇 1ST', '🥈 2ND', '🥉 3RD'][index] || `${index + 1}TH`
        playerList.innerHTML += `<li class="homeLeaderboard">${medal} ${player.username} Lvl: ${player.level} - Time: ${player.time}</li>`;
    
    });
    
    const settings = document.createElement('h1')
    settings.textContent = 'Lobby Settings'

    const firstRow = document.createElement('div')
    const secondRow = document.createElement('div')
    const thirdRow = document.createElement('div')

    firstRow.style.display = 'flex'
    firstRow.style.flexDirection = 'row'
    secondRow.style.display = 'flex'
    secondRow.style.flexDirection = 'row'
    thirdRow.style.display = 'flex'
    thirdRow.style.flexDirection = 'row'
   
    const five = document.createElement('button')
    const ten = document.createElement('button')
    const fifteen = document.createElement('button')
    const twenty = document.createElement('button')
    const twentyfive = document.createElement('button')
    const endless = document.createElement('button')
    const fade = document.createElement('button')
    const click = document.createElement('button')

    five.textContent = "5";
    ten.textContent = '10';
    fifteen.textContent = '15'
    twenty.textContent = '20'
    twentyfive.textContent = '25'
    endless.textContent = 'Endless'

    
    five.id = "five";
    ten.id = 'ten';
    fifteen.id = 'fifteen'
    twenty.id = 'twenty'
    twentyfive.id = 'twentyfive'
    endless.id = 'endless'
    
    if (ourFade === true){
        fade.textContent = 'Fade'
    }
    else{
        fade.textContent = 'No Fade'
    }
    
    fade.id = 'fade'
    if (ourClick === true){
        click.textContent = 'Early Click'
    }
    else{
        click.textContent = 'Late Click'
    }
    click.id = 'click'

    five.className = 'mode'
    ten.className = 'mode'
    fifteen.className = 'mode'
    twenty.className = 'mode'
    twentyfive.className = 'mode'
    endless.className = 'mode'

    


    secondRow.style.marginBottom = '2%'

     
    fade.addEventListener('click', () => {
        ourFade = !ourFade;
        if (ourMode === 'endless'){
            ourFade = true;
            return;
        }
        socket.emit('updateSettings', ourMode, ourFade, ourClick);
    });
    click.addEventListener('click', () => {
            ourClick = !ourClick;
            if (ourMode !== 'endless'){
                ourClick = true;
                return;
            }
            socket.emit('updateSettings', ourMode, ourFade, ourClick);
        });

    firstRow.append(five, ten, fifteen)
    secondRow.append(twenty, twentyfive, endless)
    thirdRow.append(fade, click);

    
    const title = document.createElement('h1');
    title.textContent = 'Lobby Stats';
    
    const lobbyList = document.createElement('div')
    lobbyList.className = 'playerslist';
    
    for (const key in frontEndPlayers) {
        const player = frontEndPlayers[key];
        const listItem = document.createElement('li');
        listItem.dataset.id = key;
        if (key === socket.id) listItem.classList.add('you');
        listItem.style.fontSize = '0.8vw'
        const wins = player.gamesWon;
        listItem.innerHTML = `<span>${player.username} ${key === socket.id ? '(You)' : ''}</span> <span>${wins} wins</span>`;

        lobbyList.appendChild(listItem);
    }
    const record = document.createElement('h2');
    if (fastestTime.toFixed(0)!== '10000'){
    record.textContent = `Best Score: ${highestLevelID} Lvl: ${highestLevel} - Time: ${fastestTime.toFixed(2)} `;
    }

    container.append(playerList, settings, firstRow, secondRow, thirdRow, title, lobbyList, record);
    const loginContainer = document.querySelector('.login-container')
    screen.insertBefore(container, loginContainer);
    const oldChat = document.querySelector(".chatContainer");

    if (oldChat){
        
        oldChat.remove()

    }
    
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chatContainer';
    console.log(container.clientHeight)
    chatContainer.style.height = loginContainer.clientHeight+ 'px'
    container.style.height = loginContainer.clientHeight -63 + 'px';

    const chatTitle = document.createElement('h1')
    chatTitle.textContent = 'Chat';

    messageBox = document.createElement('div')
    messageBox.id = 'messages';

    inputArea = document.createElement('div')
    input = document.createElement('input')
    input.type = 'text'
    input.placeholder= 'type your message'
    inputArea.append(input);
     
   input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value !== ''){
            const newMessageText = yourUsername + ": " + input.value.trim();
            

            const newMessageDiv = document.createElement('div');
            newMessageDiv.style.borderBottom = '1px'
            newMessageDiv.textContent = newMessageText;
            messageBox.appendChild(newMessageDiv)
            messageBox.scrollTop = messageBox.scrollHeight
            
            socket.emit('updateMessages', newMessageText);
            input.value = '';
        }
    });
    chatContainer.append(chatTitle, messageBox, inputArea)
 
    screen.append(chatContainer)

    // Placed at end because they must be appended to screen

    const currentMode = document.querySelector('#'+mode)

    currentMode.style.backgroundColor = '#aaaaaa';
    const select = document.querySelectorAll('.mode');
    
    console.log(select)
    select.forEach((index) => {
        index.addEventListener('click', () => {
            let nowMode;
            switch (index.textContent){
                case 'Endless':
                    nowMode = 'endless'
                    break;
                case '5':
                    nowMode = 'five'
                    break;
                case '10':
                    nowMode = 'ten'
                   
                    break;
                case '15':
                    nowMode = 'fifteen'
                    break;
                case '20':
                    nowMode = 'twenty'
                    break;
                case '25':
                    nowMode = 'twentyfive'
                    break;
            }
            console.log(nowMode)
            if (nowMode === 'endless'){
                ourFade= true;
            }
            else{
                ourClick = true;
            }
            if (nowMode !== ourMode){
            socket.emit('updateSettings', nowMode, ourFade, ourClick)
            }
        });
    });

});
socket.on('updateMessages', (message) => {
    console.log(message)
    messageBox = document.querySelector('#messages');
    if (messageBox){
        const newMessageText = message
        const newMessageDiv = document.createElement('div');
        newMessageDiv.textContent = newMessageText;
        messageBox.appendChild(newMessageDiv)
        messageBox.scrollTop = messageBox.scrollHeight
    }
});

socket.on('updateTime', (time) => {
     timeElapsed = time;
    document.querySelectorAll('.timer').forEach(t => {
        t.textContent = `Time elapsed: ${(time).toFixed(2)}`;
    });
});

socket.on('nextRound', (player, players, newGame) => {

    
    if (frontEndPlayers[socket.id]){
        
    position = 0;

    // if you are calling nextround clear the roundlistener
    if (player === socket.id){
       clearTimeout(roundListener);
       clearTimeout()
    }
    Object.assign(frontEndPlayers, players);
     if (frontEndPlayers[player].lives <= 0) {
      
        const container = document.querySelector(`.grid[data-id="${player}"]`);
        container.innerHTML = 'NO MANA!';
        Object.assign(container.style, { fontSize: '3vw', color: '#e94560', display: 'flex', alignItems: 'center', justifyContent: 'center' });
        generateText(player);
        return;
    }
    if(newGame){
    renderGameScreen(player, newGame);
    }
    else{
        if (player === socket.id){

            generateText(player);
            createGrid(frontEndPlayers[player].gridRow, player);
            generateCorrect(socket.id);

            attach();
        }
        else{
            generateText(player);
            createGrid(frontEndPlayers[player].gridRow,player);
        }
    }
}
});



socket.on('gameOver', (backEndPlayers, mode) => {

 
    clearTimeout(roundListener)
    screen.innerHTML = '';
    screen.className = '';
    const container = document.createElement('div');
    container.className = 'leaderboard-container';
    container.innerHTML = '<h1>Game Over</h1><h2>Final Scores</h2>';
   
   
        playersArray = Object.values(backEndPlayers).sort((a, b) => b.level - a.level || a.timeFinished - b.timeFinished)
    
    const playerList = document.createElement('ol');
    playersArray.forEach((player, index) => {
        const medal = ['🥇 1ST', '🥈 2ND', '🥉 3RD'][index] || `${index + 1}TH`;
        playerList.innerHTML += `<li>${medal} ${player.username} Lvl: ${player.level} - Time: ${player.timeFinished.toFixed(2)}</li>`;


    });
    const homeButton = document.createElement('button');
    homeButton.textContent = 'Return to Lobby';
    homeButton.onclick = () => {
        socket.emit('joinLobby', ROOM_ID, sessionStorage.getItem('username') || 'Guest');
        multiLobby(GAME_MODE, false);
    };
    container.append(playerList, homeButton);
    screen.appendChild(container);
});



socket.on('finished', (player, id) => {
    position++
    if(frontEndPlayers[id]){
        frontEndPlayers[id].level = player.level;
        frontEndPlayers[id].finished = player.finished;
        frontEndPlayers[id].timeFinished = player.timeFinished.toFixed(2);
        
    } 
    
    const temp = document.querySelector(`.text-container[data-id="${id}"]`)

    temp.innerHTML = '';
    const container = document.querySelector(`.grid[data-id="${id}"]`);
    if(container && temp){
 const p0 = document.createElement('p');
    const p1 = document.createElement('p');
    const p2 = document.createElement('p');
    const p3 = document.createElement('p');
    
    p3.textContent = 'Time Finished: ' +  frontEndPlayers[id].timeFinished;
    if (socket.id === id) {
        
        p0.textContent = frontEndPlayers[id].username + " (YOU)";
    } else {
        p0.textContent = frontEndPlayers[id].username;
    }
    p1.textContent = 'Lives: ' + frontEndPlayers[id].lives;
    p2.textContent = 'Level: ' + frontEndPlayers[id].level;
    temp.append(p0, p1, p2, p3);
        container.innerHTML = `DOPADOWN!<br>Position: ${position}`;
        Object.assign(container.style, { fontSize: '16px', color: '#77dd77', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' });
        
    }
});

/*
socket.on('cellClicked', (num, player) => {
    //if(player !== socket.id) return;

    const cell = document.querySelector(`.newCell[style*="grid-area: ${num}"][data-id="${player}"]`);
    const pData = frontEndPlayers[player];
    console.log(pData.correctData[pData.level-1])
    if (!cell || !pData || pData.cellsClicked.includes(num)) return;

    pData.cellsClicked.push(num);
    const correctIndex = pData.correctData[pData.level-1].indexOf(num);
    
    if (correctIndex > -1) {
        
        cell.style.backgroundColor = '#0f0';
        pData.correctData[pData.level-1].splice(correctIndex, 1);
        pData.score += 10;
        if (pData.correctData[pData.level-1].length === 0 && player === socket.id) {
            pData.level++;
            
            socket.emit('wonRound', pData, player);
            return;
        }
    } else {
        cell.style.backgroundColor = '#f00';
        pData.chances--;
        if (pData.chances <= 0) pData.lives--;
    }
    if (player === socket.id) socket.emit('updateState', pData, player);
});
*/
socket.on('updateState', (pData, playerId) => {
    socket.emit('updateState', pData, playerId)
});
socket.on('wonRound', (pData, playerId) => {
    socket.emit('wonRound', pData, playerId)
});

socket.on('cellUpdate', ({ playerId, num, isCorrect }) => {
    const cell = document.querySelector(`.newCell[style*="grid-area: ${num}"][data-id="${playerId}"]`);
    frontEndPlayers[playerId].cellsClicked.push(num);
    if (cell) {
        // Set the background color based on the result from the server
        if (playerId === socket.id){
        isCorrect ? correct.currentTime = 0 : incorrect.currentTime = 0
        isCorrect ?  correct.play() : incorrect.play()
        }
        cell.style.backgroundColor = isCorrect ? '#77dd77' : '#e94560';
    }
});

socket.on('error', (message) => {
    alert(`Server error: ${message}`);
    window.location.href = '/multiplayer';
});