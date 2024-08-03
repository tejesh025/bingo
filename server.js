const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const waitingPlayers = [];
const rooms = {};

app.use(express.static(path.join(__dirname, 'src')));

// Route to handle root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Function to generate a unique room number
function generateRoom() {
    let newRoom;
    do {
        newRoom = Math.floor(1000 + Math.random() * 9000);
    } while (rooms[newRoom]);
    return newRoom;
}

// Handle new socket connection
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Listen for player name
    socket.on('nameofplayer', (name) => {
        socket.playerName = name;
        waitingPlayers.push(socket);
        checkPlayers();

        // Listen for move events
        socket.on('move', (data) => {
            const room = data.room;
            const move = data.move;
            const gamestatus = data.game;
            if (rooms[room]) {
                io.to(room).emit('move-made', {
                    move: move,
                    gamestatus:gamestatus,
                });
                rooms[room].currentPlayer = rooms[room].currentPlayer === rooms[room].player1.name ? rooms[room].player2.name : rooms[room].player1.name;

                io.to(room).emit('current-player', rooms[room].currentPlayer);

            }
        });

        socket.on('flag',(data)=>{
            const room = data.room;
            const playerflags = data.playername;
            const playerwon = data.oponentname;
            if(rooms[room]){
                io.to(room).emit('winner',{
                    player:playerwon,
                    logs:'player accepted his defeat by flagging',
                });
            }
        })

        socket.on('winstatus',(data)=>{
            const room = data.room;
            const player =data.playername;
            const gamestatus = data.game;
            if(rooms[room]){
                io.to(room).emit('winner',{
                    player:player,
                    gamestatus:gamestatus,
                    logs : 'you won the game, fair and square'
                });
            }
        })

        // socket.on('offine',(data)=>{
        //     const room = data.room;
        //     const playerwon = data.playerwon;
        //     if(rooms[room]){
        //         io.to(room).emit('winner',{
        //             player:playerwon
        //         })
        //     }
        // })

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`Client Disconnected : ${socket.id}`);
            
            if(socket.playerName){
                console.log(socket.playerName);
            }
            if(socket.room){
                io.to(socket.room).emit('disconnectedplayer',{
                    player:socket.playerName,
                    logs:'player disconnected',
                })
            }
            
        });
    });
});

// Function to check and create rooms if there are at least 2 waiting players
function checkPlayers() {
    while (waitingPlayers.length >= 2) {
        const player1Socket = waitingPlayers.shift();
        const player2Socket = waitingPlayers.shift();

        const player1Name = player1Socket.playerName;
        const player2Name = player2Socket.playerName;

        const room = generateRoom();
        player1Socket.join(room);
        player2Socket.join(room);
        player1Socket.room = room;
        player2Socket.room = room;

        rooms[room] = {
            player1: { id: player1Socket.id, name: player1Name, symbol: 'X' },
            player2: { id: player2Socket.id, name: player2Name, symbol: 'O' },
            currentPlayer: player1Name
        };

        io.to(room).emit('room-found-status', { roomNumber: room });

        player1Socket.emit('opponent-assigned', { opponentName: player2Name });
        player2Socket.emit('opponent-assigned', { opponentName: player1Name });

        io.to(room).emit('current-player', rooms[room].currentPlayer);

    }
}

// Start the server
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
