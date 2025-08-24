
function attach(){


const click = document.querySelectorAll('.newCell[data-id="' + socket.id + '"]');
   
click.forEach(cell => {
        cell.addEventListener('click', () => {
            /*
            if (correctData.includes(parseInt(cell.style.gridArea))) {
                cell.style.backgroundColor = 'green'; // Change color to green if correct
            }else{
                cell.style.backgroundColor = 'red'; // Change color to red if incorrect
            }*/

            socket.emit('cellClicked', parseInt(cell.style.gridArea), socket.id);
          
        });
    }
);
}

