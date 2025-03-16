/*
Gameboard.js by Erik Reis
https://github.com/erik60reis/chessnetwork
*/

function createGameBoard(container, config) {
    function indexToBoard(index, rankCount = 8, fileCount = 8, returnjson = false) {
        const row = rankCount - Math.floor(index / fileCount);
        const col = String.fromCharCode(97 + (index % fileCount));
    
        if (returnjson) {
            return { col, row };
        } else {
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
                row--;
                col = 0;
            } else if (isNumeric(char)) {
                col += parseInt(char, 10);
            } else {
                const square = indexToBoard((rankCount - row) * fileCount + col, rankCount, fileCount);
                const type = char.toLowerCase();
                const color = char === type ? 'b' : 'w';
    
                jsonBoard[square] = (char === '*' ? { color: '', type: 'barrier' } : { color, type });
                col++;
            }
        }
    
        return jsonBoard;
    }

    // End of helper functions

    config = config || {};
    let width = config.width || 8;
    let height = config.height || 8;
    let removedSquares = config.removedSquares || [];
    let legalMoves = config.legalMoves || {};
    let onMoveCallback = config.onMove || function(orig, dest) {};
    let selectPieceSquareColor = config.selectPieceSquareColor || "#aaaa00";
    let lightSquareColor = config.lightSquareColor || "#f0d9b5";
    let darkSquareColor = config.darkSquareColor || "#b58863";
    let isFlipped = config.isFlipped || false;
    let pieceTheme = config.pieceTheme || "assets/pieces/%piece%.png";
    let fen = config.fen ? config.fen.split(" ")[0] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    let jsonBoard = fenToJson(fen, height, width);

    let selectedSquareCoords = null;

    // Create table with a fixed layout for even distribution
    const table = document.createElement('table');
    table.style.width = "100%";
    table.style.height = "100%";
    table.style.borderCollapse = "separate";
    table.style.borderSpacing = "0";
    table.style.borderRadius = "5px";
    table.style.overflow = "hidden";
    table.style.tableLayout = "fixed";

    for (let i = height - 1; i >= 0; i--) {
        const rowEl = document.createElement('tr');
        let fixedI = isFlipped ? height - 1 - i : i;
    
        for (let j = 0; j < width; j++) {
            let fixedJ = isFlipped ? width - 1 - j : j;
            const cell = document.createElement('td');
            const squareCoords = `${String.fromCharCode(97 + j)}${fixedI + 1}`;
            const squareClass = `gameboardsquare-${squareCoords}`;
            cell.className = squareClass;
            cell.style.backgroundColor = lightSquareColor;
            cell.style.width = (100 / width) + "%";
            // Remove aspect-ratio from the td and use an inner wrapper instead.
            
            // Create an inner wrapper that enforces a 1:1 aspect ratio
            const cellInner = document.createElement('div');
            cellInner.style.width = "100%";
            cellInner.style.aspectRatio = "1 / 1";
            cellInner.style.display = "flex";
            cellInner.style.alignItems = "center";
            cellInner.style.justifyContent = "center";
            
            // If a piece exists, add an image to the wrapper; otherwise, it remains empty.
            if (jsonBoard[squareCoords]) {
                const img = document.createElement('img');
                img.style.maxWidth = "90%";
                img.style.maxHeight = "90%";
                img.src = pieceTheme.replace("%piece%", jsonBoard[squareCoords].color.toLowerCase() + jsonBoard[squareCoords].type.toUpperCase());
                cellInner.appendChild(img);
            }
            
            cell.appendChild(cellInner);

            const sumOfIndexes = fixedI + fixedJ;
            if (sumOfIndexes % 2 === 0) {
                const blackSquareClass = `gameboardblacksquare-${sumOfIndexes + 1}`;
                cell.classList.add(blackSquareClass, "gameboardblacksquare");
                cell.style.backgroundColor = darkSquareColor;
            }

            if (removedSquares.includes(squareCoords)) {
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
    
                    document.querySelectorAll(`.legalMoveSquare`).forEach(legalCell => {
                        legalCell.classList.remove("legalMoveSquare");
                        legalCell.style.backgroundImage = '';
                    });
                    selectedSquareCoords = null;
                }
                if (legalMoves[squareCoords] && Object.keys(legalMoves[squareCoords]).length > 0) {
                    paintLegalMoves();
                }
            };

            function paintLegalMoves() {
                for (let legalMoveSquareCoords of Object.keys(legalMoves[squareCoords])) {
                    let legalMoveSquare = document.querySelector(`.gameboardsquare-${legalMoveSquareCoords}`);
                    legalMoveSquare.classList.add("legalMoveSquare");
                    legalMoveSquare.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16pt' height='16.000099pt'%3E%3Cpath stroke='%23000' stroke-miterlimit='40' stroke-width='1.25' d='M15.625 10.000062c0 3.106602-2.518398 5.625-5.6249996 5.625-3.1066017 0-5.625-2.518398-5.625-5.625 0-3.1066013 2.5183983-5.6249996 5.625-5.6249996 3.1066016 0 5.6249996 2.5183983 5.6249996 5.6249996z'/%3E%3C/svg%3E")`;
                    legalMoveSquare.style.backgroundSize = '50% 50%';
                    legalMoveSquare.style.backgroundRepeat = 'no-repeat';
                    legalMoveSquare.style.backgroundPosition = 'center';
                }
                selectedSquareCoords = squareCoords;
            }

            cell.draggable = true;
            cell.ondragstart = () => {
                cell.onclick();
            };
            cell.ondragover = (event) => {
                event.preventDefault();
            };
            cell.ondrop = (event) => {
                event.preventDefault();
                let selectedSquare = document.querySelector(`.gameboardsquare-${selectedSquareCoords}`);
                if (cell.classList.contains('legalMoveSquare')) {
                    let isMoveValid = onMoveCallback(selectedSquareCoords, squareCoords);
                    if (isMoveValid) {
                        cell.innerHTML = selectedSquare.innerHTML;
                        selectedSquare.innerHTML = "";
                    }
                }
            };

            rowEl.appendChild(cell);
        }
    
        table.appendChild(rowEl);
    }

    container.innerHTML = "";
    container.appendChild(table);

    // Fallback for browsers that don't support aspect-ratio.
    if (!CSS.supports('aspect-ratio', '1 / 1')) {
        function adjustBoardCells() {
            container.querySelectorAll('td > div').forEach(cellInner => {
                cellInner.style.height = cellInner.offsetWidth + 'px';
            });
        }
        adjustBoardCells();
        window.addEventListener('resize', adjustBoardCells);
    }

    return {};
}
