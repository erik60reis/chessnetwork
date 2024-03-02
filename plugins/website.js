if (appconfig.website.enabled) {
    const express = require('express');
    const { createServer } = require('node:http');
    const { join } = require('node:path');
    const { Server } = require('socket.io');
    const fs = require('fs');
    const path = require('path');
    const imageDataURI = require('image-data-uri');
    const DiscordOAuth2Constructor = require('discord-oauth2');
    const session = require('express-session');

    const expressHandlebars = require('express-handlebars');

    const app = express();


    var discordOauth2;

    if (appconfig.auth.discord.enabled && appconfig.database.enabled) {
        discordOauth2 = new DiscordOAuth2Constructor({
            clientId: appconfig.auth.discord.client_id,
            clientSecret: appconfig.auth.discord.client_secret,
            redirectUri: appconfig.auth.discord.redirect_uri,
        });    
    }

    const handlebars = expressHandlebars.create({
        defaultLayout: false,
        extname: '.html'
    });

    app.engine('.html', handlebars.engine);
    app.set('view engine', '.html');

    app.use('/assets/chesspieces', express.static(path.join(rootpath, 'assets', 'chesspieces')));
    app.use('/assets/chessgroundx', express.static(path.join(rootpath, 'assets', 'chessgroundx')));
    app.use('/assets/stylesheets', express.static(path.join(rootpath, 'assets', 'stylesheets')));
    app.use('/assets/checkerspieces', express.static(path.join(rootpath, 'assets', 'checkerspieces')));

    const server = createServer(app);
    const io = new Server(server);

    function getPlayerRoom(playerId) {
        for (let roomId of Object.keys(rooms)) {
            roomId = parseInt(roomId);
            if (rooms[roomId].white.socketId == playerId) {
                return {
                    color: 'white',
                    roomId: parseInt(roomId)
                };
            }
            if (rooms[roomId].black.socketId == playerId) {
                return {
                    color: 'black',
                    roomId: parseInt(roomId)
                };
            }
        }
        return undefined;
    }

    function createRoomAndShowToClient(gametype, variant, res, time = 1800) {
        if (!avaliablegametypes.includes(gametype)) {
            gametype = 'chess';
        }
        if (avaliablegametypes.includes(variant)) {
            gametype = variant;
        }else{
            if (!avaliablevariants[gametype].includes(variant)) {
                variant = gametype;
            }
        }
        let roomId = roomFunctions.createRoom(gametype, variant);
        try {
            rooms[roomId].white.time = parseInt(time);
            rooms[roomId].black.time = parseInt(time);
        }catch{}
        res.send(`<script>window.location.href = '/${roomId}'</script>`);
    }

    app.get('/:roomId', (req, res) => {
        res.render(join(rootpath, 'assets', 'website', 'room.html'), {roomId: parseInt(req.params.roomId)});
    });

    app.get('/', (req, res) => {
        res.render(join(rootpath, 'assets', 'website', 'index.html'), {roomId: parseInt(req.params.roomId), discord_bot_addition_link: appconfig.discordbot.bot_addition_link});
    });

    if (discordOauth2) {
        app.get('/login/discord', (req, res) => {
            const authorizeUrl = discordOauth2.generateAuthUrl({
                scope: ['identify', 'email'],
            });
            res.redirect(authorizeUrl);
        });
        
        app.get('/login/discord/callback', async (req, res) => {
            const code = req.query.code;
            try {
                const tokenData = await discordOauth2.tokenRequest({
                    clientId: appconfig.auth.discord.client_id,
                    clientSecret: appconfig.auth.discord.client_secret,
                    grantType: "authorization_code",
                    code
                });
                const discorduser = await discordOauth2.getUser(tokenData.access_token);
            
                // You can now use 'tokenData' and 'user' to do further actions
                //console.log('Token Data:', tokenData);
                //console.log('User:', discorduser);

                let password = utils.generateRandomPassword();
                if (sequelizedb) {
                    let user = await databaseFunctions.getUser({discordId: discorduser.id})
                    if (user == undefined) {
                        databaseFunctions.addUser({username: discorduser.global_name, discordId: discorduser.id, elo: 1500, password});
                        user = await databaseFunctions.getUser({discordId: discorduser.id});
                    }else{
                        password = user.password;
                    }

                    if (user !== undefined) {
                        res.send(`<script>
                            window.localStorage.setItem('authid', ${user.id});
                            window.localStorage.setItem('authpassword', '${password}');
                            window.location.href = '/';
                        </script>`);
                    }
                }
            
            } catch (error) {
                console.error('Error during login:', error.message);
                res.status(500).send('Internal Server Error');
            }
        });
    }

    app.get('/new/:gametype/:variant', (req, res) => {
        try {
            let gametype = req.params.gametype;
            let variant = req.params.variant;

            createRoomAndShowToClient(gametype, variant, res);
        }catch{}
    });

    app.get('/new/:gametype/', (req, res) => {
        try {
            let gametype = req.params.gametype;
            let variant = gametype;

            createRoomAndShowToClient(gametype, variant, res);
        }catch{}
    });

    app.get('/new/:gametype/:variant/:time', (req, res) => {
        try {
            let gametype = req.params.gametype;
            let variant = req.params.variant;
            let time = req.params.time;

            createRoomAndShowToClient(gametype, variant, res, time);
        }catch{}
    });

    io.on('connection', (socket) => {

        socket.on('makeMove', (move) => {
            let playerRoom = getPlayerRoom(socket.id);

            if (playerRoom) {
                let roomId = playerRoom.roomId;
                
                if (rooms[roomId].isStarted && (playerRoom.color == 'white') == rooms[roomId].turn()) {
                    rooms[roomId].makeMove(move);
                }
            }
        });

        socket.on('joinRoom', async (roomId, id, password) => {
            if (rooms[roomId]) {
                let userdata = await databaseFunctions.getUser({id, password});
                let isUserValid = userdata !== undefined;

                let playerRoom = getPlayerRoom(socket.id);
                if (!playerRoom) {
                    if (!rooms[roomId].isStarted) {
                        let playercolor = 'white'; 
                        if (!rooms[roomId].white.isAvaliable) {
                            playercolor = 'black';
                        }
                        if (rooms[roomId][playercolor].isAvaliable) {
                            rooms[roomId][playercolor].isAvaliable = false;
                            rooms[roomId][playercolor].name = "Guest";
                            rooms[roomId][playercolor].socketId = socket.id;
                            rooms[roomId][playercolor].socket = socket;
                            if (isUserValid) {
                                rooms[roomId][playercolor].name = userdata.username;
                                rooms[roomId][playercolor].elo = userdata.elo;
                            }
                            let gameInfo = utils.getGameInfo(roomId);
                            if (playercolor == 'black') {
                                if (rooms[roomId].white.socketId) {
                                    rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant), 'png'), '', gameInfo, 'white');
                                }
                                rooms[roomId].start();
                            }
                            socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, playercolor == 'black', rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant), 'png'), '', gameInfo, playercolor);
                        }
                    }
                }
            }
        });
    });

    function onMoveMade(roomId, move) {
        let gameInfo = utils.getGameInfo(roomId);
        if (rooms[roomId].white.socketId) {
            rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant), 'png'), (rooms[roomId].turn() ? "Your Turn" : "Black's Turn"), gameInfo, 'white');
        }
        if (rooms[roomId].black.socketId) {
            rooms[roomId].black.socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant), 'png'), (rooms[roomId].turn() ? "White's Turn" : "Your Turn"), gameInfo, 'black');
        }
    }

    roomEvents.onMoveMade.push(onMoveMade);

    function onGameEnd(roomId) {
        let gameInfo = utils.getGameInfo(roomId);
        let isDraw = rooms[roomId].winner == '';
        let winnerColor = roomFunctions.colorLetterToColorName(rooms[roomId].winner);
        //let winner = isDraw ? "" : rooms[roomId][winnerColor];
        if (rooms[roomId].white.socketId) {
            rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant), 'png'), (isDraw ? "Game Ended in a draw" : "Game ended, " + winnerColor + " won the game" ), gameInfo, 'white');
        }
        if (rooms[roomId].black.socketId) {
            rooms[roomId].black.socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant), 'png'), (isDraw ? "Game Ended in a draw" : "Game ended, " + winnerColor + " won the game" ), gameInfo, 'black');
        }
    }


    roomEvents.onGameEnd.push(onGameEnd);

    server.listen(appconfig.website.port, () => {
        console.log('website running at http://localhost:' + appconfig.website.port);
    });
}