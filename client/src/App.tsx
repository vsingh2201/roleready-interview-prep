import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Processing from './pages/Processing';
import Results from './pages/Results';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/processing/:analysisId" element={<Processing />} />
        <Route path="/results/:analysisId" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}
