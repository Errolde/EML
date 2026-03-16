import { useState } from 'react';
import { AppProvider, useApp } from './context';
import { Navbar } from './components/Navbar';
import { Toast } from './components/ui/Toast';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { StandingsPage } from './pages/StandingsPage';
import { MatchdaysPage } from './pages/MatchdaysPage';
import { PlayersPage } from './pages/PlayersPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { NewsPage } from './pages/NewsPage';
import { AwardsPage } from './pages/AwardsPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

function Inner() {
  const { currentUser } = useApp();
  const [page, setPage] = useState('home');

  const isChat = page === 'chat';

  function renderPage() {
    if (page.startsWith('team_')) {
      const teamId = page.replace('team_', '');
      return <TeamDetailPage teamId={teamId} setPage={setPage} />;
    }
    if (page.startsWith('profile_')) {
      const userId = page.replace('profile_', '');
      return <ProfilePage userId={userId} setPage={setPage} />;
    }

    switch (page) {
      case 'home': return <HomePage setPage={setPage} currentUser={currentUser} />;
      case 'login': return <LoginPage setPage={setPage} />;
      case 'standings': return currentUser ? <StandingsPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'knockout': return currentUser ? <StandingsPage setPage={setPage} initialTab="knockout" /> : <LoginPage setPage={setPage} />;
      case 'matchdays': return currentUser ? <MatchdaysPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'players': return currentUser ? <PlayersPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'teams': return currentUser ? <TeamsPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'news': return currentUser ? <NewsPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'awards': return currentUser ? <AwardsPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'chat': return currentUser ? <ChatPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'profile': return currentUser ? <ProfilePage userId={currentUser.id} setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'settings': return currentUser ? <SettingsPage setPage={setPage} /> : <LoginPage setPage={setPage} />;
      case 'admin': return currentUser?.role === 'admin' ? <AdminPage setPage={setPage} /> : <HomePage setPage={setPage} currentUser={currentUser} />;
      default: return <HomePage setPage={setPage} currentUser={currentUser} />;
    }
  }

  const isGuest = !currentUser;
  const isLoginPage = page === 'login';
  const showNav = !isGuest && !isLoginPage;

  return (
    <div className="min-h-screen bg-[#070d17]">
      {showNav && <Navbar currentPage={page} setPage={setPage} />}
      <main className={showNav ? 'pt-14 sm:pt-16' : ''}>
        {isChat && showNav ? (
          <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
            {renderPage()}
          </div>
        ) : showNav ? (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {renderPage()}
          </div>
        ) : (
          renderPage()
        )}
      </main>
      <Toast />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  );
}
