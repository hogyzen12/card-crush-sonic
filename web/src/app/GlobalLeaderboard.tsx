import React, { useEffect, useState } from 'react';
import { fetchGlobalGameHistory, GameEntry } from './utils/globalTransactionHistory';
import { fetchLevels, Level } from './utils/levelManager';

interface LevelStats {
  levelId: number;
  levelName: string;
  playersCompleted: number;
  averageScore: number;
  highScore: number;
  highScorePlayer: string;
  highScoreDate: string;
  totalPlays: number;
}

export function GlobalLeaderboard() {
  const [gameEntries, setGameEntries] = useState<GameEntry[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [topPlayers, setTopPlayers] = useState<{wallet: string, score: number, levels: number}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load levels first
        const levelData = await fetchLevels();
        setLevels(levelData);

        // Fetch global game history
        const entryWallet = "2mpJfLLawViCFPTjFT3txHM97ssX2U3bqFTCjhsnajrJ";
        const entries = await fetchGlobalGameHistory(entryWallet);
        setGameEntries(entries);
        
        // Calculate global statistics
        calculateGlobalStats(entries, levelData);
        
      } catch (err) {
        console.error('Failed to load global data:', err);
        setError('Failed to load global leaderboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateGlobalStats = (entries: GameEntry[], levelData: Level[]) => {
    // Track unique players
    const uniquePlayers = new Set<string>();
    setTotalGames(entries.length);

    // Group entries by level
    const entriesByLevel: Record<string, GameEntry[]> = {};
    const playerScores: Record<string, {totalScore: number, levelsCompleted: number}> = {};
    
    // Initialize level statistics with all known levels
    const initialLevelStats: Record<string, LevelStats> = {};
    levelData.forEach(level => {
      initialLevelStats[level.seed] = {
        levelId: level.id,
        levelName: level.name,
        playersCompleted: 0,
        averageScore: 0,
        highScore: 0,
        highScorePlayer: '',
        highScoreDate: '',
        totalPlays: 0
      };
    });

    // Create a set of known level seeds for filtering
    const knownLevelSeeds = new Set(levelData.map(level => level.seed));

    // Process all entries
    entries.forEach(entry => {
      // Track unique players
      uniquePlayers.add(entry.wallet || 'unknown');

      // Track player scores (include all entries for player stats)
      if (entry.wallet) {
        if (!playerScores[entry.wallet]) {
          playerScores[entry.wallet] = {totalScore: 0, levelsCompleted: 0};
        }
        playerScores[entry.wallet].totalScore += entry.score;
        playerScores[entry.wallet].levelsCompleted += 1;
      }

      // Only group entries for known levels
      if (knownLevelSeeds.has(entry.seed)) {
        if (!entriesByLevel[entry.seed]) {
          entriesByLevel[entry.seed] = [];
        }
        entriesByLevel[entry.seed].push(entry);
      }
    });

    // Calculate statistics for known levels only
    const stats: LevelStats[] = Object.keys(entriesByLevel).map(seed => {
      const levelEntries = entriesByLevel[seed];
      const levelInfo = levelData.find(l => l.seed === seed)!; // We know this exists due to filtering
      
      // Calculate total and average scores
      const totalScore = levelEntries.reduce((sum, entry) => sum + entry.score, 0);
      const averageScore = levelEntries.length > 0 ? totalScore / levelEntries.length : 0;
      
      // Find high score
      const highScoreEntry = levelEntries.reduce((highest, entry) => 
        (entry.score > highest.score) ? entry : highest, 
        levelEntries[0]
      );

      // Count unique players for this level
      const uniqueLevelPlayers = new Set(levelEntries.map(entry => entry.wallet || 'unknown'));
      
      return {
        levelId: levelInfo.id,
        levelName: levelInfo.name,
        playersCompleted: uniqueLevelPlayers.size,
        averageScore: averageScore,
        highScore: highScoreEntry ? highScoreEntry.score : 0,
        highScorePlayer: highScoreEntry ? (highScoreEntry.wallet || 'unknown') : '',
        highScoreDate: highScoreEntry ? highScoreEntry.date : '',
        totalPlays: levelEntries.length
      };
    });

    // Sort level stats by level ID
    stats.sort((a, b) => a.levelId - b.levelId);

    // Calculate top players (using all entries, including unknown levels)
    const topPlayersList = Object.entries(playerScores)
      .map(([wallet, data]) => ({
        wallet, 
        score: data.totalScore,
        levels: data.levelsCompleted
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLevelStats(stats);
    setTopPlayers(topPlayersList);
    setTotalPlayers(uniquePlayers.size);
  };

  // Truncate wallet addresses for display
  const truncateWallet = (address: string) => {
    if (!address || address === 'unknown') return 'Unknown';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Generate a explorer link for a wallet address
  const getExplorerWalletLink = (wallet: string) => {
    if (!wallet || wallet === 'unknown') return '#';
    return `https://explorer.sonic.game/address/${wallet}`;
  };

  return (
    <div className="player-history-container">
      <h1 className="text-xl font-bold text-center mb-3">Global Leaderboard</h1>

      {isLoading ? (
        <div className="text-center py-8">
          <img src="assets/load.gif" alt="Loading..." className="mx-auto" />
          <p className="mt-4">Loading global stats...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Global Stats Summary as a Table */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Game Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs">Statistic</th>
                    <th className="py-2 px-3 text-left text-xs">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-700">
                    <td className="py-2 px-3 text-sm font-medium">Total Players</td>
                    <td className="py-2 px-3 text-sm">{totalPlayers}</td>
                  </tr>
                  <tr className="border-t border-gray-700">
                    <td className="py-2 px-3 text-sm font-medium">Total Games Played</td>
                    <td className="py-2 px-3 text-sm">{totalGames}</td>
                  </tr>
                  <tr className="border-t border-gray-700">
                    <td className="py-2 px-3 text-sm font-medium">Avg. Games Per Player</td>
                    <td className="py-2 px-3 text-sm">{totalPlayers > 0 ? (totalGames / totalPlayers).toFixed(1) : '0'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Players */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Top Players</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs">Rank</th>
                    <th className="py-2 px-3 text-left text-xs">Player</th>
                    <th className="py-2 px-3 text-left text-xs">Total Score</th>
                    <th className="py-2 px-3 text-left text-xs">Levels Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((player, index) => (
                    <tr key={player.wallet} className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="py-2 px-3 text-sm font-medium">#{index + 1}</td>
                      <td className="py-2 px-3 text-sm">
                        <a 
                          href={getExplorerWalletLink(player.wallet)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {truncateWallet(player.wallet)}
                        </a>
                      </td>
                      <td className="py-2 px-3 text-sm font-medium">{player.score.toLocaleString()}</td>
                      <td className="py-2 px-3 text-sm">{player.levels}</td>
                    </tr>
                  ))}
                  {topPlayers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">No player data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Level Statistics - Only Known Levels */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Level Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs">Level</th>
                    <th className="py-2 px-3 text-left text-xs">Players</th>
                    <th className="py-2 px-3 text-left text-xs">Total Plays</th>
                    <th className="py-2 px-3 text-left text-xs">Avg. Score</th>
                    <th className="py-2 px-3 text-left text-xs">High Score</th>
                    <th className="py-2 px-3 text-left text-xs">High Score Player</th>
                  </tr>
                </thead>
                <tbody>
                  {levelStats.map((stat) => (
                    <tr key={stat.levelId} className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="py-2 px-3 text-sm font-medium">{stat.levelName}</td>
                      <td className="py-2 px-3 text-sm">{stat.playersCompleted}</td>
                      <td className="py-2 px-3 text-sm">{stat.totalPlays}</td>
                      <td className="py-2 px-3 text-sm">{stat.averageScore.toFixed(1)}</td>
                      <td className="py-2 px-3 text-sm font-medium">{stat.highScore}</td>
                      <td className="py-2 px-3 text-sm">
                        {stat.highScorePlayer !== 'unknown' ? (
                          <a 
                            href={getExplorerWalletLink(stat.highScorePlayer)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {truncateWallet(stat.highScorePlayer)}
                          </a>
                        ) : (
                          'Unknown'
                        )}
                      </td>
                    </tr>
                  ))}
                  {levelStats.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400">No level statistics available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GlobalLeaderboard;