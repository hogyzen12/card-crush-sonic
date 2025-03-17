import React, { useEffect, useState } from "react";
import { atom, useRecoilState } from "recoil";
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { getWalletBalance } from './utils/wallet';
import { createSonicTx } from './transactionSonic';
import { CSSProperties } from 'react';
import { fetchLevels, updateLevelStatus, getNextAvailableLevel } from './utils/levelManager';
import { fetchGameTransactionHistory } from './utils/transactionHistory';


const connection = new Connection('https://api.mainnet-alpha.sonic.game');

const deepCopyBoard = (originalBoard: number[][]): number[][] => {
  return originalBoard.map(row => [...row]);
};

const matchGifIndex = 42;
const initialTurnLimit = 4;

const candyImages = [
  "assets/newcards/air.PNG",
  "assets/newcards/bck.PNG",
  "assets/newcards/bnk.PNG",
  "assets/newcards/fre.PNG",
  "assets/newcards/inu.PNG",
  "assets/newcards/jls.PNG",
  "assets/newcards/jto.PNG",
  "assets/newcards/nyl.PNG",
  "assets/newcards/ott.PNG",
  "assets/newcards/thn.PNG",
  "assets/newcards/tts.PNG",
  "assets/newcards/unr.PNG",
  "assets/newcards/wtr.PNG"
];

const candyGifs = [
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif",
  "assets/animations/burn.gif"
];

const activateSound = new Audio("assets/audio/activate.mp3");
const swapSound = new Audio("assets/audio/swap.mp3");
const clickSound = new Audio("assets/audio/click.mp3");
const soundOnIcon = "assets/unmute.png"; // Using the existing unmute icon for sound on
const soundOffIcon = "assets/mute.png";  // Using the existing mute icon for sound off

const initialGridSize = 6; // Define an initial grid size

const generateBoardFromSeed = (currentSeed: string, gridSize: number): number[][] => {
  let board = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const seedChar = currentSeed[(i * gridSize + j) % currentSeed.length];
      board[i][j] = seedChar.charCodeAt(0) % candyImages.length;
    }
  }
  return board;
};

const transactionStatusState = atom({
  key: 'transactionStatusState',
  default: 'Idle',
});

const transactionProcessingState = atom({
  key: 'transactionProcessingState',
  default: false,
});

const showNotificationState = atom({
  key: 'showNotificationState',
  default: false,
});

const boardState = atom({
  key: 'boardState',
  default: generateBoardFromSeed("zfBXvBuF2DcPs3jDieQmGbQBFrBgsFnXhHQBngaD9oXHibbZqfoszMT15qEcxtwLxfYVrPUuNrFNZh1ZqbvnCDq", initialGridSize), // Placeholder default
});

const matchCountState = atom({
  key: 'matchCountState',
  default: 0,
});

const turnCountState = atom({
  key: 'turnCountState',
  default: 0,
});

const selectedTileState = atom({
  key: 'selectedTileState',
  default: null as { row: number, col: number } | null,
});

const movesState = atom({
  key: 'movesState',
  default: [] as string[],
});

const balanceState = atom({
  key: 'balanceState',
  default: 0,
});

const signatureState = atom({
  key: 'signatureState',
  default: "",
});

const currentSeedState = atom({
  key: 'currentSeedState',
  default: "defaultSeed", // Placeholder default
});

const animationBoardState = atom({
  key: 'animationBoardState',
  default: generateBoardFromSeed("defaultSeed", initialGridSize), // Placeholder default
});

const turnLimitState = atom({
  key: 'turnLimitState',
  default: initialTurnLimit,
});

const gridSizeState = atom({
  key: 'gridSizeState',
  default: 6,
});

export function SonicGameScreen() {
  const { publicKey, signTransaction } = useWallet();
  const [transactionStatus, setTransactionStatus] = useRecoilState(transactionStatusState);
  const [transactionProcessing, setTransactionProcessing] = useRecoilState(transactionProcessingState);
  const [showNotification, setShowNotification] = useRecoilState(showNotificationState);
  const [board, setBoard] = useRecoilState(boardState);
  const [matchCount, setMatchCount] = useRecoilState(matchCountState);
  const [turnCount, setTurnCount] = useRecoilState(turnCountState);
  const [turnLimit, setTurnLimit] = useRecoilState(turnLimitState);
  const [selectedTile, setSelectedTile] = useRecoilState(selectedTileState);
  const [moves, setMoves] = useRecoilState(movesState);
  const [balance, setBalance] = useRecoilState(balanceState);
  const [signature, setSignature] = useRecoilState(signatureState);
  const [currentSeed, setCurrentSeed] = useRecoilState(currentSeedState);
  const [animationBoard, setAnimationBoard] = useRecoilState(animationBoardState);
  const [animateTurn, setAnimateTurn] = useState(false);
  const [animatePoints, setAnimatePoints] = useState(false);
  const [gridSize, setGridSize] = useRecoilState(gridSizeState);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  useEffect(() => {
    if (animateTurn) {
      const timeout = setTimeout(() => setAnimateTurn(false), 1);
      return () => clearTimeout(timeout);
    }
  }, [animateTurn]);

  useEffect(() => {
    if (animatePoints) {
      const timeout = setTimeout(() => setAnimatePoints(false), 1);
      return () => clearTimeout(timeout);
    }
  }, [animatePoints]);

  useEffect(() => {
    if (publicKey) {
      fetchWalletData();
    }
  }, [publicKey]);

  const playSoundEffect = (sound: HTMLAudioElement) => {
    if (soundEffectsEnabled) {
      sound.play().catch(error => console.error('Error playing sound effect:', error));
    }
  };

  const fetchWalletData = async () => {
    try {
      if (publicKey) {
        const balance = await getWalletBalance(connection, publicKey);
        setBalance(balance);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const calculateGridSize = (seed: string): number => {
    let sum = 0;
    for (let i = 0; i < seed.length; i++) {
      sum += seed.charCodeAt(i);
    }
    return (sum % 6) + 6; // This will give a number between 6 and 11 (inclusive)
  };

  useEffect(() => {
    if (turnCount >= turnLimit) {
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [turnCount, turnLimit]);

  // Initialize game with level-based seed
  useEffect(() => {
    const initializeGameWithLevelSeed = async () => {
      try {
        setTransactionStatus('Loading level...');
        
        // First, fetch all levels
        const levelData = await fetchLevels();
        
        // If wallet is connected, fetch game history to determine player's progress
        if (publicKey) {
          const gameEntries = await fetchGameTransactionHistory(publicKey);
          
          // Update level status based on history
          const updatedLevels = updateLevelStatus(levelData, gameEntries);
          
          // Get the next available level for the player
          const nextLevel = getNextAvailableLevel(updatedLevels);
          
          if (nextLevel) {
            console.log(`Loading level: ${nextLevel.name} with seed: ${nextLevel.seed}`);
            
            // Set the level seed
            setCurrentSeed(nextLevel.seed);
            
            // Calculate grid size based on seed
            const newGridSize = calculateGridSize(nextLevel.seed);
            setGridSize(newGridSize);
            
            // Generate board from seed
            const newBoard = generateBoardFromSeed(nextLevel.seed, newGridSize);
            setBoard(newBoard);
            setAnimationBoard(newBoard);
            
            // Reset game state
            setMatchCount(0);
            setTurnCount(0);
            setMoves([]);
            
            // Set turn limit (you might want to vary this by level)
            setTurnLimit(initialTurnLimit);
            
            setTransactionStatus(`Playing ${nextLevel.name}`);
          } else {
            // If all levels are completed, use the last level
            const lastLevel = updatedLevels[updatedLevels.length - 1];
            setCurrentSeed(lastLevel.seed);
            
            const newGridSize = calculateGridSize(lastLevel.seed);
            setGridSize(newGridSize);
            
            const newBoard = generateBoardFromSeed(lastLevel.seed, newGridSize);
            setBoard(newBoard);
            setAnimationBoard(newBoard);
            
            setTransactionStatus('All levels completed! Playing last level again.');
          }
        } else {
          // If wallet is not connected, use the first level
          if (levelData.length > 0) {
            const firstLevel = levelData[0];
            
            setCurrentSeed(firstLevel.seed);
            
            const newGridSize = calculateGridSize(firstLevel.seed);
            setGridSize(newGridSize);
            
            const newBoard = generateBoardFromSeed(firstLevel.seed, newGridSize);
            setBoard(newBoard);
            setAnimationBoard(newBoard);
            
            setTransactionStatus('Connect wallet to track your progress');
          } else {
            throw new Error('No levels available');
          }
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
        
        // Fallback to a default seed in case of error
        const fallbackSeed = '4fuPZXwNAqqco5VfkA2YwTNoQYou91sANwx84dpVsgJd7h56vmQoEWahv87sMr6C7ShS3WMpH9eGCdc4t16iLAoh';
        setCurrentSeed(fallbackSeed);
        
        const newGridSize = calculateGridSize(fallbackSeed);
        setGridSize(newGridSize);
        
        const newBoard = generateBoardFromSeed(fallbackSeed, newGridSize);
        setBoard(newBoard);
        setAnimationBoard(newBoard);
        
        setTransactionStatus('Error loading level. Using default.');
      } finally {
        // Additional cleanup or state resets if needed
      }
    };

    initializeGameWithLevelSeed();
  }, [publicKey, setCurrentSeed, setBoard, setAnimationBoard, setGridSize, setMatchCount, setTurnCount, setMoves, setTurnLimit, setTransactionStatus]);

  const generateSeedBoard = () => {
    const newGridSize = calculateGridSize(currentSeed);
    setGridSize(newGridSize);
    const newBoard = generateBoardFromSeed(currentSeed, newGridSize);
    setTransactionStatus('Idle');
    setBoard(newBoard);
    setAnimationBoard(newBoard);
    setMatchCount(0);
    setTurnCount(0);
    setMoves([]);
    setTurnLimit(initialTurnLimit);
  };

  const getReplacementIndices = (matchedIndex: number): number[] => {
    const previousIndex = matchedIndex - 1 < 0 ? candyImages.length - 1 : matchedIndex - 1;
    const nextIndex = (matchedIndex + 1) % candyImages.length;

    return [previousIndex, matchedIndex, nextIndex];
  };

  const replaceCandies = (mutableBoard: number[][], row: number, col: number, rowInc: number, colInc: number, len: number, matchedType: number) => {
    let indices = getReplacementIndices(matchedType);
    mutableBoard[row][col] = indices[0];
    for (let i = 1; i < len - 1; i++) {
      mutableBoard[row + i * rowInc][col + i * colInc] = indices[1];
    }
    mutableBoard[row + (len - 1) * rowInc][col + (len - 1) * colInc] = indices[2];

    // bonk card - update row/column
    if (matchedType === 2) {
      if (rowInc === 0) {
        for (let i = 0; i < gridSize; i++) {
          mutableBoard[row][i] = i;
        }
      } else {
        for (let i = 0; i < gridSize; i++) {
          mutableBoard[i][col] = i;
        }
      }
    } else if (matchedType === 6) {
      // Jito card - add one more turn
      setTurnLimit(prevLimit => prevLimit + 1);
    } else if (matchedType === 3) {
      // Fire card - burn all cards within one
      const burnRadius = 1;
      const startRow = Math.max(0, row - burnRadius);
      const endRow = Math.min(mutableBoard.length - 1, row + (len - 1) * rowInc + burnRadius);
      const startCol = Math.max(0, col - burnRadius);
      const endCol = Math.min(mutableBoard[0].length - 1, col + (len - 1) * colInc + burnRadius);
  
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (r >= 0 && r < mutableBoard.length && c >= 0 && c < mutableBoard[0].length) {
            mutableBoard[r][c] = c;
          }
        }
      }
    } else if (matchedType === 9) {
      // thunder card - update any touching t cards on match
      const updateSurrounding = (r: number, c: number, type: number) => {
        const directions = [
          [0, 1], [1, 0], [0, -1], [-1, 0], // horizontal and vertical
          [-1, -1], [-1, 1], [1, -1], [1, 1] // diagonals
        ];
        mutableBoard[r][c] = r;
  
        for (let [dr, dc] of directions) {
          const newRow = r + dr;
          const newCol = c + dc;
  
          if (
            newRow >= 0 && newRow < mutableBoard.length &&
            newCol >= 0 && newCol < mutableBoard[0].length &&
            mutableBoard[newRow][newCol] === type
          ) {
            updateSurrounding(newRow, newCol, type);
          }
        }
      };
  
      const startRow = Math.max(0, row - 1);
      const endRow = Math.min(mutableBoard.length - 1, row + 1);
      const startCol = Math.max(0, col - 1);
      const endCol = Math.min(mutableBoard[0].length - 1, col + len + 1);
  
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (
            r >= 0 && r < mutableBoard.length &&
            c >= 0 && c < mutableBoard[0].length &&
            mutableBoard[r][c] === 9
          ) {
            updateSurrounding(r, c, 9);
          }
        }
      }
    } else if (matchedType === 12) {
      // Water card - update water cards below match
      const updateBelow = (startRow: number, col: number, type: number) => {
        for (let r = startRow; r < mutableBoard.length; r++) {
          if (mutableBoard[r][col] === type) {
            mutableBoard[r][col] = r;
          }
        }
      };
  
      if (rowInc === 0) {
        for (let c = col; c < col + len; c++) {
          updateBelow(row + 1, c, 12);
        }
      } else if (colInc === 0) {
        updateBelow(row + len, col, 12);
      }
    } else if (matchedType === 0) {
      // Air card - update air cards above match
      const updateAbove = (endRow: number, col: number, type: number) => {
        for (let r = endRow; r >= 0; r--) {
          if (mutableBoard[r][col] === type) {
            mutableBoard[r][col] = r; 
          }
        }
      };
    
      if (rowInc === 0) {
        for (let c = col; c < col + len; c++) {
          updateAbove(row - 1, c, 0);
        }
      } else if (colInc === 0) {
        updateAbove(row - 1, col, 0);
      }
    }
  };

  const detectAndReplaceMatches = (newBoard: number[][]) => {
    let matches = 0;
    let affectedTiles: { row: number, col: number }[] = [];
  
    const matchAndReplace = (row: number, col: number, rowInc: number, colInc: number, len: number) => {
      let baseValue = newBoard[row][col];
      let replace = false;
  
      for (let i = 1; i < len; i++) {
        if (newBoard[row + i * rowInc][col + i * colInc] !== baseValue) {
          replace = false;
          break;
        }
        replace = true;
      }
  
      if (replace) {
        matches += len;
  
        for (let i = 0; i < len; i++) {
          affectedTiles.push({ row: row + i * rowInc, col: col + i * colInc });
        }
  
        const mutableBoard = deepCopyBoard(newBoard);
        replaceCandies(mutableBoard, row, col, rowInc, colInc, len, baseValue);
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (mutableBoard[i][j] !== newBoard[i][j]) {
              affectedTiles.push({ row: i, col: j });
            }
          }
        }
        newBoard = mutableBoard;
      }
  
      return replace;
    };
  
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        for (let len = gridSize; len >= 3; len--) {
          if (col + len <= gridSize && matchAndReplace(row, col, 0, 1, len)) break;
          if (row + len <= gridSize && matchAndReplace(row, col, 1, 0, len)) break;
        }
      }
    }
  
    if (affectedTiles.length > 0) {
      setAnimationBoard(prevAnimationBoard => {
        const updatedAnimationBoard = deepCopyBoard(prevAnimationBoard);
        affectedTiles.forEach(({ row, col }) => {
          updatedAnimationBoard[row][col] = matchGifIndex;
        });
        return updatedAnimationBoard;
      });
  
      affectedTiles.forEach(({ row, col }) => {
        const baseValue = newBoard[row][col];
        if (baseValue === 0) {
          playSoundEffect(activateSound);
        } else {
          playSoundEffect(activateSound);
        }
      });
  
      setTimeout(() => {
        setBoard(newBoard);
        setAnimationBoard(newBoard);
      }, 420);
    } else {
      setBoard(newBoard);
      setAnimationBoard(newBoard);
    }
  
    return {
      matches: matches
    };
  };
  
  const handleTilePress = (rowIndex: number, colIndex: number) => {
    if (turnCount >= turnLimit) {
      console.log("Turn limit reached. No more moves allowed.");
      return;
    }
    playSoundEffect(swapSound);
  
    const recordMove = (startTile: { row: number, col: number }, direction: string) => {
      const colLetter = String.fromCharCode(97 + startTile.col);
      const move = `${colLetter}${startTile.row + 1}${direction}`;
      setMoves(prevMoves => {
        const updatedMoves = [...prevMoves, move];
        console.log(updatedMoves);
        return updatedMoves;
      });
    };
  
    if (selectedTile) {
      const rowDiff = Math.abs(rowIndex - selectedTile.row);
      const colDiff = Math.abs(colIndex - selectedTile.col);
  
      const isAdjacentHorizontally = (rowDiff === 0 && colDiff === 1);
      const isAdjacentVertically = (colDiff === 0 && rowDiff === 1);
  
      if (isAdjacentHorizontally || isAdjacentVertically) {
        const newBoard = deepCopyBoard(board);
        const temp = newBoard[rowIndex][colIndex];
        newBoard[rowIndex][colIndex] = newBoard[selectedTile.row][selectedTile.col];
        newBoard[selectedTile.row][selectedTile.col] = temp;
  
        setBoard(newBoard);
        setAnimationBoard(newBoard);
        playSoundEffect(clickSound);
  
        if (isAdjacentHorizontally) {
          if (colIndex > selectedTile.col) {
            recordMove(selectedTile, 'r');
          } else {
            recordMove(selectedTile, 'l');
          }
        } else if (isAdjacentVertically) {
          if (rowIndex > selectedTile.row) {
            recordMove(selectedTile, 's');
          } else {
            recordMove(selectedTile, 'n');
          }
        }
  
        setTimeout(() => {
          const matchesFound = detectAndReplaceMatches(newBoard);
          const matchCount = matchesFound.matches;
  
          if (matchCount > 0) {
            setMatchCount(prevCount => prevCount + matchCount);
          }
  
          setTurnCount(prevTurnCount => prevTurnCount + 1);
        }, 8);
      }
  
      setSelectedTile(null);
    } else {
      setSelectedTile({ row: rowIndex, col: colIndex });
    }
  };  

  const entrySubmit = async () => {
    //ATA for SONIC account of the SoniCiry4Ms7uVAMkPDx9Zdy8RK8cXHLsji7gVZRqtr wallet key
    const receiver = new PublicKey("SoniCiry4Ms7uVAMkPDx9Zdy8RK8cXHLsji7gVZRqtr");
    const memoContent = `${matchCount}|${currentSeed}|${moves.join("|")}`;
    console.log(memoContent);
  
    if (!publicKey) {
      console.error("Public key is null");
      return;
    }
  
    if (!signTransaction) {
      console.error("signTransaction function is undefined");
      return;
    }
  
    try {
      setTransactionStatus('Creating transaction...');
      setTransactionProcessing(true);
      const txid = await createSonicTx(
        receiver.toString(),
        publicKey,
        memoContent,
        signTransaction,
        connection
      );
  
      console.log("Transaction ID:", txid);
      setSignature(txid);
      setTransactionStatus('Transaction created. Waiting for confirmation...');
  
      const SONIC_URL = "https://rpc.mainnet-alpha.sonic.game";
  
      async function getTransactionStatus(txid: string): Promise<any> {
        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [txid, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]
        };
  
        try {
          const response = await fetch(SONIC_URL, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          return data.result;
        } catch (error) {
          console.error("Error:", error);
          throw new Error("Cannot get transaction status!");
        }
      }
  
      let status;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        setTransactionStatus(`Checking transaction status... (attempt ${i + 1})`);
        status = await getTransactionStatus(txid);
        console.log(status);
        if (status) {
          setTransactionStatus(`TX confirmed! Explorer link: <a href="https://explorer.sonic.game/tx/${txid}" target="_blank" rel="noopener noreferrer"> TX Link</a>`);
          setTransactionProcessing(false);
          break;
        }
      }
  
      if (!status) {
        setTransactionStatus('Transaction not confirmed after multiple attempts.');
        setTransactionProcessing(false);
      }
    } catch (error) {
      console.error("Error submitting entry:", error);
      setTransactionStatus('Error submitting transaction.');
      setTransactionProcessing(false);
    }
  };

  const toggleSoundEffects = () => {
    setSoundEffectsEnabled(!soundEffectsEnabled);
  };

  const boardSize = animationBoard.length;
  const gameBoardStyle: CSSProperties = {
    '--board-size': boardSize,
  } as React.CSSProperties;

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="status-container">
          <div className="status-items">
            <div className={`status-item ${animateTurn ? 'animate-change' : ''}`}>
              Turn: {turnCount}/{turnLimit}
            </div>
            <div className={`status-item ${animatePoints ? 'animate-change' : ''}`}>
              Points: {matchCount}
            </div>
          </div>
          <div className="sound-control-container">
            <button className="sound-button" onClick={toggleSoundEffects}>
              <img 
                src={soundEffectsEnabled ? soundOnIcon : soundOffIcon} 
                alt="Sound Effects" 
                className="sound-icon" 
              />
            </button>
          </div>
        </div>
      </header>
      <div className="game-board" style={gameBoardStyle}>
        {animationBoard.map((row, rowIndex) => (
          row.map((candyIndex, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleTilePress(rowIndex, colIndex)}
              className={`game-tile ${
                selectedTile &&
                selectedTile.row === rowIndex &&
                selectedTile.col === colIndex
                  ? "selected-tile"
                  : ""
              }`}
            >
              <img
                src={candyIndex === matchGifIndex ? candyGifs[board[rowIndex][colIndex]] : candyImages[candyIndex]}
                alt={`Candy ${candyIndex}`}
              />
            </button>
          ))
        ))}
      </div>
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded">
          You can now submit!
        </div>
      )}
      <footer className="game-footer">
        <div className="footer-container">
          <div className="button-container-bonk">
            <button
              onClick={generateSeedBoard}
              className="btn-large button-primary"
            >
              Reset
            </button>
            <button
              onClick={entrySubmit}
              className="btn-large button-primary"
              disabled={turnCount < turnLimit}
            >
              Submit
            </button>
          </div>
        </div>
      </footer>
      <div className="text-white mb-4" dangerouslySetInnerHTML={{ __html: transactionStatus }}></div>
      {transactionProcessing && (
        <div className="flex justify-center items-center">
          <img src={"assets/load.gif"} alt="Loading..." />
        </div>
      )}
    </div>
  );
}