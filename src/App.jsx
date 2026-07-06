import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Cv from './pages/Cv';
import DoTheyLikeMe from './pages/DoTheyLikeMe';
import AreYouCompatible from './pages/AreYouCompatible';
import SongSearcher from './pages/SongSearcher';
import BlueBanners from './pages/BlueBanners';
import ZenSlicer from './pages/ZenSlicer';
import PasswordLock from './components/PasswordLock';

function App() {
  return (
    <ThemeProvider>
      <PasswordLock>
        <Router>
          <div className="min-h-screen flex flex-col font-mono bg-canvas text-ink">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/cv" element={<Cv />} />
              <Route path="/do-they-like-me" element={<DoTheyLikeMe />} />
              <Route path="/are-you-compatible" element={<AreYouCompatible />} />
              <Route path="/song-searcher" element={<SongSearcher />} />
              <Route path="/blue-banners" element={<BlueBanners />} />
              <Route path="/zenslicer" element={<ZenSlicer />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </PasswordLock>
    </ThemeProvider>
  );
}

export default App;
