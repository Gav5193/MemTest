const socket = io({ autoConnect: false });

const screen = document.querySelector('#screen');
let currentGameMode = '';

var gridRow = 0;
var level = 0;
var remainingTime = 0;
var position = 0;
var yourUsername = '';
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
    loginContainer.id = 'login-container';
    const title = document.createElement('h1');
    title.textContent = 'MemTest';
    loginContainer.append(title);
    screen.appendChild(loginContainer);
}

function getUsername() {
    const loginContainer = document.querySelector("#login-container");
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
    greetingOutput.textContent = 'Please enter a username to begin.';
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
    const loginContainer = document.querySelector("#login-container");
    const singleButton = document.createElement('button');
    const multiButton = document.createElement('button');
    singleButton.textContent = "Singleplayer Mode";
    multiButton.textContent = "Multiplayer Mode";
    
    multiButton.addEventListener('click', () => {
        if (sessionStorage.getItem('username')) {
            window.location.href = '/multiplayer';
        } else {
            alert('Please set a username first.');
        }
    });
    loginContainer.append(singleButton, multiButton);
}

function multiLobby(mode, isInProgress) {
    screen.innerHTML = '';
    screen.style.flexDirection = 'column';
    screen.style.alignItems = 'center';
    screen.style.justifyContent = 'center';

    const lobbyContainer = document.createElement('div');
    lobbyContainer.id = 'login-container';

    const title = document.createElement('h1');
    title.textContent = `Lobby - ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`;
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
    listContainer.id = 'playersList-container';
    const listTitle = document.createElement('h2');
    listTitle.textContent = 'Players in Lobby';
    const list = document.createElement('ul');
    list.id = 'playersList';

    let readyButton = document.createElement('button');
    readyButton.id = 'readyButton';
    
    let statusMessage = document.createElement('p');
    statusMessage.id = 'statusMessage';

    if (isInProgress) {
        statusMessage.textContent = 'Game is in progress. Please wait for the next game.';
        readyButton.style.display = 'none';
    }

    listContainer.append(listTitle, list);
    lobbyContainer.append(title, lobbyLink, usernameGroup, setUsernameButton, statusMessage, listContainer, readyButton);
    screen.appendChild(lobbyContainer);

    readyButton.textContent = 'Ready Up';
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
    const temp = document.createElement('div');
    temp.className = 'text-container';
    temp.dataset.id = id;
    const p0 = document.createElement('p');
    const p1 = document.createElement('p');
    const p2 = document.createElement('p');
    const p3 = document.createElement('p');
    p3.className = 'timer';
    if (socket.id === id) {
        gridContainer.classList.add('is-you');
        p0.textContent = frontEndPlayers[id].username + " (YOU)";
    } else {
        p0.textContent = frontEndPlayers[id].username;
    }
    p1.textContent = 'Lives: ' + frontEndPlayers[id].lives;
    p2.textContent = 'Score: ' + frontEndPlayers[id].score;
    temp.append(p0, p1, p2, p3);
    gridContainer.appendChild(temp);
    parentElement.appendChild(gridContainer);
}

function createGrid(x, id) {
    const gridContainer = document.querySelector(`.grid-container[data-id="${id}"]`);
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.dataset.id = id;
    const activePlayerCount = Object.values(frontEndPlayers).filter(p => !p.isSpectator).length;
    const size = Math.min(gridContainer.clientHeight * 0.9, (screen.clientWidth / (activePlayerCount <= 3 ? activePlayerCount : Math.ceil(activePlayerCount / 2)) * 0.6));
    grid.style.width = size + 'px';
    gridContainer.appendChild(grid);
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
    frontEndPlayers[id].correctData.forEach(index => {
        const cell = document.querySelector(`.newCell[style*="grid-area: ${index}"][data-id="${id}"]`);
        if (cell) cell.style.backgroundColor = '#ff0';
    });
    setTimeout(() => {
        frontEndPlayers[id].correctData.forEach(index => {
            const cell = document.querySelector(`.newCell[style*="grid-area: ${index}"][data-id="${id}"]`);
            if (cell && !['#0f0', '#f00'].includes(cell.style.backgroundColor)) {
                cell.style.transition = 'background-color 0.5s ease';
                cell.style.backgroundColor = '#444';
            }
        });
    }, 3000);
}

function renderGameScreen(players, data, gridRow, isNewGame) {
    screen.innerHTML = '';
      

    const activePlayers = Object.fromEntries(Object.entries(players).filter(([_, p]) => !p.isSpectator));
    const playerIds = Object.keys(activePlayers);
    const playerCount = playerIds.length;
    console.log(playerCount + 5);
    
    for (const id in players) {
        if(frontEndPlayers[id]){
            if (isNewGame) {
                frontEndPlayers[id].score = 0;
                frontEndPlayers[id].lives = 3;
            }
            if (frontEndPlayers[id].lives > 0) frontEndPlayers[id].chances = 3;
            frontEndPlayers[id].cellsClicked = [];
            frontEndPlayers[id].correctData = structuredClone(data);
        }
    }
    
        if (playerCount > 3) {
            screen.style.flexDirection = 'column'; 
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
            renderPlayerGrid(id, parentRow, gridRow);
        });
    } else {
        screen.className = 'game-screen-single-row';
screen.style.flexDirection = 'row'; 
        playerIds.forEach((id) => {
            renderPlayerGrid(id, screen, gridRow);
        });
    }
    generateCorrect(socket.id);
    attach();
}

function renderPlayerGrid(id, parentElement, gridRow) {
    createContainer(id, parentElement);
    createGrid(gridRow, id);
    if (frontEndPlayers[id].lives <= 0) {
        const container = document.querySelector(`.grid[data-id="${id}"]`);
        container.innerHTML = 'ELIMINATED!';
        Object.assign(container.style, { fontSize: '32px', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    }
}

// --- Socket Listeners ---
socket.on('disconnected', (backEndPlayers, id) => {
    delete frontEndPlayers[id];
    const container = document.querySelector(`.grid-container[data-id="${id}"]`);
    if (container) {
        container.innerHTML = '<h2>Player Disconnected</h2>';
    } else {
        const list = document.querySelector('#playersList');
        const itemToRemove = list?.querySelector(`li[data-id="${id}"]`);
        if (itemToRemove) list.removeChild(itemToRemove);
    }
});

socket.on('updateLobby', (backEndPlayers) => {
    Object.assign(frontEndPlayers, backEndPlayers);
    const list = document.querySelector('#playersList');
    if (!list) return;

    list.innerHTML = '';
    for (const key in frontEndPlayers) {
        const player = frontEndPlayers[key];
        const listItem = document.createElement('li');
        listItem.dataset.id = key;
        if (key === socket.id) listItem.classList.add('you');

        const statusClass = player.ready ? 'status-ready' : 'status-not-ready';
        const statusText = player.ready ? 'Ready' : 'Not Ready';
        const spectatorText = player.isSpectator ? ' (Spectating)' : '';
        
        listItem.innerHTML = `<span>${player.username} ${key === socket.id ? '(You)' : ''}${spectatorText}</span> <span class="${statusClass}">${statusText}</span>`;
        list.appendChild(listItem);
    }

    
});

socket.on('updateTime', (time) => {
    remainingTime = time;
    document.querySelectorAll('.timer').forEach(t => {
        t.textContent = `Time Left: ${(time / 10).toFixed(1)}`;
    });
});

socket.on('nextRound', (player, players, correctData, level, rows, newGame) => {
    position = 0;
    Object.assign(frontEndPlayers, players);
    renderGameScreen(players, correctData, rows, newGame);
});

socket.on('score', (playerData, id) => {
    if(!frontEndPlayers[id]) return;
    frontEndPlayers[id].lives = playerData.lives;
    frontEndPlayers[id].score = playerData.score;
    const temp = document.querySelector(`.text-container[data-id="${id}"]`);
    if (temp) {
        temp.children[1].textContent = 'Lives: ' + playerData.lives;
        temp.children[2].textContent = 'Score: ' + playerData.score;
    }
});

socket.on('gameOver', (backEndPlayers) => {
    screen.innerHTML = '';
    screen.className = '';
    const container = document.createElement('div');
    container.className = 'leaderboard-container';
    container.innerHTML = '<h1>Game Over</h1><h2>Final Scores</h2>';
    const playersArray = Object.values(backEndPlayers).sort((a, b) => b.score - a.score);
    const playerList = document.createElement('ol');
    playersArray.forEach((player, index) => {
        const medal = ['🥇 1ST', '🥈 2ND', '🥉 3RD'][index] || `${index + 1}TH`;
        playerList.innerHTML += `<li>${medal} ${player.username} - ${player.score}</li>`;
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

socket.on('lostGame', (backEndPlayers, player) => {
    const container = document.querySelector(`.grid[data-id="${player}"]`);
    if(container) {
        container.innerHTML = 'OUT!';
        Object.assign(container.style, { fontSize: '32px', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    }
});

socket.on('finished', (player, id) => {
    position++;
    if(frontEndPlayers[id]) frontEndPlayers[id].score = player.score;
    const container = document.querySelector(`.grid[data-id="${id}"]`);
    if(container){
        container.innerHTML = `FINISHED!<br>Position: ${position}`;
        Object.assign(container.style, { fontSize: '32px', color: 'lime', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' });
    }
});

socket.on('cellClicked', (num, player) => {
    const cell = document.querySelector(`.newCell[style*="grid-area: ${num}"][data-id="${player}"]`);
    const pData = frontEndPlayers[player];
    if (!cell || !pData || pData.cellsClicked.includes(num)) return;

    pData.cellsClicked.push(num);
    const correctIndex = pData.correctData.indexOf(num);
    if (correctIndex > -1) {
        cell.style.backgroundColor = '#0f0';
        pData.correctData.splice(correctIndex, 1);
        pData.score += 10;
        if (pData.correctData.length === 0 && player === socket.id) {
            socket.emit('wonRound', pData, player);
            return;
        }
    } else {
        cell.style.backgroundColor = '#f00';
        pData.chances--;
        if (pData.chances <= 0) pData.lives--;
    }
    
    if (player === socket.id) socket.emit('updateScore', pData, player);
});

socket.on('error', (message) => {
    alert(`Server error: ${message}`);
    window.location.href = '/multiplayer';
});