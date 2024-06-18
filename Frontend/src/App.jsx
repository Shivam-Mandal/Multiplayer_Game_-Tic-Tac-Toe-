import { useEffect, useState } from 'react';
import './App.css';
import Square from './Components/Square';
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

function App() {
  const renderFrom = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState('circle');
  const [finished, setFinished] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);

  const checkWinner = () => {
    for (let row = 0; row < gameState.length; row++) {
      if (gameState[row][0] === gameState[row][1] && gameState[row][1] === gameState[row][2]) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }
    for (let col = 0; col < gameState.length; col++) {
      if (gameState[0][col] === gameState[1][col] && gameState[1][col] === gameState[2][col]) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }
    if (gameState[0][0] === gameState[1][1] && gameState[1][1] === gameState[2][2]) {
      setFinishedArrayState([0, 4, 8]);
      return gameState[1][1];
    }
    if (gameState[0][2] === gameState[1][1] && gameState[1][1] === gameState[2][0]) {
      setFinishedArrayState([2, 4, 6]);
      return gameState[1][1];
    }
    let drawGame = gameState.flat().every(e => e === 'circle' || e === 'cross');
    if (drawGame) return 'draw';
  };

  useEffect(() => {
    let winner = checkWinner();
    if (winner === 'circle' || winner === 'cross' || winner === 'draw') {
      setFinished(winner);
    }
  }, [gameState]);

  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        setPlayOnline(true);
      });

      socket.on("OpponentNotFound", () => {
        setOpponentName(false);
      });

      socket.on("OpponentFound", (data) => {
        setPlayingAs(data.playingAs);
        setOpponentName(data.opponentName);
      });

      socket.on("opponentLeftMatch", () => {
        setFinished("opponentLeftMatch");
      });

      socket.on("playerMoveFromServer", (data) => {
        const id = data.state.id;
        setGameState((prevState) => {
          const newState = [...prevState];
          const rowIndex = Math.floor(id / 3);
          const colIndex = id % 3;
          newState[rowIndex][colIndex] = data.state.sign;
          return newState;
        });
        setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
      });

      return () => {
        socket.off("connect");
        socket.off("OpponentNotFound");
        socket.off("OpponentFound");
        socket.off("opponentLeftMatch");
        socket.off("playerMoveFromServer");
      };
    }
  }, [socket]);

  const takePlayerName = async () => {
    const res = await Swal.fire({
      title: "Enter your Name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to enter your name!";
        }
      }
    });
    return res;
  };

  const handlePlayOnline = async () => {
    const res = await takePlayerName();
    if (!res.isConfirmed) return;
    setPlayerName(res.value);
    const newSocket = io('http://localhost:3000', { autoConnect: true });
    newSocket.emit("request_to_play", { playerName: res.value });
    setSocket(newSocket);
  };

  if (playOnline && !opponentName) {
    return (
      <div className="overflow-hidden flex justify-center items-center text-white">
        <p className='justify-center mt-60 text-2xl'>waiting for opponent...!!!</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md pt-6 mx-auto text-center text-white px-4">
      {!playOnline ? (
        <div onClick={handlePlayOnline} className='bg-yellow-300 w-48 sm:w-48 sm:my-64 md:my-64 m-auto flex justify-center text-black font-bold py-2 rounded-lg cursor-pointer'>
          Play Online
        </div>
      ) : (
        <>
          <div className="mx-auto w-full sm:w-96 flex justify-between my-4">
            <div className={`w-36 h-14 font-semibold text-xl text-center py-3 rounded-full ${currentPlayer === playingAs ? "text-green-400 border-2 border-green-500 shadow-md" : ""}`}>
              {playerName}
            </div>
            <div className={`w-36 h-14 font-semibold text-xl text-center py-3 rounded-full ${currentPlayer !== playingAs ? "text-cyan-400 border-2 border-cyan-500 shadow-md" : ""}`}>
              {opponentName}
            </div>
          </div>
          <div className="bg-slate-200 w-full sm:w-96 p-2 text-orange-500 mx-auto font-extrabold rounded-lg font-Outfit">
            {finished && finished === 'draw' && finished !== "opponentLeftMatch" ? (
              <div className="text-red-600 font-semibold text-3xl">Match Draw</div>
            ) : finished ? (
              <div className={`font-semibold text-3xl`}>{finished === playingAs ? 'You won the game' : 'you lose the game'}</div>
            ) : (
              <h1 className='text-2xl'>Tic Tac Toe</h1>
            )}
          </div>
          <div className="mt-6">
            {gameState.map((arr, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-3">
                {arr.map((e, colIdx) => (
                  <Square
                    socket={socket}
                    playingAs={playingAs}
                    gameState={gameState}
                    finishedArrayState={finishedArrayState}
                    finished={finished}
                    currentPlayer={currentPlayer}
                    setCurrentPlayer={setCurrentPlayer}
                    setGameState={setGameState}
                    id={rowIdx * 3 + colIdx}
                    key={rowIdx * 3 + colIdx}
                    currentElement={e}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
