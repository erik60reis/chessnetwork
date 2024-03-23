/*
Gameboard.js by Erik Reis
https://github.com/erik60reis/chessnetwork
*/

function createGameBoard(container, config) {
    function indexToBoard(index, rankCount = 8, fileCount = 8, returnjson = false) {
        const row = rankCount - Math.floor(index / fileCount);
        const col = String.fromCharCode(97 + (index % fileCount));
    
        if (returnjson) {
            return {col, row};
        }else{
            return col + row;
        }
    }

    function isNumeric(char) {
        return /^\d+$/.test(char);
    }

    function fenToJson(fen, rankCount, fileCount) {
        const fenParts = fen.split(' ');
        const boardPart = fenParts[0];
    
        const jsonBoard = {};
    
        let row = rankCount;
        let col = 0;
    
        for (let i = 0; i < boardPart.length; i++) {
            const char = boardPart[i];
    
            if (char === '/') {
                // Move to the next row
                row--;
                col = 0;
            } else if (isNumeric(char)) {
                // Skip empty squares
                col += parseInt(char, 10);
            } else {
                // Handle pieces
                const square = indexToBoard((rankCount - row) * fileCount + col, rankCount, fileCount);
                const type = char.toLowerCase();
                const color = char === type ? 'b' : 'w';
    
                jsonBoard[square] = (char == '*' ? {color: '', type: 'barrier'} : { color, type });
    
                col++;
            }
        }
    
        return jsonBoard;
    }

    //end of helper functions

    if (!config) config = {};
    let width = (config.width ? config.width : 8);
    let height = (config.height ? config.height : 8);
    let removedSquares = (config.removedSquares ? config.removedSquares : []);
    let legalMoves = (config.legalMoves ? config.legalMoves : {});
    let onMoveCallback = (config.onMove ? config.onMove : function(orig, dest){});
    let legalMoveSquareColor = (config.legalMoveSquareColor ? config.legalMoveSquareColor : "#00aa00");
    let selectPieceSquareColor = (config.selectPieceSquareColor ? config.selectPieceSquareColor : "#aaaa00");
    let isFlipped = (config.isFlipped ? config.isFlipped : false);
    let pieceTheme = (config.pieceTheme ? config.pieceTheme : "assets/pieces/%piece%.png");
    let fen = (config.fen ? config.fen.split(" ")[0] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    let jsonBoard = fenToJson(fen, width, height);

    let selectedSquareCoords = null;

    const table = document.createElement('table');
    table.style.width = "100%";
    table.style.height = "100%";
  
    for (let i = height - 1; i >= 0; i--) {
        const row = document.createElement('tr');

        let fixedI = (isFlipped ? height - 1 - i : i);
    
        for (let j = 0; j < width; j++) {

            let fixedJ = (isFlipped ? width - 1 - j : j);

            const cell = document.createElement('td');
            const squareCoords = `${String.fromCharCode(97 + j)}${fixedI + 1}`;
            const squareClass = `gameboardsquare-${squareCoords}`;
            if (jsonBoard[squareCoords]) {
                cell.innerHTML = `<img style="width: 80%; height: 80%;" src="${pieceTheme.replace("%piece%", jsonBoard[squareCoords].color.toLowerCase() + jsonBoard[squareCoords].type.toUpperCase())}">`
            }
            cell.className = squareClass;
            cell.style.backgroundColor = "#f0d9b5";
            cell.style.width = (100 / width) + "%";
            cell.style.height = (100 / height) + "%";
            
            const sumOfIndexes = fixedI + fixedJ;

            if (sumOfIndexes % 2 === 0) {
            const blackSquareClass = `gameboardblacksquare-${sumOfIndexes + 1}`;
            cell.classList.add(blackSquareClass);
            cell.classList.add("gameboardblacksquare");
            cell.style.backgroundColor = "#b58863";
            }

            if (removedSquares && removedSquares.includes(squareCoords)) {
                cell.style.backgroundColor = "rgba(0, 0, 0, 0)";
            }

            cell.onclick = () => {
                let clickedSquare = document.querySelector(`.gameboardsquare-${squareCoords}`);
                if (selectedSquareCoords) {
                    let selectedSquare = document.querySelector(`.gameboardsquare-${selectedSquareCoords}`);

                    if (clickedSquare.classList.contains('legalMoveSquare')) {
                        let isMoveValid = onMoveCallback(selectedSquareCoords, squareCoords);
                        if (isMoveValid) {
                            clickedSquare.innerHTML = selectedSquare.innerHTML;
                            selectedSquare.innerHTML = "";
                        }
                    }

                    for (let legalMoveSquare of document.querySelectorAll(`.legalMoveSquare`)) {
                        legalMoveSquare.classList.remove("legalMoveSquare");
                        legalMoveSquare.style.backgroundColor = (legalMoveSquare.classList.contains("gameboardblacksquare") ? "#b58863" : "#f0d9b5")
                    }
                    selectedSquare.style.backgroundColor = (selectedSquare.classList.contains("gameboardblacksquare") ? "#b58863" : "#f0d9b5")
                    selectedSquareCoords = null;
                }
                if (legalMoves[squareCoords] && Object.keys(legalMoves[squareCoords]).length > 0) {
                    for (let legalMoveSquareCoords of Object.keys(legalMoves[squareCoords])) {
                        let legalMoveSquare = document.querySelector(`.gameboardsquare-${legalMoveSquareCoords}`)
                        legalMoveSquare.classList.add("legalMoveSquare");
                        legalMoveSquare.style.backgroundColor = legalMoveSquareColor;
                    }
                    selectedSquareCoords = squareCoords;
                    let legalMoveSquare = document.querySelector(`.gameboardsquare-${selectedSquareCoords}`)
                    legalMoveSquare.style.backgroundColor = selectPieceSquareColor;
                }
            }

            row.appendChild(cell);
        }
    
        table.appendChild(row);
    }

    container.innerHTML = ``;
  
    container.appendChild(table);

    return {

    }
}