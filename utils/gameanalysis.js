const stockfish = require('../games/analysis/stockfish');

/*
stockfish().then((engine) => {
    engine.onmessage = (msg) => {
        console.log(msg);
    }
    
    engine.postMessage("setoption name UCI_Variant value chess");
    engine.postMessage("setoption name Skill Level value 2");
    //engine.postMessage("position fen <fen>");
    //engine.postMessage("position startpos moves e2e4");
    engine.postMessage("position startpos");
    engine.postMessage("go depth 3");

});*/

let enginepromisse = stockfish();

setInterval(() => {
    enginepromisse = stockfish();
}, 18000000);

utils.GetChessBestMove = function (variant = 'chess', fen = 'bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', skilllevel = 3, callback) {
    try {
        if (enginepromisse) {

            enginepromisse.then((engine) => {
                if (engine) {
                    let bestmove = '';
                    
                    engine.addMessageListener((msg) => {
                        console.log(msg);
                        if (msg.startsWith('bestmove ')) {
                            bestmove = msg.split(' ')[1];
                            callback(bestmove);
        
                            engine = null;
                        }
                    });
                    
                    engine.postMessage(`setoption name UCI_Variant value ${variant}`);
                    engine.postMessage(`setoption name Skill Level value ${skilllevel}`);
                    engine.postMessage(`position fen ${fen}`);
                    engine.postMessage("go depth 2");
                }else{
                    utils.GetChessBestMove(variant, fen, skilllevel, callback);
                }
            });
        }else{
            utils.GetChessBestMove(variant, fen, skilllevel, callback);
        }
        
    }catch(error){
        console.log(error);
    }
}