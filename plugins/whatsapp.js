const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const imageDataURI = require('image-data-uri');

const bot = new Client({
    puppeteer: { 
        args: ['--no-sandbox'],
        headless: true
    }
});

bot.initialize();

bot.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

bot.on('ready', () => {
  console.log('Whasapp Client is ready!');
});

function getPlayerRoom(playerId) {
    for (let roomId of Object.keys(rooms)) {
        roomId = parseInt(roomId);
        if (rooms[roomId].white.whatsappId == playerId) {
            return {
                color: 'white',
                roomId: parseInt(roomId)
            };
        }
        if (rooms[roomId].black.whatsappId == playerId) {
            return {
                color: 'black',
                roomId: parseInt(roomId)
            };
        }
    }
    return undefined;
}

bot.on('message', async (msg) => {
    let prefix = config.discordbot.prefix || "chess ";
    let chatId = msg.from;
    if(msg.body.toLowerCase().startsWith(prefix.toLowerCase())) {
        let textwithoutprefix = msg.body.replace(prefix, "");
        let args = textwithoutprefix.split(' ');
        let command = args[0];

        //bot.sendMessage(chatId, "Pong!");
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
            if (!getPlayerRoom(msg.from)) {
                roomId = roomFunctions.createRoom(gametype, variant);
                rooms[roomId].white.isAvaliable = false;
                rooms[roomId].white.whatsappChannelId = chatId;
                rooms[roomId].white.name = msg.author;
                rooms[roomId].white.whatsappId = msg.from;
                bot.sendMessage(chatId, "Room created\n*Id*: " + roomId);
            }else{
                bot.sendMessage(chatId, "you are already in another room");
            }
        } else if (command == "quit") {
            let playerRoom = getPlayerRoom(msg.from);
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
                        if (!getPlayerRoom(msg.from)) {                            
                            rooms[roomId].black.isAvaliable = false;
                            rooms[roomId].black.whatsappChannelId = chatId;
                            rooms[roomId].black.name = msg.author;
                            rooms[roomId].black.whatsappId = msg.from;
                            rooms[roomId].start();
                        }else{
                            bot.sendMessage(chatId, "you are already in another room");
                        }
                    }else{
                        bot.sendMessage(chatId, "room is already started");
                    }
                }else{
                    bot.sendMessage(chatId, "room does not exist");
                }
            }
        } else if (command == "move") {
            if (args.length >= 2) {
                let move = args[1];
                let room = getPlayerRoom(msg.from);
                if (room) {
                    roomId = room.roomId;

                    if (rooms[roomId].isStarted && (roomFunctions.colorNameToColorLetter(room.color) == 'w') == rooms[roomId].turn()) {
                        rooms[roomId].makeMove(move);
                    }
                }
            }
        } else if (command == "help") {
            let botprefix = config.discordbot.prefix;
            let helpmessage = `# commands:


*${botprefix}help* ===== shows this message

*${botprefix}create [variant]* ===== creates a room (eg. ${botprefix}create checkers   or   ${botprefix}create racingkings)

*${botprefix}join <id>* ===== joins a room

*${botprefix}quit* ===== quits the current room

*${botprefix}move <movement>* ===== plays a move (eg. ${botprefix}move e2e4   or   ${botprefix}move 21-17 )

support: https://discord.gg/${config.discordbot.support_server}
            `;
            msg.reply(helpmessage);
        }
    }
});


function onGameStart(roomId) {
    displayBoard(roomId);
}

function displayBoard(roomId) {
    if (rooms[roomId].white.whatsappChannelId) {
        utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype)
        let media = MessageMedia.fromFilePath(
            'board.png',
            {unsafeMime: true}
        );
        bot.sendMessage(rooms[roomId].white.whatsappChannelId, media);

    }

    if (rooms[roomId].white.whatsappChannelId != rooms[roomId].black.whatsappChannelId) {
        if (rooms[roomId].black.whatsappChannelId) {
            utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype)
            let media = MessageMedia.fromFilePath(
                'board.png',
                {unsafeMime: true}
            );
            bot.sendMessage(rooms[roomId].white.whatsappChannelId, media);
        }
    }
}

roomEvents.onGameStart.push(onGameStart);

function onGameEnd(roomId) {
    let isDraw = rooms[roomId].winner == '';
    let winnerUsername = isDraw ? "" : rooms[roomId][roomFunctions.colorLetterToColorName(rooms[roomId].winner)].name;
    if (rooms[roomId].white.whatsappChannelId) {
        if (isDraw) {
            bot.sendMessage(rooms[roomId].white.whatsappChannelId, `Game Ended in a draw`);
        }else{
            bot.sendMessage(rooms[roomId].white.whatsappChannelId, `Game Ended\n winner: ${winnerUsername}`);
        }
    }

    if (rooms[roomId].white.whatsappChannelId != rooms[roomId].black.whatsappChannelId) {
        if (rooms[roomId].black.whatsappChannelId) {
            if (isDraw) {
                bot.sendMessage(rooms[roomId].black.whatsappChannelId, `Game Ended in a draw`);
            }else{
                bot.sendMessage(rooms[roomId].black.whatsappChannelId, `Game Ended\n winner: ${winnerUsername}`);
            }
        }
    }
}


roomEvents.onGameEnd.push(onGameEnd);


function onMoveMade(roomId, move) {
    displayBoard(roomId);
}

roomEvents.onMoveMade.push(onMoveMade);