import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar      from './components/Navbar';
import HomePage    from './pages/HomePage';
import MapPage     from './pages/MapPage';
import FeaturesPage from './pages/FeaturesPage';
import ListSpacePage from './pages/ListSpacePage';
import MyPlacesPage  from './pages/MyPlacesPage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<HomePage />} />
        <Route path="/map"      element={<MapPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/list"     element={<ProtectedRoute><ListSpacePage /></ProtectedRoute>} />
        <Route path="/places"   element={<ProtectedRoute><MyPlacesPage /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
