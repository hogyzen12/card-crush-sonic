import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { fetchGameTransactionHistory, GameEntry } from './utils/transactionHistory';
import { 
  fetchLevels, 
  updateLevelStatus, 
  prepareLevelData, 
  Level,
  getNextAvailableLevel
} from './utils/levelManager';
import { setCurrentLevel } from './utils/currentLevel';

export function PlayerHistory() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const [gameEntries, setGameEntries] = useState<GameEntry[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [nextLevel, setNextLevel] = useState<Level | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load levels first
        const levelData = await fetchLevels();
        setLevels(levelData);

        // If wallet is connected, fetch game history
        if (publicKey) {
          const entries = await fetchGameTransactionHistory(publicKey);
          setGameEntries(entries);

          // Update level status based on game history
          const updatedLevels = updateLevelStatus(levelData, entries);
          setLevels(updatedLevels);

          // Calculate total rewards
          const { totalRewards } = prepareLevelData(updatedLevels);
          setTotalRewards(totalRewards);
          
          // Get next level for the player
          setNextLevel(getNextAvailableLevel(updatedLevels));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load your game progress. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [publicKey]);

  const toggleExpandLevel = (levelId: number) => {
    if (expandedLevel === levelId) {
      setExpandedLevel(null);
    } else {
      setExpandedLevel(levelId);
    }
  };

  // Truncate long strings
  const truncate = (str: string, length = 8) => {
    if (!str || str.length <= length) return str;
    return `${str.substring(0, length)}...`;
  };

  // Generate a explorer link for a signature
  const getExplorerLink = (signature: string) => {
    return `https://explorer.sonic.game/tx/${signature}`;
  };
  
  // Handle navigation to the game with the next level seed
  const handlePlayLevel = (level?: Level) => {
    // If a specific level is provided, use it; otherwise use nextLevel
    const levelToPlay = level || nextLevel;
    
    if (levelToPlay) {
      // You can optionally set the current level in some storage mechanism
      // before navigating if you need to pass level info
      navigate('/sonicgame');
    }
  };

  return (
    <div className="player-history-container">
      <h1 className="text-xl font-bold text-center mb-3">Game History</h1>

      {!publicKey ? (
        <div className="text-center py-8">
          <p className="text-lg">Connect your wallet to view your game progress</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <img src="assets/load.gif" alt="Loading..." className="mx-auto" />
          <p className="mt-4">Loading your game progress...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      ) : levels.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg">No levels available.</p>
        </div>
      ) : (
        <>
          {/* Simplified Information Bar */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <div className="text-sm text-gray-400">Total Rewards Earned</div>
                <div className="text-xl font-bold">
                  {totalRewards.toFixed(2)} / 42.00 SONIC
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <div className="text-sm text-gray-400">Completed Levels</div>
                <div className="text-xl font-bold">
                  {levels.filter(level => level.completed).length} / {levels.length}
                </div>
              </div>
              
              <div>
                <button
                  onClick={() => handlePlayLevel()}
                  disabled={!nextLevel}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nextLevel ? `Play ${nextLevel.name}` : 'All Levels Completed'}
                </button>
              </div>
            </div>
          </div>

          {/* Simplified Level Progress Table */}
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs">Level</th>
                    <th className="py-2 px-3 text-left text-xs">Status</th>
                    <th className="py-2 px-3 text-left text-xs">Reward</th>
                    <th className="py-2 px-3 text-left text-xs">Best Score</th>
                    <th className="py-2 px-3 text-left text-xs">Date Completed</th>
                    <th className="py-2 px-3 text-left text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((level) => (
                    <React.Fragment key={level.id}>
                      <tr 
                        className={`border-t border-gray-700 hover:bg-gray-700 ${expandedLevel === level.id ? 'bg-gray-700' : ''}`}
                      >
                        <td className="py-2 px-3 text-sm font-medium">{level.name}</td>
                        <td className="py-2 px-3">
                          <span 
                            className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              level.completed 
                                ? 'bg-green-500 text-white' 
                                : level.unlocked 
                                  ? 'bg-yellow-400 text-black' 
                                  : 'bg-gray-600 text-gray-300'
                            }`}
                          >
                            {level.completed ? 'Completed' : level.unlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="text-sm">{level.reward.toFixed(2)}</span>
                            <img src="/assets/snclgo.svg" alt="SONIC" className="w-3 h-3 ml-1" />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-sm">{level.score || '-'}</td>
                        <td className="py-2 px-3 text-sm">{level.date || '-'}</td>
                        <td className="py-2 px-3">
                          {level.completed ? (
                            <button 
                              onClick={() => toggleExpandLevel(level.id)}
                              className="text-blue-400 hover:underline text-xs"
                            >
                              {expandedLevel === level.id ? 'Hide Details' : 'View Details'}
                            </button>
                          ) : level.unlocked ? (
                            <button 
                              onClick={() => handlePlayLevel(level)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-3 py-1 rounded text-xs"
                            >
                              Play Now
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs">Locked</span>
                          )}
                        </td>
                      </tr>
                      {expandedLevel === level.id && level.completed && (
                        <tr className="bg-gray-700 border-t border-gray-600">
                          <td colSpan={6} className="py-3 px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-400 mb-1">Level Seed</h4>
                                <div className="bg-gray-800 p-1.5 rounded font-mono text-xs overflow-x-auto whitespace-nowrap">
                                  {level.seed}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-400 mb-1">Transaction</h4>
                                {level.signature ? (
                                  <a 
                                    href={getExplorerLink(level.signature)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline text-xs"
                                  >
                                    {truncate(level.signature, 32)}
                                  </a>
                                ) : (
                                  <span className="text-gray-500 text-xs">Not available</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerHistory;