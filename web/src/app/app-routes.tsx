import { useRoutes } from 'react-router-dom';
import { HomeScreen } from './HomeScreen';
import { HowToPlay } from './HowToPlay';
import { SonicGameScreen } from './SonicGameScreen';
import { PlayerHistory } from './PlayerHistory';
import { GlobalLeaderboard } from './GlobalLeaderboard';

export function AppRoutes() {
  return useRoutes([
    { index: true, element: <HomeScreen /> },
    { path: '/home', element: <HomeScreen /> },
    { path: '/how-to-play', element: <HowToPlay />},
    { path: '/sonicgame', element: <SonicGameScreen /> },
    { path: '/history', element: <PlayerHistory /> },
    { path: '/leaderboard', element: <GlobalLeaderboard /> }
  ]);
}