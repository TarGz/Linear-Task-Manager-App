import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import BurgerMenu from './components/BurgerMenu';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TodosPage from './pages/TodosPage';
import TaskDetailPage from './pages/TaskDetailPage';
import SettingsPage from './pages/SettingsPage';
import UpdatePrompt from './components/UpdatePrompt';
import linearApi from './services/linearApi';
import './App.css';

function App() {
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = linearApi.getApiKey();
      setIsApiKeySet(!!apiKey);
      setIsLoading(false);
    };

    checkApiKey();
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const basename = process.env.NODE_ENV === 'production' ? '/Linear-Task-Manager-App' : '';

  return (
    <Router basename={basename}>
      <div className="app">
        <UpdatePrompt />

        {/* Burger Menu Button - only show when API key is set */}
        {isApiKeySet && (
          <button
            className="burger-menu-button"
            onClick={() => setIsBurgerMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        )}

        {/* Burger Menu */}
        {isApiKeySet && (
          <BurgerMenu
            isOpen={isBurgerMenuOpen}
            onClose={() => setIsBurgerMenuOpen(false)}
          />
        )}

        <div className="app-content">
          <Routes>
            <Route
              path="/"
              element={
                isApiKeySet ?
                <HomePage /> :
                <Navigate to="/settings" replace />
              }
            />
            <Route
              path="/projects"
              element={
                isApiKeySet ?
                <ProjectsPage /> :
                <Navigate to="/settings" replace />
              }
            />
            <Route path="/project/:id" element={<ProjectDetailPage />} />
            <Route path="/task/:id" element={<TaskDetailPage />} />
            <Route
              path="/todos"
              element={
                isApiKeySet ?
                <TodosPage /> :
                <Navigate to="/settings" replace />
              }
            />
            <Route
              path="/settings"
              element={<SettingsPage onApiKeyChange={setIsApiKeySet} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;