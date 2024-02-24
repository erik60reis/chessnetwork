const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const fs = require('fs');
const imageDataURI = require('image-data-uri')

const expressHandlebars = require('express-handlebars');

const app = express();

const handlebars = expressHandlebars.create({
    defaultLayout: false,
    extname: '.html'
});

app.engine('.html', handlebars.engine);
app.set('view engine', '.html');

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

app.get('/:roomId', (req, res) => {
  res.render(join(rootpath, 'assets', 'website', 'index.html'), {roomId: parseInt(req.params.roomId)});
});

app.get('/', (req, res) => {
    try {
        let roomId = roomFunctions.createRoom();
        res.send(`<script>window.location.href = '/${roomId}'</script>`);
    }catch{}
});

app.get('/new/:variant', (req, res) => {
    try {
        let gametype = 'chess';
        let variant = req.params.variant;

        if (avaliablegametypes.includes(variant)) {
            gametype = variant;
        }else{
            if (!avaliablevariants.includes(variant)) {
                variant = 'chess';
            }
        }
        let roomId = roomFunctions.createRoom(gametype, variant);
        res.send(`<script>window.location.href = '/${roomId}'</script>`);
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

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
        let playerRoom = getPlayerRoom(socket.id);
        if (!playerRoom) {
            if (!rooms[roomId].isStarted) {
                let playercolor = 'white'; 
                if (!rooms[roomId].white.isAvaliable) {
                    playercolor = 'black';
                }
                rooms[roomId][playercolor].isAvaliable = false;
                rooms[roomId][playercolor].name = "Guest";
                rooms[roomId][playercolor].socketId = socket.id;
                rooms[roomId][playercolor].socket = socket;
                if (playercolor == 'black') {
                    rooms[roomId].start();
                }
                socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, playercolor == 'black', rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype), 'png'));
            }
        }
    }
  });
});

function onMoveMade(roomId, move) {
    if (rooms[roomId].white.socketId) {
        rooms[roomId].white.socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, false, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype), 'png'));
    }
    if (rooms[roomId].black.socketId) {
        rooms[roomId].black.socket.emit('moveMade', imageDataURI.encode(utils.BoardToPng(rooms[roomId].game, true, rooms[roomId].white, rooms[roomId].black, rooms[roomId].gametype), 'png'));
    }
}

roomEvents.onMoveMade.push(onMoveMade);

server.listen(config.website.port, () => {
  console.log('website running at http://localhost:' + config.website.port);
});