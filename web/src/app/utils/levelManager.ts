import { GameEntry } from './transactionHistory';

export interface Level {
  id: number;
  seed: string;
  reward: number;
  name: string;
  description: string;
  completed: boolean;
  unlocked: boolean;
  signature?: string;
  score?: number;
  date?: string;
}

// Parse the levels.txt content into a structured array
export const parseLevelsFromText = (levelsText: string): Level[] => {
  const seeds = levelsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Calculate reward distribution - total of 42 SONIC across all levels
  // Using an exponential increase formula
  const totalReward = 42;
  const levelCount = seeds.length;
  
  // Calculate the sum of exponential values for normalization
  const base = 1.15; // Adjust this to control how fast rewards grow
  let expSum = 0;
  for (let i = 0; i < levelCount; i++) {
    expSum += Math.pow(base, i);
  }
  
  // Scale factor to make sure all rewards sum to totalReward
  const scaleFactor = totalReward / expSum;
  
  return seeds.map((seed, index) => {
    // Calculate reward using exponential growth
    const levelReward = parseFloat((Math.pow(base, index) * scaleFactor).toFixed(2));
    
    return {
      id: index + 1,
      seed,
      reward: levelReward,
      name: `Level ${index + 1}`,
      description: `Complete the puzzle using seed #${index + 1}`,
      completed: false,
      unlocked: index === 0 // Only first level is unlocked initially
    };
  });
};

// Load levels from levels.txt
export const fetchLevels = async (): Promise<Level[]> => {
  try {
    const response = await fetch('/assets/levels.txt');
    if (!response.ok) {
      throw new Error(`Failed to fetch levels.txt: ${response.statusText}`);
    }
    const text = await response.text();
    return parseLevelsFromText(text);
  } catch (error) {
    console.error('Error loading levels:', error);
    return [];
  }
};

// Update level status based on game history
export const updateLevelStatus = (levels: Level[], gameEntries: GameEntry[]): Level[] => {
  const updatedLevels = [...levels];
  
  // Create a map of seeds to game entries for quick lookup
  const entriesBySeed: Record<string, GameEntry[]> = {};
  gameEntries.forEach(entry => {
    if (!entriesBySeed[entry.seed]) {
      entriesBySeed[entry.seed] = [];
    }
    entriesBySeed[entry.seed].push(entry);
  });
  
  // Track the highest completed level
  let highestCompletedLevel = -1;
  
  // Update each level's status
  updatedLevels.forEach((level, index) => {
    const entriesForLevel = entriesBySeed[level.seed] || [];
    
    if (entriesForLevel.length > 0) {
      // Level is completed
      level.completed = true;
      highestCompletedLevel = Math.max(highestCompletedLevel, index);
      
      // Find the best score entry for this level
      const bestEntry = entriesForLevel.reduce((best, current) => {
        return best.score >= current.score ? best : current;
      }, entriesForLevel[0]);
      
      // Store the best score and signature
      level.score = bestEntry.score;
      level.signature = bestEntry.signature;
      level.date = bestEntry.date;
    }
  });
  
  // Unlock levels based on completion status
  updatedLevels.forEach((level, index) => {
    // A level is unlocked if it's the first level or if the previous level is completed
    level.unlocked = index === 0 || (index <= highestCompletedLevel + 1);
  });
  
  return updatedLevels;
};

// Calculate total earned rewards from completed levels
export const calculateTotalRewards = (levels: Level[]): number => {
  return levels
    .filter(level => level.completed)
    .reduce((sum, level) => sum + level.reward, 0);
};

// Get the next available level for the player
export const getNextAvailableLevel = (levels: Level[]): Level | null => {
  // Find the first unlocked but not completed level
  const nextLevel = levels.find(level => level.unlocked && !level.completed);
  
  if (nextLevel) {
    return nextLevel;
  }
  
  // If all unlocked levels are completed, return the highest level
  // This allows players to keep playing the last level
  return levels.length > 0 ? levels[levels.length - 1] : null;
};

// Prepare level data including completion percentage
export const prepareLevelData = (levels: Level[]) => {
  const totalLevels = levels.length;
  const completedLevels = levels.filter(level => level.completed).length;
  const completionPercentage = totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0;
  const totalRewards = calculateTotalRewards(levels);
  
  return {
    levels,
    totalLevels,
    completedLevels,
    completionPercentage,
    totalRewards
  };
};