const Dysnomia = require("@projectdysnomia/dysnomia");

//(async () => { let pngdata = await utils.BoardToPng(new Chess(), false, {name: "Erik Reis", time: 1800}, {name: "Opponent", time: 1800}); fs.writeFileSync('board.png', pngdata)})();


const bot = new Dysnomia.Client(config.discordbot.token, {
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
    console.log("guilds: " + Object.keys(bot.guilds).length);
});

bot.on("error", (err) => {
  console.error(err);
});

bot.on("messageCreate", (msg) => {
    let prefix = config.discordbot.prefix || "chess ";
    if(msg.content.toLowerCase().startsWith(prefix.toLowerCase())) {
        let textwithoutprefix = msg.content.replace(prefix, "");
        let args = textwithoutprefix.split(' ');
        let command = args[0];

        //bot.createMessage(msg.channel.id, "Pong!");
        let roomId;
        if (command == "create") {
            let variant = 'chess';
            let gametype = 'chess';
            if (args.length >= 2) {
                if (avaliablegametypes.includes(args[1])) {
                    gametype = args[1];
                    variant = args[1];
                } else {
                    if (avaliablevariants.includes(args[1])) {
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
                            databaseFunctions.addUser({username: rooms[roomId].white.name, discordId: rooms[roomId].white.discordId, elo: 1500});
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
                if (!rooms[playerRoom.roomId].isStarted) {
                    rooms[playerRoom.roomId].end();
                }
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
                                            databaseFunctions.addUser({username: rooms[roomId].black.name, discordId: rooms[roomId].black.discordId, elo: 1500});
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
                if (rooms[roomId].black.isAvaliable) {
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
                                    databaseFunctions.addUser({username: rooms[roomId].black.name, discordId: rooms[roomId].black.discordId, elo: 1500});
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
                                databaseFunctions.addUser({username: rooms[roomId].white.name, discordId: rooms[roomId].white.discordId, elo: 1500});
                                rooms[roomId].white.elo = 1500;
                            }
                        });
                    }
                    bot.createMessage(msg.channel.id, "Room created\n**Id**: " + roomId);
                }
            }
        } else if (command == "help") {
            let botprefix = config.discordbot.prefix;
            let helpmessage = `# commands:
**${botprefix}help** ===== shows this message
**${botprefix}create [variant]** ===== creates a room (eg. ${botprefix}create checkers   or   ${botprefix}create racingkings)
**${botprefix}join <id>** ===== joins a room
**${botprefix}autojoin** ===== tries to join a random room, if not posssible, creates a new room
**${botprefix}quit** ===== quits the current room
**${botprefix}move <movement>** ===== plays a move (eg. ${botprefix}move e2e4   or   ${botprefix}move 21-17 )

support: https://discord.gg/${config.discordbot.support_server}
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
                file: utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype),
                filename: 'board.png'
            }],
            content: ''
        });

    }

    if (rooms[roomId].white.discordChannelId != rooms[roomId].black.discordChannelId) {
        if (rooms[roomId].black.discordChannelId) {
            bot.createMessage(rooms[roomId].black.discordChannelId, {attachments: [{
                    file: utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype),
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
                        databaseFunctions.addUser({username: white.name, discordId: white.discordId, elo: 1500});
                    }
                });
            }

            if (black.discordId && gametype == "chess" && variant == "chess") {
                databaseFunctions.getUserElo({discordId: black.discordId}).then((userelo) => {
                    if (userelo !== undefined) {
                        databaseFunctions.addUserElo({discordId: black.discordId}, (!isDraw ? (winnerDiscordId == black.discordId ? 10 : -10) : 0));
                    }else{
                        databaseFunctions.addUser({username: black.name, discordId: black.discordId, elo: 1500});
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


function onMoveMade(roomId, move) {
    displayBoard(roomId);
}

roomEvents.onMoveMade.push(onMoveMade);

bot.connect(); // Get the bot to connect to Discord