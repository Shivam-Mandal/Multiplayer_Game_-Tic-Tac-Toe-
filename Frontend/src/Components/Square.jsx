

import React, { useState } from 'react';

const Square = ({ gameState,
    setGameState,
    socket,
    playingAs,
    currentElement,
    finishedArrayState,
    setFinished,
    finished,
    id,
    currentPlayer,
    setCurrentPlayer, }) => {
    const [icon, setIcon] = useState(null);

    const handleClick = () => {
        if(playingAs!==currentPlayer) return;
        if (finished) {
            return;
        }
        if (!icon) {
            setIcon(currentPlayer === 'circle' ? 'O' : 'X');
            const myCurrentPlayer = currentPlayer;
            setCurrentPlayer(currentPlayer === 'circle' ? 'cross' : 'circle');
            console.log(id)

            socket.emit("playerMoveFromClient", {
                state: {
                    id,
                    sign: myCurrentPlayer,
                },
            });


            setGameState(prevState => {
                let currState = [...prevState]
                currState[Math.floor(id / 3)][id % 3] = myCurrentPlayer
                console.log(currState)
                return currState;
            })
        }

    };
    const isWinningSquare = finishedArrayState.includes(id);


    return (
        <>
            <div
                className={`w-20 h-20 sm:w-28 sm:h-28 rounded-md my-2 text-7xl text-yellow-400 flex justify-center items-center text-center 
                    ${isWinningSquare ? (finished === 'circle' ? 'bg-green-500' : 'bg-cyan-500') : 'bg-slate-400'}  
                    ${finished ? 'cursor-default' : 'cursor-pointer'}
                    ${currentPlayer!==playingAs?'cursor-default' : 'cursor-pointer'}
                    ${finishedArrayState.includes(id)?'cursor-default':'cursor-pointer'}
                    `}
                onClick={handleClick}
            >
                {currentElement==='circle'?'O': currentElement==='cross'?'X':icon}
            </div>
        </>

    );
};

export default Square;

