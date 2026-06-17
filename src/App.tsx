import React, { useState } from 'react';
import './App.css';

interface Manga {
  id: number;
  title: string;
  episode: string;
  likes: string;
  views: string;
  cover: string;
  genre: 'shounen' | 'fantasi' | 'drama' | 'romance' | 'slice of life';
}

function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // View state: default is landing page ('pembaca-home')
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'role-selection' | 'pembaca-home' | 'author-home' | 'manga-detail' | 'manga-reader'>('pembaca-home');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Role selection state
  const [selectedRole, setSelectedRole] = useState<'pembaca' | 'author'>('pembaca');

  // Selected Manga state for Detail View
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Hero Slider state
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  // Manga lists using all 13 posters
  const mangas: Manga[] = [
    {
      id: 1,
      title: 'Solo Leveling',
      episode: 'Episode 103',
      likes: '4.120',
      views: '489K',
      cover: '/assets/Poster_2.jpeg',
      genre: 'shounen',
    },
    {
      id: 2,
      title: 'Blue Period',
      episode: 'Vol 3: Episode 48',
      likes: '4.120',
      views: '489K',
      cover: '/assets/Poster_7.jpeg',
      genre: 'drama',
    },
    {
      id: 3,
      title: 'Cry or better yet Beg',
      episode: 'Episode 72',
      likes: '4.120',
      views: '489K',
      cover: '/assets/Poster_8.jpeg',
      genre: 'romance',
    },
    {
      id: 4,
      title: 'Killer Peter',
      episode: 'Episode 402',
      likes: '4.120',
      views: '489K',
      cover: '/assets/Poster_3.jpeg',
      genre: 'shounen',
    },
    {
      id: 5,
      title: 'Special Civil Servant',
      episode: 'Episode 201',
      likes: '4.120',
      views: '489K',
      cover: '/assets/Poster_6.jpeg',
      genre: 'fantasi',
    },
    {
      id: 6,
      title: 'Jujutsu Kaisen',
      episode: 'Vol 1: Episode 32',
      likes: '4.120',
      views: '489K',
      cover: '/assets/Poster_5.jpeg',
      genre: 'shounen',
    },
    {
      id: 7,
      title: 'Omniscient Reader\'s Viewpoint',
      episode: 'Episode 180',
      likes: '4.950',
      views: '720K',
      cover: '/assets/Poster_13.jpeg',
      genre: 'fantasi',
    },
    {
      id: 8,
      title: 'The Greatest Estate Developer',
      episode: 'Episode 142',
      likes: '4.800',
      views: '650K',
      cover: '/assets/Poster_1.jpeg',
      genre: 'fantasi',
    },
    {
      id: 9,
      title: 'Reborn as the Enemy Prince',
      episode: 'Episode 98',
      likes: '4.300',
      views: '390K',
      cover: '/assets/Poster_4.jpeg',
      genre: 'fantasi',
    },
    {
      id: 10,
      title: 'Heaven Official\'s Blessing',
      episode: 'Episode 84',
      likes: '4.670',
      views: '510K',
      cover: '/assets/Poster_9.jpeg',
      genre: 'romance',
    },
    {
      id: 11,
      title: 'Who Made Me a Princess',
      episode: 'Episode 125',
      likes: '4.520',
      views: '470K',
      cover: '/assets/Poster_10.jpeg',
      genre: 'romance',
    },
    {
      id: 12,
      title: 'Wind Breaker (Zhu Fen II)',
      episode: 'Episode 110',
      likes: '4.410',
      views: '425K',
      cover: '/assets/Poster_11.jpeg',
      genre: 'shounen',
    },
    {
      id: 13,
      title: 'Attack on Titan',
      episode: 'Episode 139',
      likes: '4.980',
      views: '890K',
      cover: '/assets/Poster_12.jpeg',
      genre: 'shounen',
    }
  ];

  // Featured mangas for the Hero banner
  const featuredMangas = [
    {
      title: 'Omniscient Reader\'s Viewpoint',
      description: 'Dunia berubah jadi game survival berisi misi mematikan. Karena tahu jalan cerita, Dokja berusaha bertahan hidup dan menyelamatkan dunia bersama sang protagonis.',
      cover: '/assets/Poster_13.jpeg',
    },
    {
      title: 'Solo Leveling',
      description: 'Dari pemburu terlemah di seluruh dunia, Sung Jin-Woo mendapatkan kemampuan misterius untuk naik level tanpa batas. Ikuti perjalanannya menjadi hunter terkuat.',
      cover: '/assets/Poster_2.jpeg',
    },
    {
      title: 'The Greatest Estate Developer',
      description: 'Seorang mahasiswa teknik sipil terbangun di dalam novel fantasi sebagai bangsawan pemalas yang bangkrut. Menggunakan ilmu teknik sipilnya, ia mulai membangun kerajaannya!',
      cover: '/assets/Poster_1.jpeg',
    }
  ];

  const handleNextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % featuredMangas.length);
  };

  const handlePrevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + featuredMangas.length) % featuredMangas.length);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (email === 'nadiatmbunan@gmail.com' && password === 'admin123') {
      setIsUserLoggedIn(true);
      setLoggedInEmail(email);
      setCurrentView('role-selection');
    } else {
      setLoginError('Email atau sandi salah. Silakan coba lagi.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!agreeTerms) {
      setRegisterError('Anda harus menyetujui Syarat & Ketentuan.');
      return;
    }

    // Success simulation
    alert('Pendaftaran berhasil! Silakan masuk dengan akun Anda.');
    setEmail(regEmail); // autofill email for login
    setPassword('');
    setCurrentView('login');
    // Clear registration form
    setFullName('');
    setRegEmail('');
    setRegPassword('');
    setAgreeTerms(false);
  };

  const handleRoleContinue = () => {
    if (selectedRole === 'pembaca') {
      setCurrentView('pembaca-home');
    } else {
      setCurrentView('author-home');
    }
  };

  const handleLogout = () => {
    setIsUserLoggedIn(false);
    setLoggedInEmail('');
    setCurrentView('pembaca-home');
  };

  // Filter manga based on search query
  const filteredMangas = mangas.filter(manga =>
    manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manga.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Staggered column covers for background on login and register pages
  const loginColumn1 = [
    '/assets/Poster_2.jpeg',
    '/assets/Poster_7.jpeg',
    '/assets/Poster_8.jpeg',
    '/assets/Poster_4.jpeg',
    '/assets/Poster_2.jpeg',
    '/assets/Poster_7.jpeg',
    '/assets/Poster_8.jpeg',
    '/assets/Poster_4.jpeg',
  ];

  const loginColumn2 = [
    '/assets/Poster_3.jpeg',
    '/assets/Poster_6.jpeg',
    '/assets/Poster_5.jpeg',
    '/assets/Poster_9.jpeg',
    '/assets/Poster_3.jpeg',
    '/assets/Poster_6.jpeg',
    '/assets/Poster_5.jpeg',
    '/assets/Poster_9.jpeg',
  ];

  const loginColumn3 = [
    '/assets/Poster_1.jpeg',
    '/assets/Poster_10.jpeg',
    '/assets/Poster_11.jpeg',
    '/assets/Poster_12.jpeg',
    '/assets/Poster_13.jpeg',
    '/assets/Poster_1.jpeg',
    '/assets/Poster_10.jpeg',
    '/assets/Poster_11.jpeg',
  ];

  // Screen 1: Login Screen
  if (currentView === 'login') {
    return (
      <div className="auth-root-container">
        <section className="login-section">
          <div className="logo-container" onClick={() => setCurrentView('pembaca-home')} style={{ cursor: 'pointer' }}>
            <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2V30M6 16.5L20 2M6 15.5L21 30" stroke="#1C243C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="login-header">
            <h1 className="login-title">Selamat Datang Kembali!</h1>
            <p className="login-subtitle">
              Masuk untuk melanjutkan bacaan favoritmu dan jelajahi ribuan koleksi manga terbaru
            </p>
          </div>

          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Namamail@gmail.com" 
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Masukkan Sandi" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            {loginError && (
              <div className="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {loginError}
              </div>
            )}

            <div className="form-options">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <span className="custom-checkbox"></span>
                Ingat sebagi Saya
              </label>
              <a href="#forgot" className="forgot-password">Lupa Sandi?</a>
            </div>

            <button type="submit" className="btn-signin">Sign In</button>
            
            <div className="divider"></div>

            <button type="button" className="btn-google">
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>
          </form>

          <div className="signup-footer">
            Belum punya akun? <a href="#signup" onClick={(e) => { e.preventDefault(); setCurrentView('register'); setLoginError(''); }}>Buat akun baru</a>
          </div>
        </section>

        <section className="poster-section">
          <div className="poster-column" style={{ '--duration': '35s' } as React.CSSProperties}>
            {loginColumn1.map((src, i) => (
              <div className="poster-card" key={`c1-${i}`}>
                <img src={src} alt="Manga Poster" className="poster-img" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="poster-column reverse" style={{ '--duration': '40s' } as React.CSSProperties}>
            {loginColumn2.map((src, i) => (
              <div className="poster-card" key={`c2-${i}`}>
                <img src={src} alt="Manga Poster" className="poster-img" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="poster-column" style={{ '--duration': '38s' } as React.CSSProperties}>
            {loginColumn3.map((src, i) => (
              <div className="poster-card" key={`c3-${i}`}>
                <img src={src} alt="Manga Poster" className="poster-img" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Screen 2: Register Screen
  if (currentView === 'register') {
    return (
      <div className="auth-root-container">
        <section className="login-section">
          <div className="logo-container" onClick={() => setCurrentView('pembaca-home')} style={{ cursor: 'pointer' }}>
            <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2V30M6 16.5L20 2M6 15.5L21 30" stroke="#1C243C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="login-header">
            <h1 className="login-title">Mulai Petualanganmu di KomikinAja!</h1>
            <p className="login-subtitle">
              Daftar sekarang untuk akses ribuan koleksi manga, manhwa, dan manhua terpopuler.
            </p>
          </div>

          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Nama Panjang" 
                className="form-input" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <input 
                type="email" 
                placeholder="Namamail@gmail.com" 
                className="form-input" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Sandi" 
                className="form-input" 
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            {registerError && (
              <div className="error-message">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {registerError}
              </div>
            )}

            <div className="form-options">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={agreeTerms} 
                  onChange={(e) => setAgreeTerms(e.target.checked)} 
                />
                <span className="custom-checkbox"></span>
                Saya menyetujui Syarat & Ketentuan
              </label>
            </div>

            <button type="submit" className="btn-signin">Sign up</button>
            
            <div className="divider"></div>

            <button type="button" className="btn-google">
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>
          </form>

          <div className="signup-footer">
            Sudah punya akun? <a href="#login" onClick={(e) => { e.preventDefault(); setCurrentView('login'); setRegisterError(''); }}>Sign in</a>
          </div>
        </section>

        <section className="poster-section">
          {/* Staggered grid poster wall */}
          <div className="poster-column" style={{ '--duration': '35s' } as React.CSSProperties}>
            {loginColumn1.map((src, i) => (
              <div className="poster-card" key={`c1-${i}`}>
                <img src={src} alt="Manga Poster" className="poster-img" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="poster-column reverse" style={{ '--duration': '40s' } as React.CSSProperties}>
            {loginColumn2.map((src, i) => (
              <div className="poster-card" key={`c2-${i}`}>
                <img src={src} alt="Manga Poster" className="poster-img" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="poster-column" style={{ '--duration': '38s' } as React.CSSProperties}>
            {loginColumn3.map((src, i) => (
              <div className="poster-card" key={`c3-${i}`}>
                <img src={src} alt="Manga Poster" className="poster-img" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Screen 3: Role Selection Screen
  if (currentView === 'role-selection') {
    return (
      <div className="role-container">
        <div className="role-logo-container" onClick={() => setCurrentView('pembaca-home')} style={{ cursor: 'pointer' }}>
          <svg width="42" height="48" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2V30M6 16.5L20 2M6 15.5L21 30" stroke="#1C243C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="role-heading">Kamu mau jadi apa di KomikinAja?</h1>
        <p className="role-subheading">
          Pilih peran yang sesuai kamu banget! Kamu bisa mengubahnya kapan saja di pengaturan.
        </p>

        <div className="role-cards-list">
          <div 
            className={`role-card ${selectedRole === 'pembaca' ? 'active' : 'inactive'}`}
            onClick={() => setSelectedRole('pembaca')}
          >
            <div className="role-card-title">Pembaca</div>
            <div className="role-card-subtitle">
              Nikmati ribuan komik, manga, manhwa, dan manhua dari seluruh dunia.
            </div>
          </div>

          <div 
            className={`role-card ${selectedRole === 'author' ? 'active' : 'inactive'}`}
            onClick={() => setSelectedRole('author')}
          >
            <div className="role-card-title">Author</div>
            <div className="role-card-subtitle">
              Publikasikan karya kamu dan bangun basis pembaca yang loyal.
            </div>
          </div>
        </div>

        <button type="button" className="btn-continue" onClick={handleRoleContinue}>
          Lanjutkan
        </button>
      </div>
    );
  }

  // Screen 4: Author Home Dashboard (Placeholder)
  if (currentView === 'author-home') {
    return (
      <div className="role-container">
        <div className="role-logo-container" onClick={() => setCurrentView('pembaca-home')} style={{ cursor: 'pointer' }}>
          <svg width="42" height="48" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2V30M6 16.5L20 2M6 15.5L21 30" stroke="#1C243C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="role-heading">Selamat Datang di Portal Author!</h1>
        <p className="role-subheading" style={{ marginBottom: '24px' }}>
          Di sini Anda dapat mempublikasikan karya Anda dan mengelola basis pembaca yang loyal. Dashboard ini sedang dalam pengembangan aktif.
        </p>

        <button type="button" className="btn-continue" onClick={handleLogout}>
          Kembali ke Halaman Utama
        </button>
      </div>
    );
  }

  // Screen 4.5: Manga Detail Page
  if (currentView === 'manga-detail' && selectedManga) {
    return (
      <div className="landing-page-wrapper">
        <header className="landing-navbar">
          <div className="navbar-left">
            <div className="navbar-logo" onClick={() => setCurrentView('pembaca-home')} style={{ cursor: 'pointer' }}>
              <svg width="24" height="28" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2V30M6 16.5L20 2M6 15.5L21 30" stroke="#1C243C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <nav className="navbar-links">
              <span className="nav-link" onClick={() => setCurrentView('pembaca-home')} style={{ cursor: 'pointer' }}>Home</span>
            </nav>
          </div>
          
          <div className="navbar-right">
            {isUserLoggedIn ? (
              <div className="logged-in-profile">
                <div className="profile-info">
                  <span className="profile-avatar">{loggedInEmail.charAt(0).toUpperCase()}</span>
                  <span className="profile-email-name" title={loggedInEmail}>Pembaca</span>
                </div>
                <button className="btn-nav-logout" onClick={handleLogout}>Keluar</button>
              </div>
            ) : (
              <>
                <button className="btn-nav-register" onClick={() => setCurrentView('register')}>Registrasi</button>
                <button className="btn-nav-login" onClick={() => setCurrentView('login')}>Login</button>
              </>
            )}
            <button className="btn-nav-bell" aria-label="Notifikasi">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C243C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
          </div>
        </header>

        <main className="detail-content">
          <div className="detail-banner" style={{ backgroundImage: `url(${selectedManga.cover})` }}>
            <div className="banner-overlay"></div>
            <button className="btn-back-banner" onClick={() => setCurrentView('pembaca-home')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="banner-center-img-wrapper">
              <img src={selectedManga.cover} alt={selectedManga.title} className="banner-center-img" />
            </div>
          </div>

          <div className="detail-info-section">
            <h1 className="detail-title">{selectedManga.title}</h1>
            <p className="detail-author"><strong>Author:</strong> Kim Hyunsoo, Lee hyunmin, BK_Moon</p>
            <div className="detail-stats">
              <span className="detail-stat-item">
                <svg className="icon-eye" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                4,582,713
              </span>
              <span className="detail-stat-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                4,582,713
              </span>
            </div>
            <p className="detail-synopsis">
              Cerita ini mengisahkan tentang petualangan seru dan menegangkan. Berbagai rintangan harus dihadapi.
              Karakter utama terbangun di dunia lain, ternyata dunia itu adalah dunia novel yang dibacanya.
              Kini dia hidup bersama teman-temannya di balik pedang dan beberapa makhluk fantasi yang menggemaskan!
            </p>
            <button className="btn-baca-episode" onClick={() => setCurrentView('manga-reader')}>
              Baca Episode Pertama
            </button>
          </div>

          <div className="episode-list-container">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(ep => (
              <div className="episode-row" key={ep} onClick={() => setCurrentView('manga-reader')}>
                <span className="episode-number">Episode {ep}</span>
                <span className="episode-likes">
                  <svg className="icon-heart" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {selectedManga.likes}
                </span>
              </div>
            ))}
            
            <div className="pagination">
              <span className="page-number active">1</span>
              <span className="page-number">2</span>
              <span className="page-number">3</span>
              <span className="page-number">4</span>
              <span className="page-number">5</span>
              <span className="page-number">6</span>
              <span className="page-number">7</span>
              <span className="page-number">8</span>
              <span className="page-number">9</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <div className="comments-section">
            <h3 className="comments-count">104 Komen</h3>
            
            <div className="comment-input-row">
              <div className="comment-avatar user-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" fill="#333"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#333" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="comment-input-wrapper">
                <input type="text" className="comment-input" placeholder="Tuliskan Komen Anda..." />
                <button className="btn-kirim">Kirim</button>
              </div>
            </div>

            <div className="comment-list">
              <div className="comment-item">
                <div className="comment-avatar"><img src="/assets/Poster_2.jpeg" alt="avatar" /></div>
                <div className="comment-body">
                  <h4 className="comment-username">AKT SUKA COMIC</h4>
                  <p className="comment-text">Gue ngerasa cerita ini nggak sesimpel yang kelihatan di awal. Dari cara karakter utamanya bereaksi di beberapa scene, kayak ada sesuatu yang disembunyin...</p>
                </div>
              </div>
              <div className="comment-item">
                <div className="comment-avatar"><img src="/assets/Poster_4.jpeg" alt="avatar" /></div>
                <div className="comment-body">
                  <h4 className="comment-username">Marzanah</h4>
                  <p className="comment-text">KEREN BGT GILEE GA SABAR LANJUTANNYA</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <div className="global-copyright-footer">
          <p>Copyright © KomikinAja 2026</p>
        </div>
      </div>
    );
  }

  // Screen 4.6: Manga Reader Page
  if (currentView === 'manga-reader' && selectedManga) {
    return (
      <div className="reader-wrapper">
        <header className="reader-header">
          <button className="btn-reader-back" onClick={() => setCurrentView('manga-detail')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Kembali
          </button>
          <div className="reader-title-info">
            <h2>{selectedManga.title}</h2>
            <span>Episode 1</span>
          </div>
          <div style={{ width: '80px' }}></div> {/* spacer */}
        </header>

        <main className="reader-content">
          <div className="reader-pages">
            <img src={selectedManga.cover} alt="Page 1" className="reader-img" />
            <img src="/assets/Poster_5.jpeg" alt="Page 2" className="reader-img" />
            <img src="/assets/Poster_8.jpeg" alt="Page 3" className="reader-img" />
            <img src="/assets/Poster_13.jpeg" alt="Page 4" className="reader-img" />
            <img src={selectedManga.cover} alt="Page 5" className="reader-img" />
          </div>
          
          <div className="reader-navigation">
            <button className="btn-reader-nav">Episode Sebelumnya</button>
            <button className="btn-reader-nav">Episode Selanjutnya</button>
          </div>
        </main>
      </div>
    );
  }

  // Screen 5: Pembaca Landing Page (default)
  return (
    <div className="landing-page-wrapper">
      {/* Navigation Bar */}
      <header className="landing-navbar">
        <div className="navbar-left">
          <div className="navbar-logo" onClick={() => setCurrentView('pembaca-home')}>
            <svg width="24" height="28" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2V30M6 16.5L20 2M6 15.5L21 30" stroke="#1C243C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <nav className="navbar-links">
            <a href="#rekomendasi" className="nav-link">Rekomendasi</a>
            <a href="#trending" className="nav-link">Trending</a>
            <a href="#kategori" className="nav-link">Kategori</a>
          </nav>
        </div>
        
        <div className="navbar-right">
          {isUserLoggedIn ? (
            <div className="logged-in-profile">
              <div className="profile-info">
                <span className="profile-avatar">
                  {loggedInEmail.charAt(0).toUpperCase()}
                </span>
                <span className="profile-email-name" title={loggedInEmail}>
                  Pembaca
                </span>
              </div>
              <button className="btn-nav-logout" onClick={handleLogout}>Keluar</button>
            </div>
          ) : (
            <>
              <button className="btn-nav-register" onClick={() => setCurrentView('register')}>Registrasi</button>
              <button className="btn-nav-login" onClick={() => setCurrentView('login')}>Login</button>
            </>
          )}
          
          <button className="btn-nav-bell" aria-label="Notifikasi">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C243C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>
      </header>

      <main className="landing-content">
        {/* Hero Banner Section */}
        <section className="hero-banner-card">
          <div className="hero-banner-left">
            <h2 className="hero-banner-title">
              Selamat datang di KomikinAja, <br />
              {featuredMangas[activeHeroIndex].title}!
            </h2>
            <p className="hero-banner-description">
              {featuredMangas[activeHeroIndex].description}
            </p>
            <a href="#detail" className="btn-hero-read" onClick={(e) => {
              e.preventDefault();
              const found = mangas.find(m => m.title === featuredMangas[activeHeroIndex].title);
              if (found) {
                setSelectedManga(found);
                setCurrentView('manga-detail');
              }
            }}>Lihat Komik</a>
          </div>

          <div className="hero-banner-right">
            <button className="slider-arrow prev" onClick={handlePrevHero} aria-label="Previous featured manga">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div className="slider-stack">
              {featuredMangas.map((manga, idx) => {
                let className = 'slider-card-item';
                if (idx === activeHeroIndex) className += ' active';
                else if (idx === (activeHeroIndex + 1) % featuredMangas.length) className += ' next';
                else className += ' prev-item';

                return (
                  <div className={className} key={`featured-${idx}`}>
                    <img src={manga.cover} alt={manga.title} className="slider-card-img" />
                  </div>
                );
              })}
            </div>

            <button className="slider-arrow next" onClick={handleNextHero} aria-label="Next featured manga">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </section>

        {/* Search Section */}
        <section className="search-bar-section">
          <div className="search-input-wrapper">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#797672" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Searching..." 
              className="landing-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Search Results / Content Grid rows */}
        {searchQuery !== '' ? (
          <section className="manga-section">
            <h3 className="section-title">Hasil Pencarian untuk "{searchQuery}"</h3>
            {filteredMangas.length > 0 ? (
              <div className="manga-grid">
                {filteredMangas.map(manga => (
                  <div className="manga-card" key={`search-${manga.id}`} onClick={() => { setSelectedManga(manga); setCurrentView('manga-detail'); }} style={{ cursor: 'pointer' }}>
                    <div className="manga-cover-wrapper">
                      <img src={manga.cover} alt={manga.title} className="manga-cover-img" />
                    </div>
                    <h4 className="manga-card-title">{manga.title}</h4>
                    <p className="manga-card-episode">{manga.episode}</p>
                    <div className="manga-card-stats">
                      <span className="stat-likes">
                        <svg className="icon-heart" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {manga.likes}
                      </span>
                      <span className="stat-views">
                        <svg className="icon-eye" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {manga.views}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">Tidak ada manga yang cocok dengan pencarian Anda.</div>
            )}
          </section>
        ) : (
          <>
            {/* Rekomendasi Untuk Kamu */}
            <section id="rekomendasi" className="manga-section">
              <h3 className="section-title">Rekomendasi Untuk kamu!</h3>
              <div className="manga-grid">
                {mangas.slice(0, 6).map(manga => (
                  <div className="manga-card" key={`reco-${manga.id}`} onClick={() => { setSelectedManga(manga); setCurrentView('manga-detail'); }} style={{ cursor: 'pointer' }}>
                    <div className="manga-cover-wrapper">
                      <img src={manga.cover} alt={manga.title} className="manga-cover-img" />
                    </div>
                    <h4 className="manga-card-title">{manga.title}</h4>
                    <p className="manga-card-episode">{manga.episode}</p>
                    <div className="manga-card-stats">
                      <span className="stat-likes">
                        <svg className="icon-heart" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {manga.likes}
                      </span>
                      <span className="stat-views">
                        <svg className="icon-eye" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {manga.views}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Terakhir Update */}
            <section className="manga-section">
              <h3 className="section-title">Terakhir Update</h3>
              <div className="manga-grid">
                {mangas.slice(0, 6).map(manga => (
                  <div className="manga-card" key={`recent-${manga.id}`} onClick={() => { setSelectedManga(manga); setCurrentView('manga-detail'); }} style={{ cursor: 'pointer' }}>
                    <div className="manga-cover-wrapper">
                      <img src={manga.cover} alt={manga.title} className="manga-cover-img" />
                    </div>
                    <h4 className="manga-card-title">{manga.title}</h4>
                    <p className="manga-card-episode">{manga.episode}</p>
                    <div className="manga-card-stats">
                      <span className="stat-likes">
                        <svg className="icon-heart" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {manga.likes}
                      </span>
                      <span className="stat-views">
                        <svg className="icon-eye" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {manga.views}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Shounen Manga Top 10 */}
            <section id="trending" className="manga-section">
              <h3 className="section-title">Shounen Manga Top 10</h3>
              <div className="manga-grid">
                {mangas.filter(m => m.genre === 'shounen').slice(0, 6).map(manga => (
                  <div className="manga-card" key={`shounen-${manga.id}`} onClick={() => { setSelectedManga(manga); setCurrentView('manga-detail'); }} style={{ cursor: 'pointer' }}>
                    <div className="manga-cover-wrapper">
                      <img src={manga.cover} alt={manga.title} className="manga-cover-img" />
                    </div>
                    <h4 className="manga-card-title">{manga.title}</h4>
                    <p className="manga-card-episode">{manga.episode}</p>
                    <div className="manga-card-stats">
                      <span className="stat-likes">
                        <svg className="icon-heart" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {manga.likes}
                      </span>
                      <span className="stat-views">
                        <svg className="icon-eye" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {manga.views}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Fantasi Manga Top 10 */}
            <section id="kategori" className="manga-section">
              <h3 className="section-title">Fantasi Manga Top 10</h3>
              <div className="manga-grid">
                {mangas.filter(m => m.genre === 'fantasi').slice(0, 6).map(manga => (
                  <div className="manga-card" key={`fantasi-${manga.id}`} onClick={() => { setSelectedManga(manga); setCurrentView('manga-detail'); }} style={{ cursor: 'pointer' }}>
                    <div className="manga-cover-wrapper">
                      <img src={manga.cover} alt={manga.title} className="manga-cover-img" />
                    </div>
                    <h4 className="manga-card-title">{manga.title}</h4>
                    <p className="manga-card-episode">{manga.episode}</p>
                    <div className="manga-card-stats">
                      <span className="stat-likes">
                        <svg className="icon-heart" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {manga.likes}
                      </span>
                      <span className="stat-views">
                        <svg className="icon-eye" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {manga.views}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="view-more-container">
          <a href="#more" className="link-view-more">View More</a>
        </div>
      </main>

      {/* Wavy Footer */}
      <footer className="landing-footer">
        <div className="wave-svg-container">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="wave-svg">
            <path d="M0 60C120 20 240 20 360 40C480 60 600 100 720 100C840 100 960 60 1080 40C1200 20 1320 20 1440 60V120H0V60Z" fill="#1C243C"/>
          </svg>
        </div>
        
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">K</div>
            <p className="footer-slogan">
              Tempat santai buat eksplor komik dan manhwa seru, <br />
              update terus tiap hari.
            </p>
          </div>
          
          <div className="footer-right">
            <div className="footer-links-col">
              <h5 className="footer-col-title">Baca</h5>
              <a href="#manhwa" className="footer-link">REKOMENDASI MANHWA</a>
              <a href="#manga" className="footer-link">REKOMENDASI MANGA</a>
              <a href="#genre" className="footer-link">REKOMENDASI GENRE</a>
            </div>
            <div className="footer-links-col">
              <h5 className="footer-col-title">Link</h5>
              <a href="#contact" className="footer-link">CONTACT US</a>
              <a href="#credits" className="footer-link">CREADITS</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Footer */}
      <div className="global-copyright-footer">
        <p>Copyright © KomikinAja 2026</p>
      </div>
    </div>
  );
}

export default App;
