const fs = require('fs');
const ffish = require('./games/ffish');
const Checkers = {
    'checkers': require('./games/checkers.js'),
    'draughts': require('./games/draughts.js'),
}


global.plugins = {};

global.rootpath = __dirname;

global.rooms = {};

global.tournaments = {};


global.roomEvents = {
    onGameStart: [],
    onGameEnd: [],
    onMoveMade: [],
}

global.tournamentEvents = {
    onTournamentStart: [],
    onTournamentEnd: [],
}

global.otherEvents = {
    onBoardVideoReady: [],
    onBoardBestVideoReady: [],
}

global.avaliablegametypes = ['chess', 'checkers'];

global.avaliablevariants = {
    chess: ['chess', 'racingkings', '3check', 'horde', 'amazon', 'gothic', 'amazons', 'courier', 'crazyhouse', 'antichess'],
    checkers: Object.keys(Checkers)
};


global.roomFunctions = {};

global.appconfig = require('./config.json');

global.coordToExternalNumbering = {
    
};

function generateGame(gametype = 'chess', variant = 'chess') {
    switch (gametype) {
        case 'chess':
            return new ffish.Board(variant);
        case 'checkers':
            if (avaliablevariants[gametype].includes(variant)) {
                return Checkers[variant]();
            }
            return Checkers.checkers();
        default:
            return new ffish.Board('chess');
    }
}

roomFunctions.createRoom = function(gametype = 'chess', variant = 'chess') {
    let roomId = nextRoomId();
    rooms[roomId] = {
        gametype: gametype,
        game: generateGame(gametype, variant),
        boardPngImages: [],
        boardPngImagesFlipped: [],
        variant: variant,
        winner: '',
        isStarted: false,
        inactive_time_remaining: appconfig.rooms.inactivity.room_autodelete_inactivity_time,
        white: {
            isAvaliable: true,
            name: 'white',
            time: 1800,
            increment: 0,
        },
        black: {
            isAvaliable: true,
            name: 'black',
            time: 1800,
            increment: 0,
        },
        turn: function() {
            if (rooms[roomId].gametype == 'checkers') {
                return (rooms[roomId].game.turn().toLowerCase() == 'w');
            }else {
                return rooms[roomId].game.turn();
            }
        },
        start: function() {
            rooms[roomId].isStarted = true;
            roomEvents.onGameStart.forEach((event) => {
                event(roomId);
            });
            rooms[roomId].boardPngImages.push(utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant));
            rooms[roomId].boardPngImagesFlipped.push(utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant));
        },
        end: function() {
            utils.boardsToVideo(rooms[roomId].boardPngImages, 'replayvideo.mp4');
            utils.boardsToVideo(rooms[roomId].boardPngImagesFlipped, 'replayvideoflipped.mp4');
            if (rooms[roomId].boardPngImages.length >= 15 && rooms[roomId].boardPngImages.length <= 36) {
                utils.boardsToVideo(rooms[roomId].boardPngImages, 'bestreplayvideo.mp4', true);
                utils.boardsToVideo(rooms[roomId].boardPngImagesFlipped, 'bestreplayvideoflipped.mp4', true);
            }
            roomEvents.onGameEnd.forEach((event) => {
                event(roomId);
            });
            delete rooms[roomId];
        },
        makeMove: function(move) {
            try {
                if (rooms[roomId].gametype == 'checkers') {
                    if (rooms[roomId].game.move({from: move.split('-')[0], to: move.split('-')[1]})) {
                        rooms[roomId][(rooms[roomId].game.turn() ? "black" : "white")].time += rooms[roomId][(rooms[roomId].game.turn() ? "black" : "white")].increment;
                        rooms[roomId].boardPngImages.push(utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant));
                        rooms[roomId].boardPngImagesFlipped.push(utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant));
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
                        rooms[roomId][(rooms[roomId].game.turn() ? "white" : "black")].time += rooms[roomId][(rooms[roomId].game.turn() ? "white" : "black")].increment;
                        rooms[roomId].game.push(move);
                        rooms[roomId].boardPngImages.push(utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant));
                        rooms[roomId].boardPngImagesFlipped.push(utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant));
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

                        let botConfiguration = rooms[roomId][(rooms[roomId].game.turn() ? "white" : "black")].botConfiguration;

                        if (botConfiguration) {
                            utils.GetChessBestMove(rooms[roomId].variant, rooms[roomId].game.fen(), botConfiguration.skillLevel, (bestmove) => {
                                rooms[roomId].makeMove(bestmove);
                            });
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

roomFunctions.createTournament = function(gametype = 'chess', variant = 'chess') {
    let tournamentId = nextTournamentId();
    tournaments[tournamentId] = {
        gametype,
        variant,
        isStarted: true,
        players: [],
        currentStageIndex: 1,
        level_1_room_1: null,
        level_1_room_2: null,
        level_1_room_3: null,
        level_1_room_4: null,
        level_2_room_1: null,
        level_2_room_2: null,
        level_3_room_1: null,
        winner: null,
        start: function () {
            tournaments[tournamentId].isStarted = true;
            tournamentEvents.onTournamentStart.forEach(event => {
                event(tournamentId);
            });
        },
        end: function () {
            tournamentEvents.onTournamentEnd.forEach(event => {
                event(tournamentId);
            });
            delete tournaments[tournamentId];
        }
    };
    return tournamentId;
}

roomEvents.onGameEnd.push((roomId) => {
    if (rooms[roomId].tournamentId != undefined) {
        let tournamentId = rooms[roomId].tournamentId;
        let tournamentLevel = rooms[roomId].tournamentLevel;
        let tournamentRoom = rooms[roomId].tournamentRoom;
        if (rooms[roomId].winner !== '') {
            tournaments[tournamentId][`level_${tournamentLevel}_room_${tournamentRoom}`] = rooms[roomId][roomFunctions.colorLetterToColorName(rooms[roomId].winner)];
        }else{
            let newRoomId = roomFunctions.createRoom(tournaments[tournamentId].gametype, tournaments[tournamentId].variant);
            rooms[newRoomId].white = rooms[roomId].white;
            rooms[newRoomId].black = rooms[roomId].black;
            rooms[newRoomId].tournamentId = rooms[roomId].tournamentId;
            rooms[newRoomId].tournamentLevel = rooms[roomId].tournamentLevel;
            rooms[newRoomId].tournamentRoom = rooms[roomId].tournamentRoom;
            rooms[newRoomId].start();
        }
    }
});

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
    Object.keys(tournaments).forEach(function(tournamentId) {
        if (tournaments[tournamentId].players.length >= 8 && !tournaments[tournamentId].isStarted) {
            while (tournaments[tournamentId].players.length > 8) {
                tournaments[tournamentId].players.pop();
            }
            tournaments[tournamentId].start();
            let tournamentRoomIndex = 1;
            for (let playerIndex = 0; playerIndex < tournaments[tournamentId].players.length; playerIndex += 2) {
                const player = tournaments[tournamentId].players[playerIndex];
                const player2 = tournaments[tournamentId].players[playerIndex + 1];
                let newRoomId = roomFunctions.createRoom(tournaments[tournamentId].gametype, tournaments[tournamentId].variant);
                rooms[newRoomId].white = player;
                rooms[newRoomId].black = player2;
                rooms[newRoomId].tournamentId = tournamentId;
                rooms[newRoomId].tournamentLevel = 1;
                rooms[newRoomId].tournamentRoom = tournamentRoomIndex;
                rooms[newRoomId].start();
                tournamentRoomIndex += 1;
            }
        }
        if (tournaments[tournamentId].isStarted) {
            let tournamentLevels = [[
                "level_1_room_1",
                "level_1_room_1",
                "level_1_room_3",
                "level_1_room_4",
            ],[
                "level_2_room_1",
                "level_2_room_2",
            ],[
                "level_3_room_1",
            ]];

            let levelindex = 0;
            for (let levelkeylist of tournamentLevels) {
                let is_all_winners_set = true;
                levelkeylist.forEach(tournamentroomkey => {
                    if (tournaments[tournamentId][tournamentroomkey] === null) {
                        is_all_winners_set = false;
                    }
                });

                if (!is_all_winners_set && levelindex > currentStageIndex) {
                    let winners = [];
                    let previousLevelKeyList = tournamentLevels[levelindex - 1];
                    for (let winnerIndex = 0; winnerIndex < previousLevelKeyList.length; winnerIndex++) {
                        const winnerKey = previousLevelKeyList[winnerIndex];
                        const winner = tournaments[tournamentId][winnerKey];
                        winners.push(winner);
                    }

                    for (let i = 0; i < winners.length; i += 2) {
                        const player = winners[i];
                        const player2 = winners[i + 1];
                        let newRoomId = roomFunctions.createRoom(tournaments[tournamentId].gametype, tournaments[tournamentId].variant);
                        rooms[newRoomId].white = player;
                        rooms[newRoomId].black = player2;
                        rooms[newRoomId].tournamentId = tournamentId;
                        rooms[newRoomId].tournamentLevel = levelindex + 1;
                        rooms[newRoomId].tournamentRoom = tournamentRoomIndex;
                        rooms[newRoomId].start();
                    }
                    currentStageIndex = levelindex;
                }

                if (is_all_winners_set == false) {
                    break;
                }
            }

            if (!tournaments[tournamentId][tournamentLevels[tournamentLevels.length - 1][0]] !== null) {
                tournaments[tournamentId].winner = tournaments[tournamentId][tournamentLevels[tournamentLevels.length - 1][0]];
                tournaments[tournamentId].end();
            }
        }

    });
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

function nextTournamentId() {
    let tournamentId = 0;
    while (tournaments[tournamentId]) {
        tournamentId += 1;
    }
    return tournamentId;
}


require('./utils/utils.js');
require('./utils/database.js');
require('./utils/gameanalysis.js');


fs.readdir('./plugins/', (err, files) => {
    files.forEach(file => {
        let plugin = require(`./plugins/${file}`);
        plugins[file] = plugin;
    })
});