const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fluent_ffmpeg = require('fluent-ffmpeg');

global.utils = {};

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file, index) => {
            const curPath = path.join(folderPath, file);

            if (fs.lstatSync(curPath).isDirectory()) {
                // Recursive call to delete sub-folders and their contents
                deleteFolderRecursive(curPath);
            } else {
                // Delete file
                fs.unlinkSync(curPath);
            }
        });

        // Remove the main folder
        fs.rmdirSync(folderPath);
        console.log(`Folder deleted: ${folderPath}`);
    }
}

utils.boardsToVideo = async function (pngFrames, outputPath) {
    // Write each PNG frame to a temporary file
    let secondsToShowEachImage = 1;
    let images = [];

    try {
        fs.mkdirSync(path.join(rootpath, 'temp'));
    } catch {}

    try {
        fs.mkdirSync(path.join(rootpath, 'temp', outputPath));
    } catch {}

    let framePaths = [];

    for (let i = 0; i < pngFrames.length; i++) {
        const framePath = path.join(rootpath, 'temp', outputPath, `frame-${i}.png`);
        fs.writeFileSync(framePath, pngFrames[i]);
        framePaths.push(framePath);

        images.push({ path: framePath, loop: secondsToShowEachImage });
    }

    let finalVideoPath = path.join(rootpath, 'temp', `${outputPath}.mp4`);

    // Create the video using fluent-ffmpeg
    fluent_ffmpeg()
        .input(path.join(rootpath, 'temp', outputPath, 'frame-%d.png'))
        .inputOptions('-framerate 1')
        .videoCodec('libx264')
        .videoBitrate(256)
        .outputOptions('-pix_fmt yuv420p')
        .size('200x225')
        .on('end', function () {
            try {
                deleteFolderRecursive(path.join(rootpath, 'temp', outputPath));
            }catch{}
            
            // Trigger events for video ready
            otherEvents.onBoardVideoReady.forEach(event => {
                event(finalVideoPath);
            });
        })
        .on('error', function (err) {
            console.error('Error:', err);
        })
        .save(finalVideoPath);
}

function formatTime(timeseconds) {
    var timeWithoutDecimals = Math.ceil(timeseconds);
    var timeMinutes = Math.floor(timeWithoutDecimals / 60);
    const timeHours = Math.floor(timeMinutes / 60);
    timeMinutes = timeMinutes % 60;
    if (timeHours > 0) {
        return `${timeHours}:${(timeMinutes % 60).toString().padStart(2, '0')}:${(timeWithoutDecimals % 60).toString().padStart(2, '0')}`;
    }else{
        return timeMinutes + ":" + (timeWithoutDecimals % 60).toString().padStart(2, '0');
    }
}

utils.formatTime = formatTime;

global.images = {
    'chess': {},
    'checkers': {}
};

utils.generateRandomPassword = function() {
    return crypto.randomBytes(1024).toString('hex');
}

async function loadImages() {
    let turns = 'wb';
    let pieces = 'a b c k n p q r e f m w'.split(' ');
    for (let turn of turns) {
        for (let piece of pieces) {
            images['chess'][turn + piece] = await loadImage(path.join(rootpath, `assets/chesspieces/${turn}${piece.toUpperCase()}.png`).split('\\').join('/'));
        }
    }
    
    pieces = 'p k'.split(' ');
    for (let turn of turns) {
        for (let piece of pieces) {
            images['checkers'][turn + piece] = await loadImage(path.join(rootpath, `assets/checkerspieces/${turn}${piece.toUpperCase()}.png`).split('\\').join('/'));
        }
    }

    images['chess']['barrier'] = await loadImage(path.join(rootpath, `assets/chesspieces/barrier.png`).split('\\').join('/'));
    images['logobanner'] = await loadImage(path.join(rootpath, `assets/logobanner.png`).split('\\').join('/'));
}
loadImages();

function indexToBoard(index, rankCount = 8, fileCount = 8, returnjson = false) {
    const row = rankCount - Math.floor(index / fileCount);
    const col = String.fromCharCode(97 + (index % fileCount));

    if (returnjson) {
        return {col, row};
    }else{
        return col + row;
    }
}

function indexToCheckersBoard(index, rankCount = 8, fileCount = 8, returnjson = false) {
    let oldindex = index;
    index = 1;
    for (let newindex = 0; newindex < oldindex; newindex++) {
        index += 2;
    }
    let row = rankCount - Math.floor(index / fileCount);
    let col = String.fromCharCode(97 + (index % fileCount));

    if ((row % 2) != 0) {
        col = String.fromCharCode((97 + (index % fileCount)) - 1);
    }

    if (returnjson) {
        return {col, row};
    }else{
        return col + row;
    }
}

function chessSquareToCheckersIndex(chessNotation, rankCount = 8, fileCount = 8) {
    const col = chessNotation.charAt(0).toLowerCase();
    const row = parseInt(chessNotation.charAt(1), 10);

    let index = (((rankCount - row) * fileCount));

    if ((rankCount - row) % 2 !== 0) {
        index += col.charCodeAt(0) - 97 + 1;
    } else {
        index += col.charCodeAt(0) - 97;
    }

    index /= 2;
    index += 1;

    return index;
}

utils.chessSquareToCheckersIndex = chessSquareToCheckersIndex;


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

utils.fenToJson = fenToJson;

function jsonToFen(jsonBoard, rankCount = 8, fileCount = 8) {
    let fen = '';
    let emptySquares = 0;

    for (let row = rankCount; row >= 1; row--) {
        for (let col = 1; col <= fileCount; col++) {
            const square = indexToBoard((rankCount - row) * fileCount + (col - 1), rankCount, fileCount);
            const piece = jsonBoard[square];

            if (!piece) {
                // Empty square
                emptySquares++;
            } else {
                // Piece present
                if (emptySquares > 0) {
                    fen += emptySquares;
                    emptySquares = 0;
                }

                const type = piece.type;
                const color = piece.color === 'w' ? type.toUpperCase() : type.toLowerCase();
                if (piece.color === '') {
                    fen += type;
                }else{
                    fen += color;
                }
            }
        }

        if (emptySquares > 0) {
            fen += emptySquares;
            emptySquares = 0;
        }

        if (row > 1) {
            fen += '/';
        }
    }

    //fen = fen.split("/").reverse().join("/");

    return fen;
}

utils.jsonToFen = jsonToFen;


function checkersFenToJson(fen, rankCount = 8, fileCount = 8) {
    let jsonBoard = {};
    let fenparts = fen.split(':');
    let turn = fenparts[0].toLowerCase();

    const whitePieces = fenparts[1].slice(1).split(',').map(num => num);
    const blackPieces = fenparts[2].slice(1).split(',').map(num => num);

    for (const whitePiece of whitePieces) {
        if (whitePiece.charAt(0) == 'K') {
            jsonBoard[indexToCheckersBoard(parseInt(whitePiece.replace('K', '')) - 1, rankCount, fileCount)] = {color: 'w', type: 'k'};
        }else{
            jsonBoard[indexToCheckersBoard(parseInt(whitePiece) - 1, rankCount, fileCount)] = {color: 'w', type: 'p'};
        }
    }

    for (const blackPiece of blackPieces) {
        if (blackPiece.charAt(0) == 'K') {
            jsonBoard[indexToCheckersBoard(parseInt(blackPiece.replace('K', '')) - 1, rankCount, fileCount)] = {color: 'b', type: 'k'};
        }else{
            jsonBoard[indexToCheckersBoard(parseInt(blackPiece) - 1, rankCount, fileCount)] = {color: 'b', type: 'p'};
        }
    }

    return jsonBoard;
}

utils.checkersFenToJson = checkersFenToJson;

utils.checkersFenToChessFen = function(checkersfen, rankCount = 8, fileCount = 8) {
    return jsonToFen(checkersFenToJson(checkersfen, rankCount, fileCount), rankCount, fileCount);
}

utils.formatCheckersLegalMoves = function(checkersLegalMoves, rankCount = 8, fileCount = 8) {
    let legalMoves = [];
    checkersLegalMoves.forEach((legalMove) => {
        legalMoves.push(indexToCheckersBoard(legalMove.from - 1, rankCount, fileCount) + indexToCheckersBoard(legalMove.to - 1, rankCount, fileCount));
    });
    return legalMoves;
}


utils.getGameInfo = (roomId) => {
    let gameInfo = {
        gametype: rooms[roomId].gametype,
        variant: rooms[roomId].variant,
        turn: rooms[roomId].turn(),
        isStarted: rooms[roomId].isStarted,
        whiteName: rooms[roomId].white.name,
        whiteElo: rooms[roomId].white.elo,
        whiteTime: rooms[roomId].white.time,
        whiteTimeFormatted: utils.formatTime(rooms[roomId].white.time),
        blackName: rooms[roomId].black.name,
        blackElo: rooms[roomId].black.elo,
        blackTime: rooms[roomId].black.time,
        blackTimeFormatted: utils.formatTime(rooms[roomId].black.time),
    };
    if (gameInfo.gametype === 'chess') {
        gameInfo.fen =  rooms[roomId].game.fen();
        gameInfo.boardDimensions = utils.getBoardDimensions(rooms[roomId].game.fen());
        gameInfo.legalMoves = rooms[roomId].game.legalMoves().split(" ");
    } else if (gameInfo.gametype == 'checkers') {
        gameInfo.boardDimensions = {width: 8, height: 8};
        if (gameInfo.variant == 'draughts') {
            gameInfo.boardDimensions = {width: 10, height: 10};
        }
        gameInfo.fen = utils.checkersFenToChessFen(rooms[roomId].game.fen(), gameInfo.boardDimensions.height, gameInfo.boardDimensions.width);
        gameInfo.legalMoves = utils.formatCheckersLegalMoves(rooms[roomId].game.moves(), gameInfo.boardDimensions.height, gameInfo.boardDimensions.width);
    }
    return gameInfo;
}

utils.getBoardDimensions = function(fen) {
    const fenBoard = fen.split(" ")[0];
    const ranks = fenBoard.split("/").length;
    const lastRank = fenBoard.split("/")[0].replace(/[^0-9a-z*]/gi, "");
    let files = lastRank.length;

    for (const match of lastRank.matchAll(/\d+/g)) {
      files += parseInt(match[0]) - match[0].length;
    }

    return {
      width: files,
      height: ranks,
    };
  }

function BoardToPng(board, isflipped = false, white = {}, black = {}, gametype = 'chess', variant = 'chess') {
    let canvas = createCanvas(400, 450);

    let boardfen = board.fen();

    let boardranks = boardfen.split('/').length;
    let boardfiles = board.toString().split('\n')[0].split(' ').length;

    if (gametype == 'checkers') {
        boardfiles = 8;
        boardranks = 8;
        if (variant == 'draughts') {
            boardfiles = 10;
            boardranks = 10;
        }
    } else {
        
    }

    let squaresizeX = 400 / boardfiles;
    let squaresizeY = 400 / boardranks;


    let boardsquaresassetimage = fenToJson(boardfen, boardranks, boardfiles);
    if (gametype == 'checkers') {
        boardsquaresassetimage = checkersFenToJson(boardfen, boardranks, boardfiles);
    } else {
        boardsquaresassetimage = fenToJson(boardfen, boardranks, boardfiles);
    }

    
    let letters = 'abcdefghijklmnopqrstuvwxyz';

    let ctx = canvas.getContext('2d');

    let squareindex = 1;

    //let checkerssquareindexes = [1, -1, 2, -1, 3, -1, 4, -1, 5, -1, 6, -1, 7, -1, 8, -1, 9, -1, 10, -11, -1, 12, -1, 13, -1, 14, -1, 15, -1, 16, -1, 17, -1, 18, -1, 19, -1, 20, -1, 21, -1, 22, -1, 23, -1, 24, 25, -1, 26, -1, 27, -1, 28, -1, 29, -1, 31, -1, 32, -1];
    
    for (let i = 0; i < boardranks; i++) {
      for (let j = 0; j < boardfiles; j++) {
        const isWhite = (i + j) % 2 === 0;
        ctx.fillStyle = isWhite ? '#f0d9b5' : '#b58863';
        ctx.fillRect(j * squaresizeX, 25 + (i * squaresizeY), squaresizeX, squaresizeY);


        ctx.font = '15px Arial';
    
        ctx.textAlign = 'left';
    
        ctx.fillStyle = !isWhite ? '#f0d9b5' : '#b58863';

        if (!isWhite && gametype == 'checkers') {
            ctx.fillText((isflipped ? (((boardfiles * boardranks) / 2) + 1) - squareindex : squareindex), j * squaresizeX, 50 + (i * squaresizeY));
            squareindex += 1;
        }
        if (gametype == 'chess') {
            if (i == boardranks - 1 && j == 0) {
                ctx.fillText(indexToBoard(isflipped ? (boardranks * boardfiles) - squareindex : squareindex - 1, boardranks, boardfiles), j * squaresizeX, 50 + (i * squaresizeY));
            }else if (i == boardranks - 1) {
                ctx.fillText(indexToBoard(isflipped ? (boardranks * boardfiles) - squareindex : squareindex - 1, boardranks, boardfiles, true).col, j * squaresizeX, 50 + (i * squaresizeY));
            }else if (j == 0) {
                ctx.fillText(indexToBoard(isflipped ? (boardranks * boardfiles) - squareindex : squareindex - 1, boardranks, boardfiles, true).row, j * squaresizeX, 50 + (i * squaresizeY));
            }
            squareindex += 1;
        }

      }
    }

    //ctx.drawImage(images['logobanner'], 150, 200, 100, 50);

    for (let i = 1; i < boardranks + 1; i++) {
      for (let j = 0; j < boardfiles; j++) {
        const piece = isflipped ? boardsquaresassetimage[letters[boardfiles - 1 - j] + (boardranks + 1 - i)] : boardsquaresassetimage[letters[j] + i];
        if (piece) {
          const img = images[gametype][piece.color + piece.type];
          ctx.drawImage(img, (j * squaresizeX), 25 + (boardranks - 1 - (i - 1)) * squaresizeY, squaresizeX, squaresizeY);
        }
      }
    }

    ctx.font = '25px Arial';

    
    ctx.textAlign = 'right';

    ctx.fillStyle = '#f0d9b5';
    if (white.time) {
        ctx.fillText(formatTime(white.time), 400, (isflipped ? 20 : 450));
    }

    ctx.fillStyle = '#b58863';
    if (black.time) {
        ctx.fillText(formatTime(black.time), 400, (isflipped ? 450 : 20));
    }


    ctx.textAlign = 'left';

    ctx.fillStyle = '#f0d9b5';
    if (white.name) {
        ctx.fillText(white.name.substring(0, 18) + (white.elo && gametype == 'chess' ? ` (${white.elo})` : ""), 0, (isflipped ? 20 : 450));
    }

    ctx.fillStyle = '#b58863';
    if (black.name) {
        ctx.fillText(black.name.substring(0, 18) + (black.elo && gametype == 'chess' ? ` (${black.elo})` : ""), 0, (isflipped ? 450 : 20));
    }
    
    let buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('board.png', buffer)
    return buffer;
}

utils.BoardToPng = BoardToPng;