import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Home } from '@/pages/Home';
import { LakeDetail } from '@/pages/LakeDetail';
import { Auth } from '@/pages/Auth';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen bg-[var(--color-bg-deep)]">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lake/:slug" element={<LakeDetail />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--color-bg-elevated)',
              border: '1px solid rgba(136, 153, 166, 0.1)',
              color: 'var(--color-frost-white)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
