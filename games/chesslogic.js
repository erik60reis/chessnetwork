/*

Chess Logic by Erik Reis
https://github.com/erik60reis/chessnetwork

*/

const BOARD_SIZE_X = 8;
const BOARD_SIZE_Y = 8;

function fenToArray(fen, files = 8, ranks = 8) {
  const fenRanks = fen.split('/');
  const board = Array.from({ length: ranks }, () => Array.from({ length: files }, () => ''));

  for (let rank = 0; rank < ranks; rank++) {
      let file = 0;
      for (let char of fenRanks[rank]) {
          if (/\d/.test(char)) {
              file += parseInt(char, 10);
          } else {
              board[rank][file] = char;
              file++;
          }
      }
  }
  return board;
}


function arrayToFen(board, files = 8, ranks = 8) {
  const fenRanks = [];
  
  for (let rank = 0; rank < ranks; rank++) {
    let rankStr = '';
    let emptyCount = 0;
    
    for (let file = 0; file < files; file++) {
      const piece = board[rank][file];
      
      if (piece === '') {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount;
          emptyCount = 0;
        }
        rankStr += piece;
      }
    }
    
    if (emptyCount > 0) {
      rankStr += emptyCount;
    }
    
    fenRanks.push(rankStr);
  }
  
  return fenRanks.join('/');
}

function XYToChessCoord(x, y, rankCount = 8) {
  const file = String.fromCharCode(97 + x);
  const rank = rankCount - y;
  return `${file}${rank}`;
}

function chessCoordToXY(coord, rankCount = 8) {
  const file = coord.charCodeAt(0) - 97;
  const rank = rankCount - parseInt(coord.substring(1));
  return { x: file, y: rank };
}

class Chess {
    board = null;
    turnColor = 'w';
    history = [];
    fenHistory = [];
    historyDetails = [];

    constructor(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w') {
        this.board = fenToArray(fen.split(" ")[0], BOARD_SIZE_X, BOARD_SIZE_Y);
        this.turnColor = fen.split(" ")[1];
    }

    findKing = (color) => {
        const kingPiece = color === 'w' ? 'K' : 'k';
        for (let y = 0; y < BOARD_SIZE_Y; y++) {
            for (let x = 0; x < BOARD_SIZE_X; x++) {
                if (this.board[y][x] === kingPiece) {
                    return { x, y };
                }
            }
        }
        return null;
    };

    isMovePossible = (x, y) => {
        const piece = this.board[y][x];
        return piece === '' || (isWhiteTurn && piece.toLowerCase() === piece) || (!isWhiteTurn && piece.toUpperCase() === piece);
    };

    isKingInCheck = (color = this.turnColor, tempBoard = this.board) => {
        const kingXY = this.findKing(color);
        if (!kingXY) return false;

        for (let y = 0; y < BOARD_SIZE_Y; y++) {
            for (let x = 0; x < BOARD_SIZE_X; x++) {
                const piece = tempBoard[y][x];
                if (piece !== '' && ((color === 'w' && piece.toUpperCase() === piece) || (color === 'b' && piece.toLowerCase() === piece))) {
                    continue;
                }

                if (this.isMoveLegal(x, y, kingXY.x, kingXY.y, true)) {
                    return true;
                }
            }
        }

        return false;
    };

    isMoveLegal = (fromX, fromY, toX, toY, ignoreKingInCheck = false) => {
        if (fromX >= BOARD_SIZE_X || fromX < 0 || fromY >= BOARD_SIZE_Y || fromY < 0) {
            return false;
        }

        if (fromX === toX && fromY === toY) {
            return false;
        }

        const piece = this.board[fromY][fromX];
    
        const tempBoard2 = this.board.map(row => [...row]);
        const tempBoard = this.board.map(row => [...row]);
        const isWhiteTurn = this.turnColor === 'w';
        const direction = isWhiteTurn ? -1 : 1;


        tempBoard2[toY][toX] = piece;
        tempBoard2[fromY][fromX] = '';

        if (!ignoreKingInCheck) {
            if (this.isKingInCheck(this.turnColor, tempBoard2)) {
                return false;
            }
        }
    
        switch (piece.toLowerCase()) {
            case 'p': // Peão
                // Movimento normal para frente
                if (fromX === toX && fromY + direction === toY && tempBoard[toY][toX] === '') {
                    return true;
                }

                // Primeiro movimento duplo
                if (fromX === toX && fromY + 2 * direction === toY && fromY === (isWhiteTurn ? BOARD_SIZE_Y - 2 : 1) && tempBoard[toY][toX] === '' && tempBoard[fromY + direction][toX] === '') {
                    return true;
                }

                // Captura diagonal
                if (Math.abs(toX - fromX) === 1 && fromY + direction === toY && tempBoard[toY][toX] !== '' && (isWhiteTurn ? tempBoard[toY][toX].toUpperCase() !== piece.toUpperCase() : tempBoard[toY][toX].toLowerCase() !== piece.toLowerCase())) {
                    return true;
                }
                break;
            case 'n': // Cavalo
                if ((Math.abs(toX - fromX) === 2 && Math.abs(toY - fromY) === 1) || (Math.abs(toY - fromY) === 2 && Math.abs(toX - fromX) === 1)) {
                    if (this.pieceTeam(this.board[toY][toX]) !== this.pieceTeam(this.board[fromY][fromX])) {
                        return true;
                    }
                }
                break;
            case 'b': // Bispo
                if (Math.abs(toX - fromX) === Math.abs(toY - fromY)) {
                    // Verificar se não há peças no caminho
                    const deltaX = toX > fromX ? 1 : -1;
                    const deltaY = toY > fromY ? 1 : -1;
                    let x = fromX;
                    let y = fromY;
                    while (x !== toX && y !== toY) {
                        x += deltaX;
                        y += deltaY;
                        if (tempBoard[y][x] !== '') {
                            if (x === toX && y === toY && this.pieceTeam(tempBoard[toY][toX]) === (this.turnColor == "w" ? "b" : "w")) {
                        
                            }else{
                                return false;
                            }
                        }
                    }
                    return true;
                }
                break;
            case 'r': // Torre
                if (fromX === toX || fromY === toY) {
                    // Verificar se não há peças no caminho
                    if (fromX === toX) { // Movimento vertical
                        const deltaY = toY > fromY ? 1 : -1;
                        let y = fromY;
                        while (y !== toY) {
                            y += deltaY;
                            if (tempBoard[y][fromX] !== '') {
                                if (y === toY && this.pieceTeam(tempBoard[toY][toX]) === (this.turnColor == "w" ? "b" : "w")) {
                        
                                }else{
                                    return false;
                                }
                            }
                        }
                    } else { // Movimento horizontal
                        const deltaX = toX > fromX ? 1 : -1;
                        let x = fromX;
                        while (x !== toX) {
                            x += deltaX;
                            if (tempBoard[fromY][x] !== '') {
                                if (x === toX && this.pieceTeam(tempBoard[toY][toX]) === (this.turnColor == "w" ? "b" : "w")) {
                        
                                }else{
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                }
                break;
            case 'q': // Rainha
                // Movimento diagonal (como o bispo)
                if (Math.abs(toX - fromX) === Math.abs(toY - fromY)) {
                    const deltaX = toX > fromX ? 1 : -1;
                    const deltaY = toY > fromY ? 1 : -1;
                    let x = fromX;
                    let y = fromY;
                    while (x !== toX && y !== toY) {
                        x += deltaX;
                        y += deltaY;
                        if (tempBoard[y][x] !== '') {
                            if (x === toX && y === toY && this.pieceTeam(tempBoard[toY][toX]) === (this.turnColor == "w" ? "b" : "w")) {
                        
                            }else{
                                return false;
                            }
                        }
                    }
                    return true;
                }
                // Movimento reto (como a torre)
                if (fromX === toX || fromY === toY) {
                    if (fromX === toX) {
                        const deltaY = toY > fromY ? 1 : -1;
                        let y = fromY;
                        while (y !== toY) {
                            y += deltaY;
                            if (tempBoard[y][fromX] !== '') {
                                if (y === toY && this.pieceTeam(tempBoard[toY][toX]) === (this.turnColor == "w" ? "b" : "w")) {
                        
                                }else{
                                    return false;
                                }
                            }
                        }
                    } else {
                        const deltaX = toX > fromX ? 1 : -1;
                        let x = fromX;
                        while (x !== toX) {
                            x += deltaX;
                            if (tempBoard[fromY][x] !== '') {
                                if (x === toX && this.pieceTeam(tempBoard[toY][toX]) === (this.turnColor == "w" ? "b" : "w")) {
                        
                                }else{
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                }
                break;
            case 'k': // Rei
                if (Math.abs(toX - fromX) <= 1 && Math.abs(toY - fromY) <= 1) {
                    if (this.pieceTeam(this.board[toY][toX]) !== this.pieceTeam(this.board[fromY][fromX])) {
                        return true;
                    }
                }
                break;
        }
    
        return false; // Se nenhum dos movimentos anteriores for válido para a peça especificada
    };
    
    pieceTeam = (piece) => {
        return (piece.toUpperCase() === piece ? (piece === "" ? "" : "w") : "b");
    }

    move = (from, to, promotion = 'q') => {
        let fromXY = chessCoordToXY(from, BOARD_SIZE_Y);
        let toXY = chessCoordToXY(to, BOARD_SIZE_Y);
        const frompiece = this.board[fromXY.y][fromXY.x];
        const isWhiteTurn = this.turnColor === 'w';

        const tempBoard = this.board.map(row => [...row]);

        if (this.pieceTeam(tempBoard[fromXY.y][fromXY.x]) === this.pieceTeam(tempBoard[toXY.y][toXY.x])) {
            return false;
        }

        tempBoard[toXY.y][toXY.x] = frompiece;
        tempBoard[fromXY.y][fromXY.x] = '';


        const kingColor = isWhiteTurn ? 'w' : 'b';

        if (this.isKingInCheck(kingColor, tempBoard)) {
            return false;
        }

        if (!this.isMoveLegal(fromXY.x, fromXY.y, toXY.x, toXY.y)) {
            return false;
        }

        let movedetails = {
            move: '',
            capturedpiece: this.board[toXY.y][toXY.x]
        };

        this.board[toXY.y][toXY.x] = frompiece;
        this.board[fromXY.y][fromXY.x] = '';
        this.turnColor = isWhiteTurn ? 'b' : 'w';

        if (fromXY.y === (isWhiteTurn ? 1 : BOARD_SIZE_Y - 2) && frompiece === "p") {
            this.board[toXY.y][toXY.x] = promotion;
            movedetails.move = from + to + promotion;
            this.history.push(from + to + promotion);
        }else{
            movedetails.move = from + to;
            this.history.push(from + to);
        }

        this.fenHistory.push(this.fen());
        this.historyDetails.push(movedetails);

        return true;
    }

    fen = function() {
        return arrayToFen(this.board, BOARD_SIZE_X, BOARD_SIZE_Y);
    }

    isCheckmate = function() {
        return this.isKingInCheck() && this.legalMovesArray().length == 0;
    }

    isStalemate = function() {
        return !this.isKingInCheck() && this.legalMovesArray().length == 0;
    }

    isDrawByThreefoldRepetition = function() {
        let fenCount = {};
        for (let i = 0; i < this.fenHistory.length; i++) {
            let fen = this.fenHistory[i];
            if (fenCount[fen]) {
                fenCount[fen]++;
            } else {
                fenCount[fen] = 1;
            }
            if (fenCount[fen] >= 3) {
                return true;
            }
        }
        return false;
    }
    
    isDrawBy50MoveRule = function() {
        let halfMoves = 0;
        for (let i = this.history.length - 1; i >= 0; i--) {
            let move = this.historyDetails[i];
            if (move.capturedpiece !== '') { // Capture or pawn move
                break;
            }
            halfMoves++;
            if (halfMoves >= 100) { // 50 moves for each player
                return true;
            }
        }
        return false;
    }
    
    isDrawByInsufficientMaterial = function() {
        let whitePieces = [];
        let blackPieces = [];
        for (let y = 0; y < BOARD_SIZE_Y; y++) {
            for (let x = 0; x < BOARD_SIZE_X; x++) {
                let piece = this.board[y][x];
                if (piece !== '') {
                    if (piece.toUpperCase() === piece) {
                        whitePieces.push(piece.toLowerCase());
                    } else {
                        blackPieces.push(piece.toLowerCase());
                    }
                }
            }
        }
        whitePieces.sort();
        blackPieces.sort();
    
        // Insufficient material conditions
        let whiteInsufficientMaterial = whitePieces.length === 1 && whitePieces[0] === 'k';
        let blackInsufficientMaterial = blackPieces.length === 1 && blackPieces[0] === 'k';
        if (whiteInsufficientMaterial && blackInsufficientMaterial) {
            return true;
        }
    
        if (whitePieces.length === 2 && blackPieces.length === 2) {
            if ((whitePieces[0] === 'k' && whitePieces[1] === 'b') && (blackPieces[0] === 'k' && blackPieces[1] === 'b')) {
                return true;
            }
            if ((whitePieces[0] === 'k' && whitePieces[1] === 'n') && (blackPieces[0] === 'k' && blackPieces[1] === 'n')) {
                return true;
            }
        }
    
        return false;
    }

    gameOver = function() {
        return this.isCheckmate() || this.isStalemate() || this.isDrawByThreefoldRepetition() || this.isDrawByInsufficientMaterial();
    }

    legalMovesArray = function() {
        const legalMoves = [];
    
        for (let y = 0; y < BOARD_SIZE_Y; y++) {
            for (let x = 0; x < BOARD_SIZE_X; x++) {
                const piece = this.board[y][x];
                if (piece !== '') {
                    if ((this.turnColor === 'w' && piece.toUpperCase() === piece) || (this.turnColor === 'b' && piece.toLowerCase() === piece)) {
                        // It's the current player's piece
                        for (let toY = 0; toY < BOARD_SIZE_Y; toY++) {
                            for (let toX = 0; toX < BOARD_SIZE_X; toX++) {
                                if (this.isMoveLegal(x, y, toX, toY)) {
                                    const fromCoord = XYToChessCoord(x, y, BOARD_SIZE_Y);
                                    const toCoord = XYToChessCoord(toX, toY, BOARD_SIZE_Y);
                                    legalMoves.push({ from: fromCoord, to: toCoord });
                                }
                            }
                        }
                    }
                }
            }
        }
    
        return legalMoves;
    }

    legalMoves = function() {
        let legalMovesFormatted = [];
        let legalMoves = this.legalMovesArray();
        for (let i = 0; i < legalMoves.length; i++) {
            const legalMove = legalMoves[i];
            legalMovesFormatted.push(legalMove.from + legalMove.to);
        }
        return legalMovesFormatted.join(' ');
    }

    result = () => {
        if (this.isCheckmate()) {
            return (this.turnColor == "w" ? "0-1" : "1-0");
        }
        if (this.gameOver()) {
            return "1/2-1/2";
        }
        return "*";
    }

    turn = function () {
        return this.turnColor === "w";
    }

    push = function (move) {
        for (const legalMove of this.legalMovesArray()) {
            if (legalMove.from + legalMove.to === move) {
                return this.move(legalMove.from, legalMove.to);
            }
        }
    }

    moveStack = () => {
        return this.history.join(" ");
    }
}

module.exports = Chess;