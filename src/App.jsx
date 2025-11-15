import { useEffect } from 'react';
import './styles/components/App.css';
import { BrowserRouter } from 'react-router-dom';
import HeaderNav from './components/HeaderNav';
import Footer from './components/Footer';
import Toast from './components/Toast';
import AppRoutes from './routes';
import useAuthStore from './stores/authStore';
import { onAuthStateChange } from './services/authApi';

export default function App() {
  useEffect(() => {
    const { setUser, clearUser, setStatus } = useAuthStore.getState();
    setStatus('loading');

    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setUser(user);
      } else {
        clearUser();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="app">
      <BrowserRouter>
        <div className="app__shell">
          <HeaderNav />
          <main className="app__content">
            <AppRoutes />
          </main>
          <Footer />
        </div>
        <Toast />
      </BrowserRouter>
    </div>
  );
}
