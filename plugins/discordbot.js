if (appconfig.discordbot.enabled) {
    const Dysnomia = require("@projectdysnomia/dysnomia");
    const fs = require('fs');
    const csv = require('csv-parser');
    const path = require('path');

    const bot = new Dysnomia.Client(appconfig.discordbot.token, {
        gateway: {
            intents: [
                'guilds',
                'guildMessages',
                'guildMembers',
                'directMessages',
                'messageContent'
            ]
        }
    });

    function getPlayerRoom(playerId) {
        for (let roomId of Object.keys(rooms)) {
            roomId = parseInt(roomId);
            if (rooms[roomId].white.discordId == playerId) {
                return {
                    color: 'white',
                    roomId: parseInt(roomId)
                };
            }
            if (rooms[roomId].black.discordId == playerId) {
                return {
                    color: 'black',
                    roomId: parseInt(roomId)
                };
            }
        }
        return undefined;
    }
    bot.on("ready", () => {
        console.log("discord bot ready!");
        console.log("guilds: " + bot.guilds.size);
        sendDailyPuzzle();
        setInterval(() => {
            sendDailyPuzzle();
        }, 86400000);
    });

    function processNextPuzzle() {
        const csvFilePath = path.join(rootpath, "assets", "puzzles.csv");
        return new Promise((resolve, reject) => {
            const puzzles = [];
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    puzzles.push(row);
                })
                .on('end', () => {
                    // Check if there are puzzles
                    if (puzzles.length === 0) {
                        reject("No puzzles found in the CSV file.");
                        return;
                    }

                    // Get information about the first puzzle
                    const firstPuzzle = puzzles[0];

                    // Remove the first puzzle from the list
                    puzzles.shift();

                    // Write the remaining puzzles back to the CSV file
                    const writer = fs.createWriteStream(csvFilePath);
                    writer.write(Object.keys(firstPuzzle).join(',') + '\n'); // Write header
                    puzzles.forEach(puzzle => {
                        writer.write(Object.values(puzzle).join(',') + '\n');
                    });
                    writer.end();

                    resolve(firstPuzzle);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }


    function sendDailyPuzzle() {
        processNextPuzzle()
            .then((nextPuzzle) => {
                //console.log("Information about the first puzzle:", nextPuzzle);
                bot.createMessage(appconfig.discordbot.puzzles_channel, {attachments: [{
                        file: utils.NextPuzzleBoardToPng(nextPuzzle),
                        filename: 'board.png'
                    }],
                    content: `Daily Puzzle - ${(new Date()).toUTCString()}`
                });
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    bot.on("error", (err) => {
        console.error(err);
    });

    bot.on("messageCreate", (msg) => {
        let prefix = appconfig.discordbot.prefix || "chess ";
        if (msg.content.toLowerCase().startsWith("cm ")) {
            let move = msg.content.split(" ")[1];
            
            let room = getPlayerRoom(msg.author.id);
            if (room) {
                let roomId = room.roomId;

                if (rooms[roomId].isStarted && (roomFunctions.colorNameToColorLetter(room.color) == 'w') == rooms[roomId].turn()) {
                    rooms[roomId].makeMove(move);
                }
            }
        }
        if(msg.content.toLowerCase().startsWith(prefix.toLowerCase())) {
            let textwithoutprefix = msg.content.replace(prefix, "");
            let args = textwithoutprefix.split(' ');
            let command = args[0];

            //bot.createMessage(msg.channel.id, "Pong!");
            let roomId;
            let skillLevel = 3;
            if (command == "jointournament") {
                let tournamentIndex = 0;
                if (args.length >= 2) {
                    if (tournaments[tournamentIndex] && tournaments[tournamentIndex].players.length < 8) {
                        try {
                            tournamentIndex = parseInt(args[1]);
                        }catch{}
                        tournaments[tournamentIndex].players.push({
                            name: msg.author.globalName,
                            discordId: msg.author.id,
                        });
                    }
                }
            } else if (command == "playbot") {
                let variant = 'chess';
                let fen = null;
                if (args.length >= 2) {
                    if (avaliablevariants.chess.includes(args[1])) {
                        variant = args[1];
                    }
                    if (args.length >= 3) {
                        try {
                            skillLevel = parseInt(args[2]);
                            if (skillLevel > 20) {
                                skillLevel = 20;
                            }
                            if (skillLevel < 0) {
                                skillLevel = 0;
                            }
                        }catch{}
                        if (args.length >= 4) {
                            fen = args[3];
                            for (let index = 4; index < args.length; index++) {
                                const element = args[index];
                                fen += " " + element;
                            }
                        }
                    }
                }
                
                if (!getPlayerRoom(msg.author.id)) {
                    roomId = roomFunctions.createRoom('chess', variant);
                    if (fen) {
                        rooms[roomId].game.setFen(fen);
                    }
                    rooms[roomId].white.isAvaliable = false;
                    rooms[roomId].white.discordChannelId = msg.channel.id;
                    rooms[roomId].white.name = msg.author.globalName;
                    rooms[roomId].white.discordId = msg.author.id;

                    rooms[roomId].black.isAvaliable = false;
                    rooms[roomId].black.botConfiguration = {
                        skillLevel,
                    }
                    rooms[roomId].black.discordChannelId = msg.channel.id;
                    rooms[roomId].black.name = "Bot";

                    rooms[roomId].start();
                }else{
                    bot.createMessage(msg.channel.id, "you are already in another room");
                }
            }
            if (command == "create") {
                let variant = 'chess';
                let gametype = 'chess';
                if (args.length >= 2) {
                    if (avaliablegametypes.includes(args[1])) {
                        gametype = args[1];
                        if (args.length >= 3) {
                            variant = args[2];
                        }else{
                            variant = args[1];
                        }
                    } else {
                        if (avaliablevariants.chess.includes(args[1])) {
                            variant = args[1];
                        }
                    }
                }
                if (!getPlayerRoom(msg.author.id)) {
                    roomId = roomFunctions.createRoom(gametype, variant);
                    rooms[roomId].white.isAvaliable = false;
                    rooms[roomId].white.discordChannelId = msg.channel.id;
                    rooms[roomId].white.name = msg.author.globalName;
                    rooms[roomId].white.discordId = msg.author.id;
                    if (sequelizedb) {
                        databaseFunctions.getUserElo({discordId: rooms[roomId].white.discordId}).then((userelo) => {
                            if (userelo !== undefined) {
                                rooms[roomId].white.elo = userelo;
                            }else{
                                databaseFunctions.addUser({username: rooms[roomId].white.name, discordId: rooms[roomId].white.discordId, elo: 1500, password: utils.generateRandomPassword()});
                                rooms[roomId].white.elo = 1500;
                            }
                        });
                    }
                    bot.createMessage(msg.channel.id, "Room created\n**Id**: " + roomId);
                }else{
                    bot.createMessage(msg.channel.id, "you are already in another room");
                }
            } else if (command == "quit") {
                let playerRoom = getPlayerRoom(msg.author.id);
                if (playerRoom) {
                    if (rooms[playerRoom.roomId].isStarted) {
                        rooms[playerRoom.roomId].winner = (playerRoom.color == "white" ? "b" : "w");
                    }
                    rooms[playerRoom.roomId].end();
                }
            }else if (command == "join") {
                if (args.length >= 2) {
                    roomId = parseInt(args[1]);
                    if (rooms[roomId]) {
                        if (!rooms[roomId].isStarted) {
                            if (rooms[roomId].white.discordId != msg.author.id) {
                                if (!getPlayerRoom(msg.author.id)) {                            
                                    rooms[roomId].black.isAvaliable = false;
                                    rooms[roomId].black.discordChannelId = msg.channel.id;
                                    rooms[roomId].black.name = msg.author.globalName;
                                    rooms[roomId].black.discordId = msg.author.id;
                                    if (sequelizedb) {
                                        databaseFunctions.getUserElo({discordId: rooms[roomId].black.discordId}).then((userelo) => {
                                            if (userelo !== undefined) {
                                                rooms[roomId].black.elo = userelo;
                                            }else{
                                                databaseFunctions.addUser({username: rooms[roomId].black.name, discordId: rooms[roomId].black.discordId, elo: 1500, password: utils.generateRandomPassword()});
                                                rooms[roomId].black.elo = 1500;
                                            }
                                            rooms[roomId].start();
                                        });
                                    }else{
                                        rooms[roomId].start();
                                    }
                                }else{
                                    bot.createMessage(msg.channel.id, "you are already in another room");
                                }
                            }else{
                                bot.createMessage(msg.channel.id, "you are already in this room");
                            }
                        }else{
                            bot.createMessage(msg.channel.id, "room is already started");
                        }
                    }else{
                        bot.createMessage(msg.channel.id, "room does not exist");
                    }
                }
            } else if (command == "move") {
                if (args.length >= 2) {
                    let move = args[1];
                    let room = getPlayerRoom(msg.author.id);
                    if (room) {
                        roomId = room.roomId;

                        if (rooms[roomId].isStarted && (roomFunctions.colorNameToColorLetter(room.color) == 'w') == rooms[roomId].turn()) {
                            rooms[roomId].makeMove(move);
                        }
                    }
                }
            } else if (command == "autojoin") {
                for (let roomId2 of Object.keys(rooms)) {
                    roomId = parseInt(roomId2);
                    if (rooms[roomId].isPublic && rooms[roomId].black.isAvaliable) {
                        if (!getPlayerRoom(msg.author.id)) {                      
                            rooms[roomId].black.isAvaliable = false;
                            rooms[roomId].black.discordChannelId = msg.channel.id;
                            rooms[roomId].black.name = msg.author.globalName;
                            rooms[roomId].black.discordId = msg.author.id;
                            if (sequelizedb) {
                                databaseFunctions.getUserElo({discordId: rooms[roomId].black.discordId}).then((userelo) => {
                                    if (userelo !== undefined) {
                                        rooms[roomId].black.elo = userelo;
                                    }else{
                                        databaseFunctions.addUser({username: rooms[roomId].black.name, discordId: rooms[roomId].black.discordId, elo: 1500, password: utils.generateRandomPassword()});
                                        rooms[roomId].black.elo = 1500;
                                    }
                                    rooms[roomId].start();
                                });
                            }else{
                                rooms[roomId].start();
                            }
                        }else{
                            bot.createMessage(msg.channel.id, "you are already in another room");
                        }
                        break;
                    }
                    if (!getPlayerRoom(msg.author.id)) {
                        roomId = roomFunctions.createRoom('chess', 'chess');
                        rooms[roomId].white.isAvaliable = false;
                        rooms[roomId].white.discordChannelId = msg.channel.id;
                        rooms[roomId].white.name = msg.author.globalName;
                        rooms[roomId].white.discordId = msg.author.id;
                        if (sequelizedb) {
                            databaseFunctions.getUserElo({discordId: rooms[roomId].white.discordId}).then((userelo) => {
                                if (userelo !== undefined) {
                                    rooms[roomId].white.elo = userelo;
                                }else{
                                    databaseFunctions.addUser({username: rooms[roomId].white.name, discordId: rooms[roomId].white.discordId, elo: 1500, password: utils.generateRandomPassword()});
                                    rooms[roomId].white.elo = 1500;
                                }
                            });
                        }
                        bot.createMessage(msg.channel.id, "Room created\n**Id**: " + roomId);
                    }
                }
            } else if (command == "stats") {
                if (sequelizedb) {
                    databaseFunctions.getUser({discordId: msg.author.id}).then((user) => {
                        if (user !== undefined) {
                            bot.createMessage(msg.channel.id, `Your Stats:

Rating: ${user.elo}
`);
                        }else{
                            databaseFunctions.addUser({username: msg.author.globalName, discordId: msg.author.id, elo: 1500, password: utils.generateRandomPassword()});
                            rooms[roomId].white.elo = 1500;
                        }
                    });
                }
            } else if (command == "help") {
                let botprefix = appconfig.discordbot.prefix;
                let helpmessage = `# commands:
    **${botprefix}help** ===== shows this message
    **${botprefix}create [variant]** ===== creates a room (eg. ${botprefix}create checkers   or   ${botprefix}create racingkings)
    **${botprefix}join <id>** ===== joins a room
    **${botprefix}autojoin** ===== tries to join a random room, if not posssible, creates a new room
    **${botprefix}quit** ===== quits the current room
    **${botprefix}stats** ===== gets player stats on the database
    **${botprefix}playbot <variant> <skill level (0 - 20)> <fen>** ===== plays a game with the bot
    **${botprefix}move <movement>** ===== plays a move (eg. ${botprefix}move e2e4   or   ${botprefix}move 21-17 )

    support: ${appconfig.discordbot.support_link}
                `;
                bot.createMessage(msg.channel.id, helpmessage);
            }
        }
    });

    function onGameStart(roomId) {
        displayBoard(roomId);
    }

    function displayBoard(roomId) {
        if (rooms[roomId].white.discordChannelId) {
            bot.createMessage(rooms[roomId].white.discordChannelId, {attachments: [{
                    file: utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant),
                    filename: 'board.png'
                }],
                content: ''
            });

        }

        if (rooms[roomId].white.discordChannelId != rooms[roomId].black.discordChannelId) {
            if (rooms[roomId].black.discordChannelId) {
                bot.createMessage(rooms[roomId].black.discordChannelId, {attachments: [{
                        file: utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant),
                        filename: 'board.png'
                    }],
                    content: ''
                });
            }
        }
    }

    roomEvents.onGameStart.push(onGameStart);

    function onGameEnd(roomId) {
        let isDraw = rooms[roomId].winner == '';
        let winner = isDraw ? "" : rooms[roomId][roomFunctions.colorLetterToColorName(rooms[roomId].winner)];
        const gametype = rooms[roomId].gametype;
        const variant = rooms[roomId].variant;
        const white = rooms[roomId].white;
        const black = rooms[roomId].black;
        const winnerUsername = isDraw ? "" : winner.name;
        const winnerDiscordId = isDraw ? "" : winner.discordId;

        if (!isDraw) {
            if (sequelizedb) {
                if (white.discordId && gametype == "chess" && variant == "chess") {
                    databaseFunctions.getUserElo({discordId: white.discordId}).then((userelo) => {
                        if (userelo !== undefined) {
                            databaseFunctions.addUserElo({discordId: white.discordId}, (!isDraw ? (winnerDiscordId == white.discordId ? 10 : -10) : 0));
                        }else{
                            databaseFunctions.addUser({username: white.name, discordId: white.discordId, elo: 1500, password: utils.generateRandomPassword()});
                        }
                    });
                }

                if (black.discordId && gametype == "chess" && variant == "chess") {
                    databaseFunctions.getUserElo({discordId: black.discordId}).then((userelo) => {
                        if (userelo !== undefined) {
                            databaseFunctions.addUserElo({discordId: black.discordId}, (!isDraw ? (winnerDiscordId == black.discordId ? 10 : -10) : 0));
                        }else{
                            databaseFunctions.addUser({username: black.name, discordId: black.discordId, elo: 1500, password: utils.generateRandomPassword()});
                        }
                    });
                }
            }
        }

        if (rooms[roomId].white.discordChannelId) {
            if (isDraw) {
                bot.createMessage(rooms[roomId].white.discordChannelId, `Game Ended in a draw`);
            }else{
                bot.createMessage(rooms[roomId].white.discordChannelId, `Game Ended\n winner: ${winnerUsername}`);
            }
        }

        if (rooms[roomId].white.discordChannelId != rooms[roomId].black.discordChannelId) {
            if (rooms[roomId].black.discordChannelId) {
                if (isDraw) {
                    bot.createMessage(rooms[roomId].black.discordChannelId, `Game Ended in a draw`);
                }else{
                    bot.createMessage(rooms[roomId].black.discordChannelId, `Game Ended\n winner: ${winnerUsername}`);
                }
            }
        }
    }


    roomEvents.onGameEnd.push(onGameEnd);

    otherEvents.onBoardVideoReady.push((outputPath) => {
        setTimeout(() => {            
            try {
                bot.createMessage(appconfig.discordbot.replays_channel, {attachments: [{
                        file: fs.readFileSync(outputPath),
                        filename: 'replay.mp4'
                    }],
                    content: ''
                });
            } catch{}
        }, 5000);
    });

    otherEvents.onBoardBestVideoReady.push((outputPath) => {
        setTimeout(() => {            
            try {
                bot.createMessage(appconfig.discordbot.best_replays_channel, {attachments: [{
                        file: fs.readFileSync(outputPath),
                        filename: 'replay.mp4'
                    }],
                    content: ''
                });
            } catch{}
        }, 5000);
    });


    function onMoveMade(roomId, move) {
        displayBoard(roomId);
    }

    roomEvents.onMoveMade.push(onMoveMade);

    bot.connect(); // Get the bot to connect to Discord
}