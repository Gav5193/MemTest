
function attach() {
    // Need to access currentGameMode from index.js
    // Ensure index.js is loaded before this script and currentGameMode is a global variable.

    const click = document.querySelectorAll('.newCell[data-id="' + socket.id + '"]');

    setTimeout(() => {
        click.forEach(cell => {
            cell.addEventListener('click', () => {
                console.log('cell was clicked' + socket.id)
                // Pass the current game mode to the backend
                socket.emit('cellClicked', parseInt(cell.style.gridArea), socket.id, currentGameMode);
            });
        });
    }, );
}

