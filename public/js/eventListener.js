/*
function attach() {
    // Need to access currentGameMode from index.js
    // Ensure index.js is loaded before this script and currentGameMode is a global variable.

    const click = document.querySelectorAll('.newCell[data-id="' + socket.id + '"]');

   
        click.forEach(cell => {
            cell.addEventListener('click', () => {
                console.log('cell was clicked' + socket.id)
                // Pass the current game mode to the backend
                socket.emit('cellClicked', parseInt(cell.style.gridArea), socket.id, currentGameMode);
            });
        });
  
}*/

function attach() {
    const screen = document.querySelector('#screen');

    // A single, smart event listener on the parent container
    screen.onclick = function(event) {
        const cell = event.target;
        
        // Check if the clicked element is a cell for the current player
        if (cell.classList.contains('newCell') && cell.dataset.id === socket.id) {
            console.log('cell was clicked: ' + socket.id);
            socket.emit('cellClicked', parseInt(cell.style.gridArea));
        }
    };
}

