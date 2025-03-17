// A utility to manage the current level between components

import { atom } from "recoil";
import { Level, getNextAvailableLevel, fetchLevels, updateLevelStatus } from "./levelManager";
import { fetchGameTransactionHistory } from "./transactionHistory";

// Recoil atom to store the current level data
export const currentLevelState = atom<Level | null>({
  key: 'currentLevelState',
  default: null,
});

// Function to determine the next level for a player
export const loadNextLevel = async (publicKey: any): Promise<Level | null> => {
  try {
    // Get all levels
    const allLevels = await fetchLevels();
    
    if (!publicKey || allLevels.length === 0) {
      // If no wallet connected or no levels, return the first level
      return allLevels.length > 0 ? allLevels[0] : null;
    }
    
    // Get player's game history
    const gameEntries = await fetchGameTransactionHistory(publicKey);
    
    // Update level status based on history
    const updatedLevels = updateLevelStatus(allLevels, gameEntries);
    
    // Get the next available level
    const nextLevel = getNextAvailableLevel(updatedLevels);
    
    // Store this level
    if (nextLevel) {
      setCurrentLevel(nextLevel);
    }
    
    return nextLevel;
  } catch (error) {
    console.error('Error loading next level:', error);
    return null;
  }
};

// Local storage key for saving the level between page refreshes
const CURRENT_LEVEL_KEY = 'card_crush_current_level';

// Store the current level in local storage
export const setCurrentLevel = (level: Level): void => {
  try {
    localStorage.setItem(CURRENT_LEVEL_KEY, JSON.stringify(level));
  } catch (error) {
    console.error('Failed to save current level to localStorage', error);
  }
};

// Retrieve the current level from local storage
export const getCurrentLevel = (): Level | null => {
  try {
    const storedLevel = localStorage.getItem(CURRENT_LEVEL_KEY);
    return storedLevel ? JSON.parse(storedLevel) : null;
  } catch (error) {
    console.error('Failed to retrieve current level from localStorage', error);
    return null;
  }
};

// Clear the stored level
export const clearCurrentLevel = (): void => {
  try {
    localStorage.removeItem(CURRENT_LEVEL_KEY);
  } catch (error) {
    console.error('Failed to clear current level from localStorage', error);
  }
};