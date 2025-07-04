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
    const bodyParser = require('body-parser');
    const webpush = require('web-push');

    const expressHandlebars = require('express-handlebars');

    const app = express();

    let vapidKeys;
    if (fs.existsSync(path.join(rootpath, 'webpushvapidkeys.json'))) {
        vapidKeys = JSON.parse(fs.readFileSync(path.join(rootpath, 'webpushvapidkeys.json')));
    }else{
        vapidKeys = webpush.generateVAPIDKeys();
        fs.writeFileSync(path.join(rootpath, 'webpushvapidkeys.json'), JSON.stringify(vapidKeys));
    }

    webpush.setVapidDetails(
        'mailto:example@yourdomain.org',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    app.use(bodyParser.json());


    let sockets = [];

    var discordOauth2;
    var discordOauth2mobile;


    app.post('/notification/subscribe', async (req, res) => {
        try {
            let subscription = req.body.subscription;
            let userdetails = req.body.userdetails;
            
            let user = await databaseFunctions.getUser({id: userdetails.userId, password: userdetails.userPassword});
            if (user) {
                user.webPushSubscription = JSON.stringify(subscription);
                await user.save();
            }
            
            res.status(201).json({ message: 'Subscription successful' });

            //webpush.sendNotification(subscription, "Hi").catch(err => console.error(err));
        }catch(err){
            console.log('error: ' + err);
        }
    });

    if (appconfig.auth.discord.enabled && appconfig.database.enabled) {
        discordOauth2 = new DiscordOAuth2Constructor({
            clientId: appconfig.auth.discord.client_id,
            clientSecret: appconfig.auth.discord.client_secret,
            redirectUri: appconfig.auth.discord.redirect_uri,
        });
        discordOauth2mobile = new DiscordOAuth2Constructor({
            clientId: appconfig.auth.discord.client_id,
            clientSecret: appconfig.auth.discord.client_secret,
            redirectUri: appconfig.auth.discord.redirect_uri + "?mobile=1",
        });
    }

    const handlebars = expressHandlebars.create({
        defaultLayout: false,
        extname: '.html'
    });

    app.engine('.html', handlebars.engine);
    app.set('view engine', '.html');

    app.use('/assets/chesspieces', express.static(path.join(rootpath, 'assets', 'chesspieces')));
    app.use('/assets/chess2.0pieces', express.static(path.join(rootpath, 'assets', 'chess2.0pieces')));
    app.use('/', express.static(path.join(rootpath, 'assets', 'public')));
    app.use('/assets/checkerspieces', express.static(path.join(rootpath, 'assets', 'checkerspieces')));

    const server = createServer(app);
    const io = new Server(server, {
        transports: ['websocket', 'polling'],
        pingInterval: 25_000,
        pingTimeout: 60_000,
        cors: {
            origin: ["http://localhost:5173", "https://oxadrez.com"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

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

    function getPlayerRoomByDiscordId(playerDiscordId) {
        for (let roomId of Object.keys(rooms)) {
            roomId = parseInt(roomId);
            if (rooms[roomId].white.socketDiscordId == playerDiscordId) {
                return {
                    color: 'white',
                    roomId: parseInt(roomId)
                };
            }
            if (rooms[roomId].black.socketDiscordId == playerDiscordId) {
                return {
                    color: 'black',
                    roomId: parseInt(roomId)
                };
            }
        }
        return undefined;
    }

    function createRoomAndShowToClient(gametype, variant, res, time = 600, increment = 0, invitedUserDiscordId, isPublic = false) {
        if (!avaliablegametypes.includes(gametype)) {
            gametype = 'chess';
        }
        if (avaliablegametypes.includes(variant)) {
            variant = gametype;
        }else{
            if (!avaliablevariants[gametype].includes(variant)) {
                variant = gametype;
            }
        }
        let roomId = roomFunctions.createRoom(gametype, variant);
        try {
            rooms[roomId].white.time = parseInt(time);
            rooms[roomId].black.time = parseInt(time);

            rooms[roomId].white.increment = parseInt(increment);
            rooms[roomId].black.increment = parseInt(increment);

            rooms[roomId].isPublic = isPublic;
        }catch{}

        if (invitedUserDiscordId) {
            res.send(`<script>window.location.href = '/${roomId}?invitedUserDiscordId=${invitedUserDiscordId}'</script>`);
        }else{
            res.send(`<script>window.location.href = '/${roomId}'</script>`);
        }
    }

    app.get('/quickplay/:time/:increment', (req, res) => {
        try {
            let gametype = 'chess';
            let variant = 'chess';

            let time = parseInt(req.params.time);
            let increment = parseInt(req.params.increment);

            let createnewroom = true;

            for (let roomId of Object.keys(rooms)) {
                if (rooms[roomId].isPublic) {
                    if (rooms[roomId].black.isAvaliable) {
                        if (rooms[roomId].white.time == time) {
                            if (rooms[roomId].white.increment == increment) {
                                if (rooms[roomId].variant == variant) {
                                    createnewroom = false;
                                    res.send(`<script>window.location.href = '/${roomId}'</script>`);
                                }
                            }
                        }
                    }
                }
            }

            if (createnewroom) {
                createRoomAndShowToClient(gametype, variant, res, time, increment, undefined, true);
            }
        }catch{}
    });
    
    app.get('/:roomId', (req, res) => {
        try {
            let roomId = parseInt(req.params.roomId);
            let isViewOnlyMode = (rooms[roomId]) && !rooms[roomId].white.isAvaliable && !rooms[roomId].black.isAvaliable;
            res.render(join(rootpath, 'assets', 'website', 'room.html'), {roomId, isViewOnlyMode, invitedUserDiscordId: req.query.invitedUserDiscordId, discord_client_id: appconfig.auth.discord.client_id});
        }catch(error) {
            console.log(error);
        }
    });

    app.get('/', (req, res) => {
        res.render(join(rootpath, 'assets', 'website', 'index.html'), {discord_client_id: appconfig.auth.discord.client_id});
    });

    app.get('/analyse', (req, res) => {
        res.render(path.join(rootpath, 'assets', 'website', 'analyse.html'), {})
    });

    app.get('/l/:roomId', (req, res) => {
        res.send(`
            <script>
            const domainname = window.location.href.split("/")[2];
            window.location.href = "${appconfig.website.custom_url_scheme}://" + domainname + "/${req.params.roomId}";
            window.location.href = "http://" + domainname + "/${req.params.roomId}";
            </script>
        `);
    });

    if (discordOauth2) {
        app.get('/login/discord', (req, res) => {
            const authorizeUrl = (req.query["mobile"] == 1 ? discordOauth2mobile : discordOauth2).generateAuthUrl({
                scope: ['identify', 'email'],
            });
            res.redirect(authorizeUrl);
        });
        
        app.get('/login/discord/callback', async (req, res) => {
            if (req.query["mobile"] == 1) {
                res.send(`<script>window.location.href = window.location.href.replace('https://', '${appconfig.website.custom_url_scheme}://').replace('http://', '${appconfig.website.custom_url_scheme}://').replace('?mobile=1', '?mobile=2');</script>`);
                return;
            }
            const code = req.query.code;
            try {
                const tokenData = await (req.query["mobile"] == 2 ? discordOauth2mobile : discordOauth2).tokenRequest({
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
                            window.localStorage.setItem('webPushVapidPublicKey', '${vapidKeys.publicKey}');
                            
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

    app.get('/playbot/:variant', (req, res) => {
        try {
            let variant = req.params.variant;

            if (!avaliablevariants.chess.includes(variant)) {
                variant = 'chess';
            }

            let roomId = roomFunctions.createRoom('chess', variant);
            try {
                rooms[roomId].white.time = 1800;
                rooms[roomId].black.time = 1800;

                rooms[roomId].white.increment = 0;
                rooms[roomId].black.increment = 0;
                
                rooms[roomId].black.isAvaliable = false;
                rooms[roomId].black.botConfiguration = {
                    skillLevel: 5,
                }
                rooms[roomId].black.name = "Bot";
           }catch{}

            res.send(`<script>window.location.href = '/${roomId}'</script>`);

            setTimeout(() => {
                rooms[roomId].start();
            }, 4000);
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

    app.get('/new/:gametype/:variant/:time/:increment', (req, res) => {
        try {
            let gametype = req.params.gametype;
            let variant = req.params.variant;
            let time = req.params.time;
            let increment = req.params.increment;

            createRoomAndShowToClient(gametype, variant, res, time, increment);
        }catch{}
    });

    app.get('/new/:gametype/:variant/:time/:increment/:invitedUserDiscordId', (req, res) => {
        try {
            let gametype = req.params.gametype;
            let variant = req.params.variant;
            let time = req.params.time;
            let increment = req.params.increment;
            let invitedUserDiscordId = req.params.invitedUserDiscordId;

            createRoomAndShowToClient(gametype, variant, res, time, increment, invitedUserDiscordId);
        }catch{}
    });

    io.on('connection', (socket) => {
        sockets.push(socket);

        socket.on('quickMatch', async (time, increment = 0, username = "Guest", elo = 500, variant = "chess") => {
            try {
                let gametype = 'chess';
    
                let createnewroom = true;
    
                for (let roomId of Object.keys(rooms)) {
                    if (rooms[roomId].isPublic && !rooms[roomId].isStarted) {
                        if (rooms[roomId].black.isAvaliable) {
                            if (rooms[roomId].white.time == time) {
                                if (rooms[roomId].white.increment == increment) {
                                    if (rooms[roomId].variant == variant) {
                                        createnewroom = false;

                                        rooms[roomId]["black"].isAvaliable = false;
                                        rooms[roomId]["black"].name = username;
                                        rooms[roomId]["black"].elo = elo;
                                        rooms[roomId]["black"].socketId = socket.id;
                                        rooms[roomId]["black"].socket = socket;
                                        rooms[roomId].start();
                                        let gameInfo = utils.getGameInfo(roomId);
                                        gameInfo.isStarted = true;
                                        if (rooms[roomId].white.socketId) {
                                            let pnginfo = await utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                                            rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, 'white');
                                        }


                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
    
                if (createnewroom) {
                    let roomId = roomFunctions.createRoom(gametype, variant);
                    rooms[roomId].white.time = time;
                    rooms[roomId].black.time = time;

                    rooms[roomId].white.increment = increment;
                    rooms[roomId].black.increment = increment;

                    rooms[roomId].isPublic = true;

                    rooms[roomId]["white"].isAvaliable = false;
                    rooms[roomId]["white"].name = username;
                    rooms[roomId]["white"].elo = elo;
                    rooms[roomId]["white"].socketId = socket.id;
                    rooms[roomId]["white"].socket = socket;
                }
            }catch{}
        });

        socket.on('createRoom', (time, increment = 0, username = "Guest", elo = 500, variant = "chess") => {
            try {
                let gametype = 'chess';

                let roomId = roomFunctions.createRoom(gametype, variant);

                rooms[roomId].white.time = time;
                rooms[roomId].black.time = time;

                rooms[roomId].white.increment = increment;
                rooms[roomId].black.increment = increment;

                rooms[roomId].isPublic = false;

                rooms[roomId]["white"].isAvaliable = false;
                rooms[roomId]["white"].name = username;
                rooms[roomId]["white"].elo = elo;
                rooms[roomId]["white"].socketId = socket.id;
                rooms[roomId]["white"].socket = socket;

                socket.emit("roomCreated", roomId);
            }catch{}
        });

        socket.on('joinRoomWeb', async (roomId, id, password, gameURL, invitedUserDiscordId) => {
            try {
                if (rooms[roomId]) {
                    let userdata = await databaseFunctions.getUser({id, password});
                    let isUserValid = userdata !== undefined;

                    let playerRoom = getPlayerRoom(socket.id);
                    let playerRoomByDiscordId = (isUserValid ? getPlayerRoomByDiscordId(userdata.discordId) : undefined);

                    if (!playerRoom && playerRoomByDiscordId) {
                        if (playerRoomByDiscordId.roomId == roomId) {
                            rooms[roomId][playerRoomByDiscordId.color].socketId = socket.id;
                            rooms[roomId][playerRoomByDiscordId.color].socket = socket;
                            let gameInfo = utils.getGameInfo(roomId);
                            let pnginfo = utils.BoardToPng(rooms[roomId].game, playerRoomByDiscordId.color == 'black', rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                            socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, playerRoomByDiscordId.color);
                        }
                    }

                    if (isUserValid) {
                        let invitedUser = await databaseFunctions.getUser({discordId: invitedUserDiscordId});
                        if (invitedUser) {
                            console.log(typeof(invitedUser.webPushSubscription));
                            console.log(invitedUser.webPushSubscription);
                            webpush.sendNotification(JSON.parse(invitedUser.webPushSubscription), `${userdata.username} is inviting you for a game, ${gameURL.split("?")[0]}`);
                        }
                    }

                    if (!playerRoom) {
                        if (playerRoomByDiscordId) {
                            rooms[playerRoomByDiscordId.roomId][playerRoomByDiscordId.color].socketDiscordId = undefined;            
                        }
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
                                    if (userdata.discordId && userdata.discordId !== "") {
                                        rooms[roomId][playercolor].socketDiscordId = userdata.discordId;
                                    }
                                    rooms[roomId][playercolor].name = userdata.username;
                                    rooms[roomId][playercolor].elo = userdata.elo;
                                }
                                let gameInfo = utils.getGameInfo(roomId);
                                if (playercolor == 'black') {
                                    rooms[roomId].start();
                                    gameInfo.isStarted = true;
                                    if (rooms[roomId].white.socketId) {
                                        let pnginfo = await utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                                        rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, 'white');
                                    }
                                }

                                let pnginfo = await utils.BoardToPng(rooms[roomId].game, playercolor == 'black', rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                                socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, playercolor);
                            }
                            else {
                                try {
                                    let gameInfo = utils.getGameInfo(roomId);

                                    let userdata = await databaseFunctions.getUser({id, password});
                                    let isUserValid = userdata !== undefined;
                                    let playerRoomByDiscordId = (isUserValid ? getPlayerRoomByDiscordId(userdata.discordId) : undefined);
                                    
                                    if (playerRoomByDiscordId) {
                                        if (playerRoomByDiscordId.roomId == roomId) {
                                            socket.emit('DisableViewOnlyMode');
                                        }
                                    }
                                    let pnginfo = await utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                                    socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, 'white');
                                }catch{}
                            }
                        }
                    }
                }
            }catch{}
        });
        socket.on('joinRoom', async (roomId, username = "Guest", elo = 500) => {
            try {
                if (rooms[roomId].isPublic && !rooms[roomId].isStarted) {
                    if (rooms[roomId].black.isAvaliable) {
                        if (["chess", "racingkings"].includes(rooms[roomId].variant)) {
                            rooms[roomId]["black"].isAvaliable = false;
                            rooms[roomId]["black"].name = username;
                            rooms[roomId]["black"].elo = elo;
                            rooms[roomId]["black"].socketId = socket.id;
                            rooms[roomId]["black"].socket = socket;
                            rooms[roomId].start();
                            let gameInfo = utils.getGameInfo(roomId);
                            gameInfo.isStarted = true;
                            if (rooms[roomId].white.socketId) {
                                let pnginfo = await utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                                rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, 'white');
                            }
                        }
                    }
                }
            }catch{}
        });

        socket.on('resign', () => {
            try {
                let playerRoom = getPlayerRoom(socket.id);
                let playerColor = playerRoom.color;

                if (playerRoom) {
                    let roomId = playerRoom.roomId;
                    
                    rooms[roomId].winner = (playerColor === 'white' ? 'b' : 'w');
                    rooms[roomId].end();
                    
                    socket.emit('gameOver', { winner: rooms[roomId].winner });
                    socket.broadcast.to(roomId).emit('gameOver', { winner: rooms[roomId].winner });
                }
            }catch{}
        });

        socket.on('makeMove', (move) => {
            let playerRoom = getPlayerRoom(socket.id);

            if (playerRoom) {
                let roomId = playerRoom.roomId;
                
                if (rooms[roomId].isStarted && (playerRoom.color == 'white') == rooms[roomId].turn()) {
                    rooms[roomId].makeMove(move);
                }
            }
        });

        socket.on('disconnect', async () => {
            sockets.splice(sockets.indexOf(socket), 1);
            
            let playerRoom = getPlayerRoom(socket.id);
            
            if (playerRoom) {
                let roomId = playerRoom.roomId;
                
                if (rooms[roomId].isStarted && !rooms[roomId][playerRoom.color].discordId) {
                    rooms[roomId].winner = (playerRoom.color == "white" ? "b" : "w");
                    rooms[roomId].end();
                }
            }
        });

        socket.on('joinRoom', async (roomId, id, password, gameURL, invitedUserDiscordId) => {
            if (rooms[roomId]) {
                let userdata = await databaseFunctions.getUser({id, password});
                let isUserValid = userdata !== undefined;

                let playerRoom = getPlayerRoom(socket.id);
                let playerRoomByDiscordId = (isUserValid ? getPlayerRoomByDiscordId(userdata.discordId) : undefined);

                if (!playerRoom && playerRoomByDiscordId) {
                    if (playerRoomByDiscordId.roomId == roomId) {
                        rooms[roomId][playerRoomByDiscordId.color].socketId = socket.id;
                        rooms[roomId][playerRoomByDiscordId.color].socket = socket;
                        let gameInfo = utils.getGameInfo(roomId);
                        let pnginfo = await utils.BoardToPng(rooms[roomId].game, playerRoomByDiscordId.color == 'black', rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                        socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, playerRoomByDiscordId.color);
                    }
                }

                if (isUserValid) {
                    let invitedUser = await databaseFunctions.getUser({discordId: invitedUserDiscordId});
                    if (invitedUser) {
                        console.log(typeof(invitedUser.webPushSubscription));
                        console.log(invitedUser.webPushSubscription);
                        webpush.sendNotification(JSON.parse(invitedUser.webPushSubscription), `${userdata.username} is inviting you for a game, ${gameURL.split("?")[0]}`);
                    }
                }

                if (!playerRoom) {
                    if (playerRoomByDiscordId) {
                        rooms[playerRoomByDiscordId.roomId][playerRoomByDiscordId.color].socketDiscordId = undefined;            
                    }
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
                                if (userdata.discordId && userdata.discordId !== "") {
                                    rooms[roomId][playercolor].socketDiscordId = userdata.discordId;
                                }
                                rooms[roomId][playercolor].name = userdata.username;
                                rooms[roomId][playercolor].elo = userdata.elo;
                            }
                            let gameInfo = utils.getGameInfo(roomId);
                            if (playercolor == 'black') {
                                rooms[roomId].start();
                                gameInfo.isStarted = true;
                                if (rooms[roomId].white.socketId) {
                                    let pnginfo = await utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                                    rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, 'white');
                                }
                            }
                            let pnginfo = await utils.BoardToPng(rooms[roomId].game, playercolor == 'black', rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                            socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), '', gameInfo, playercolor);
                        }
                    }
                }
            }
        });
    });

    async function onMoveMade(roomId, move) {
        let gameInfo = utils.getGameInfo(roomId);
        if (rooms[roomId].white.socketId) {
            let pnginfo = await utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
            rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), (rooms[roomId].turn() ? "Your Turn" : "Black's Turn"), gameInfo, 'white');
        }
        if (rooms[roomId].black.socketId) {
            let pnginfo = await utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant)
            rooms[roomId].black.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), (rooms[roomId].turn() ? "White's Turn" : "Your Turn"), gameInfo, 'black');
        }
    }

    roomEvents.onMoveMade.push(onMoveMade);

    async function onGameEnd(roomId) {
        let gameInfo = utils.getGameInfo(roomId);
        let isDraw = rooms[roomId].winner == '';
        try {
            let winnerColor = roomFunctions.colorLetterToColorName(rooms[roomId].winner);
            //let winner = isDraw ? "" : rooms[roomId][winnerColor];
            if (rooms[roomId].white.socketId) {
                let pnginfo = await utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), (isDraw ? "Game Ended in a draw" : "Game ended, " + winnerColor + " won the game" ), gameInfo, 'white');
                rooms[roomId].white.socket.emit('gameOver', roomFunctions.colorNameToColorLetter(winnerColor));
                rooms[roomId].black.socket.emit('gameOver', roomFunctions.colorNameToColorLetter(winnerColor));
            }
            if (rooms[roomId].black.socketId) {
                let pnginfo = await utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype, rooms[roomId].variant);
                rooms[roomId].black.socket.emit('moveMade', imageDataURI.encode(pnginfo, 'png'), (isDraw ? "Game Ended in a draw" : "Game ended, " + winnerColor + " won the game" ), gameInfo, 'black');
                rooms[roomId].white.socket.emit('gameOver', roomFunctions.colorNameToColorLetter(winnerColor));
                rooms[roomId].black.socket.emit('gameOver', roomFunctions.colorNameToColorLetter(winnerColor));
            }
        }catch{}
    }


    roomEvents.onGameEnd.push(onGameEnd);


    roomEvents.onGameStart.push((roomId) => {
        if (rooms[roomId].white.socketId) {
            rooms[roomId].white.socket.emit('joinPermitted', roomId, 'white');
        }
        if (rooms[roomId].black.socketId) {
            rooms[roomId].black.socket.emit('joinPermitted', roomId, 'black');
        }
    });

    server.listen(appconfig.website.port, () => {
        console.log('website running at http://localhost:' + appconfig.website.port);
    });
}