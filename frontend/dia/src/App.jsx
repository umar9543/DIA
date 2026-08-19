import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Builder from './pages/Builder';
import DashboardView from './pages/DashboardView';
import Auth from './pages/Auth';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="/view" element={<DashboardView />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  );
}

export default App;
