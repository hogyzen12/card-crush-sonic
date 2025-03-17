export const getRandomSeed = async (): Promise<string> => {
    try {
      const response = await fetch('/assets/levels.txt');
      if (!response.ok) {
        throw new Error(`Failed to fetch levels.txt: ${response.statusText}`);
      }
      const text = await response.text();
      const seeds = text.split('\n').filter(line => line.trim() !== '');
      if (seeds.length === 0) {
        throw new Error('No valid seeds found in levels.txt');
      }
      const randomIndex = Math.floor(Math.random() * seeds.length);
      return seeds[randomIndex];
    } catch (error) {
      console.error('Error in getRandomSeed:', error);
      // Fallback to a default seed
      return '4fuPZXwNAqqco5VfkA2YwTNoQYou91sANwx84dpVsgJd7h56vmQoEWahv87sMr6C7ShS3WMpH9eGCdc4t16iLAoh';
    }
  };