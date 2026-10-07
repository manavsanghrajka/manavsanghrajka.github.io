import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Blog from './pages/Blog';

// Archived pages
import Projects from './archive/Projects';
import Cv from './archive/Cv';
import DoTheyLikeMe from './archive/DoTheyLikeMe';
import AreYouCompatible from './archive/AreYouCompatible';
import SongSearcher from './archive/SongSearcher';
import BlueBanners from './archive/BlueBanners';
import ZenSlicer from './archive/ZenSlicer';
import MedDashboard from './archive/MedDashboard/MedDashboard';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-mono bg-canvas text-ink">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            {/* Archived routes */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/cv" element={<Cv />} />
            <Route path="/do-they-like-me" element={<DoTheyLikeMe />} />
            <Route path="/are-you-compatible" element={<AreYouCompatible />} />
            <Route path="/song-searcher" element={<SongSearcher />} />
            <Route path="/blue-banners" element={<BlueBanners />} />
            <Route path="/zenslicer" element={<ZenSlicer />} />
            <Route path="/uk-med-dashboard" element={<MedDashboard />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
