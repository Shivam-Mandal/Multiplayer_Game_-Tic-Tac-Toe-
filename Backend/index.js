const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const allUsers = {};
const allRooms = [];

app.use(cors());
const port = 3000;

io.on('connection', (socket) => {
    console.log('Client connected');
    allUsers[socket.id] = {
        socket: socket,
        online: true,
    };

    socket.on('request_to_play', (data) => {
        const currentUser = allUsers[socket.id];
        currentUser.playerName = data.playerName;
        currentUser.playing = false;

        let opponentPlayer;

        for (let key in allUsers) {
            console.log(key)
            const user = allUsers[key];
            console.log('hello',user)
            if (user.online && !user.playing && socket.id !== key) {
                opponentPlayer = user;
                break;
            }
        }

        if (opponentPlayer) {
            currentUser.playing = true;
            opponentPlayer.playing = true;

            allRooms.push({
                player1: opponentPlayer,
                player2: currentUser,
            });

            currentUser.socket.emit("OpponentFound", {
                opponentName: opponentPlayer.playerName,
                playingAs: "circle",
            });

            opponentPlayer.socket.emit("OpponentFound", {
                opponentName: currentUser.playerName,
                playingAs: "cross",
            });

            currentUser.socket.on("playerMoveFromClient", (data) => {
                opponentPlayer.socket.emit("playerMoveFromServer", data);
            });

            opponentPlayer.socket.on("playerMoveFromClient", (data) => {
                currentUser.socket.emit("playerMoveFromServer", data);
            });
        } else {
            currentUser.socket.emit("OpponentNotFound");
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        const currentUser = allUsers[socket.id];
        if (currentUser) {
            currentUser.online = false;
            currentUser.playing = false;

            for (let idx = 0; idx < allRooms.length; idx++) {
                const { player1, player2 } = allRooms[idx];

                if (player1.socket.id === socket.id) {
                    player2.socket.emit("opponentLeftMatch");
                    allRooms.splice(idx, 1);
                    break;
                }

                if (player2.socket.id === socket.id) {
                    player1.socket.emit('opponentLeftMatch');
                    allRooms.splice(idx, 1);
                    break;
                }
            }
        }
    });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
