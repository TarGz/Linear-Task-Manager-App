import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TodosPage from './pages/TodosPage';
import SettingsPage from './pages/SettingsPage';
import linearApi from './services/linearApi';
import './App.css';

function App() {
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <Router basename="/Linear-Task-Manager-App">
      <div className="app">
        <div className="app-content">
          <Routes>
            <Route 
              path="/" 
              element={
                isApiKeySet ? 
                <ProjectsPage /> : 
                <Navigate to="/settings" replace />
              } 
            />
            <Route path="/project/:id" element={<ProjectDetailPage />} />
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
        {isApiKeySet && <BottomNav />}
      </div>
    </Router>
  );
}

export default App;