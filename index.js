const fs = require('fs');
const ffish = require('./ffish');
const Checkers = require('./checkers');


global.plugins = {};

global.rootpath = __dirname;

global.rooms = {};

global.roomEvents = {
    onGameStart: [],
    onGameEnd: [],
    onMoveMade: [],
}

global.avaliablegametypes = ['chess', 'checkers'];

global.avaliablevariants = ['chess', 'racingkings', '3check', 'horde', 'amazon', 'gothic', 'amazons'];

global.roomFunctions = {};

global.config = require('./config.json');
/*
|| Internal numbering       External Numbering
|| --------------------     --------------------
||     01  02  03  04           01  02  03  04
||   05  06  07  08           05  06  07  08
||     10  11  12  13           09  10  11  12
||   14  15  16  17           13  14  15  16
||     19  20  21  22           17  18  19  20
||   23  24  25  26           21  22  23  24
||     28  29  30  31           25  26  27  28
||   32  33  34  35           29  30  31  32
|| --------------------     --------------------*/
global.coordToExternalNumbering = {
    
};

roomFunctions.createRoom = function(gametype = 'chess', variant = 'chess') {
    let roomId = nextRoomId();
    rooms[roomId] = {
        gametype: gametype,
        game: (gametype == 'checkers' ? Checkers() : new ffish.Board(variant)),
        variant: variant,
        winner: '',
        isStarted: false,
        inactive_time_remaining: config.room_autodelete_inactivity_time,
        white: {
            isAvaliable: true,
            name: 'white',
            time: 1800,
        },
        black: {
            isAvaliable: true,
            name: 'black',
            time: 1800,
        },
        turn: function() {
            if (rooms[roomId].gametype == 'checkers') {
                return (rooms[roomId].game.turn().toLowerCase() == 'w');
            }else {
                return rooms[roomId].game.turn();
            }
        },
        start: function() {
            roomEvents.onGameStart.forEach((event) => {
                rooms[roomId].isStarted = true;
                event(roomId);
            });
        },
        end: function() {
            roomEvents.onGameEnd.forEach((event) => {
                event(roomId);
            });
            delete rooms[roomId];
        },
        makeMove: function(move) {
            try {
                if (rooms[roomId].gametype == 'checkers') {
                    if (rooms[roomId].game.move({from: move.split('-')[0], to: move.split('-')[1]})) {
                        roomEvents.onMoveMade.forEach((event) => {
                            event(roomId, move);
                        });
                    }

                    if (rooms[roomId].game.gameOver()) {
                        if (!rooms[roomId].game.inDraw()) {
                            if (rooms[roomId].game.turn().toLowerCase() == 'b') {
                                rooms[roomId].winner = 'w';
                                rooms[roomId].end();
                            } else if (rooms[roomId].game.turn().toLowerCase() == 'w') {
                                rooms[roomId].winner = 'b';
                                rooms[roomId].end();
                            } 
                        } else {
                            rooms[roomId].winner = '';
                            rooms[roomId].end();
                        }
                    }

                } else {
                    if (rooms[roomId].game.legalMoves().split(' ').includes(move)) {
                        rooms[roomId].game.push(move);
                        roomEvents.onMoveMade.forEach((event) => {
                            event(roomId, move);
                        });
                        
                        if (rooms[roomId].game.result() != "*") {
                            if (rooms[roomId].game.result() == "1-0") {
                                rooms[roomId].winner = 'w';
                                rooms[roomId].end();
                            } else if (rooms[roomId].game.result() == "0-1") {
                                rooms[roomId].winner = 'b';
                                rooms[roomId].end();
                            } else {
                                rooms[roomId].winner = '';
                                rooms[roomId].end();
                            }
                        }
                    }
                }
            }catch(e) {
                console.log(e);
            }
        }
    };
    return roomId;
}

roomFunctions.colorLetterToColorName = function(letter) {
    if (letter == 'w') {
        return 'white';
    }else if (letter == 'b') {
        return 'black';
    }
}

roomFunctions.colorNameToColorLetter = function(colorName) {
    if (colorName == 'white') {
        return 'w';
    }else if (colorName == 'black') {
        return 'b';
    }
}


setInterval(() => {
    Object.keys(rooms).forEach(function(roomId) {
        roomId = parseInt(roomId);
        if (rooms[roomId].isStarted) {
            if (rooms[roomId].gametype == 'checkers') {
                if (rooms[roomId].game.turn().toLowerCase() == 'w') {
                    rooms[roomId].white.time -= 0.2;
                } else {
                    rooms[roomId].black.time -= 0.2;
                }
            } else {
                if (rooms[roomId].game.turn()) {
                    rooms[roomId].white.time -= 0.2;
                } else {
                    rooms[roomId].black.time -= 0.2;
                }
            }

            if (rooms[roomId].white.time <= 0) {
                rooms[roomId].winner = 'b';
                rooms[roomId].end();
            }else if (rooms[roomId].black.time <= 0) {
                rooms[roomId].winner = 'w';
                rooms[roomId].end();
            }
        }else{
            rooms[roomId].inactive_time_remaining -= 0.2;
            if (rooms[roomId].inactive_time_remaining <= 0) {
                rooms[roomId].end();
            }
        }
    });
}, 200);


function nextRoomId() {
    let roomId = 0;
    while (rooms[roomId]) {
        roomId += 1;
    }
    return roomId;
}


require('./utils/utils.js');
require('./utils/database.js');

fs.readdir('./plugins/', (err, files) => {
    files.forEach(file => {
        let plugin = require(`./plugins/${file}`);
        plugins[file] = plugin;
    })
})