import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

// Imports des services et outils
import { auth, db, appId, hasFirebase } from './services/firebase';

// Imports des composants UI
import Header from './components/Header';
import Navigation from './components/Navigation';

// Imports des Vues
import HomeView from './views/HomeView';
import DashboardView from './views/DashboardView';
import MapView from './views/MapView';
import ScanIAView from './views/ScanIAView';
import CommunityView from './views/CommunityView';
import AdminView from './views/AdminView';
import AccountView from './views/AccountView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';

export default function App() {
  const [currentPage, setCurrentPage] = useState('connexion');
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [zones, setZones] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const USERS_STORAGE_KEY = 'vitinova_users';
  const ADMIN_EMAIL = 'root@gmail.com';
  const DEFAULT_ADMIN_PASSWORD = 'admin123';

  const getStoredUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
    } catch (err) {
      return {};
    }
  };

  const setStoredUsers = (accounts) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
  };

  const ensureAdminAccount = () => {
    const accounts = getStoredUsers();
    if (!accounts[ADMIN_EMAIL]) {
      accounts[ADMIN_EMAIL] = {
        email: ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        active: true,
      };
      setStoredUsers(accounts);
      return;
    }

    if (accounts[ADMIN_EMAIL].role !== 'admin') {
      accounts[ADMIN_EMAIL].role = 'admin';
      setStoredUsers(accounts);
    }
  };

  useEffect(() => {
    ensureAdminAccount();
  }, []);

  const handleCreateAccount = ({ email, password, firstName, lastName }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = getStoredUsers();
    if (accounts[normalizedEmail]) {
      return { error: 'Un compte existe déjà avec cette adresse e-mail.' };
    }

    const isAdmin = normalizedEmail === ADMIN_EMAIL;
    const newUser = {
      email: normalizedEmail,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: isAdmin ? 'admin' : 'user',
      active: true
    };

    accounts[normalizedEmail] = newUser;
    setStoredUsers(accounts);
    setCurrentUser(newUser);
    setShowConfirmationModal(true);
    return { error: '' };
  };

  const handleUpdateAccount = ({ firstName, lastName, password, confirmPassword }) => {
    const normalizedEmail = currentUser?.email;
    if (!normalizedEmail) {
      return { error: 'Impossible de mettre à jour le compte.' };
    }

    const accounts = getStoredUsers();
    const storedAccount = accounts[normalizedEmail];
    if (!storedAccount) {
      return { error: 'Compte introuvable.' };
    }

    if (!firstName.trim() || !lastName.trim()) {
      return { error: 'Veuillez renseigner le prénom et le nom.' };
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return { error: 'Les mots de passe ne correspondent pas.' };
      }
      storedAccount.password = password;
    }

    storedAccount.firstName = firstName.trim();
    storedAccount.lastName = lastName.trim();
    accounts[normalizedEmail] = storedAccount;
    setStoredUsers(accounts);
    setCurrentUser(storedAccount);
    return { error: '' };
  };

  const handleLogin = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = getStoredUsers();
    const account = accounts[normalizedEmail];
    if (!account) {
      return { error: 'Aucun compte trouvé pour cette adresse e-mail.' };
    }
    if (account.password !== password) {
      return { error: 'Mot de passe incorrect.' };
    }
    if (account.active === false) {
      return { error: 'Ce compte est désactivé. Contactez un administrateur.' };
    }

    if (account.email === ADMIN_EMAIL && account.role !== 'admin') {
      account.role = 'admin';
      accounts[ADMIN_EMAIL] = account;
      setStoredUsers(accounts);
    }

    setCurrentUser(account);
    setAuthenticated(true);
    setCurrentPage('accueil');
    return { error: '' };
  };

  // Simulation de données (bouton rafraîchir)
  const generateRandomData = () => {
    setSensorData({
      baseTemp: 22,
      baseHumidity: 88,
      windSpeed: Math.floor(Math.random() * 20) + 10,
      windDir: Math.floor(Math.random() * 360),
      timestamp: Date.now()
    });
  };

  // Connexion Firebase anonyme automatique
  useEffect(() => {
    if (!hasFirebase || !auth) return;
    signInAnonymously(auth).catch(err => console.error("Erreur auth Firebase", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Écoute de la base de données (Weenat & Tracés de carte)
  useEffect(() => {
    if (!user) return;
    setIsConnected(true);

    // Écoute des capteurs (Workflow n8n)
    const dataRef = collection(db, 'artifacts', appId, 'public', 'data', 'sensor_readings');
    const unsubscribeFirestore = onSnapshot(dataRef, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(doc => doc.data());
        docs.sort((a, b) => b.timestamp - a.timestamp);

        const weenatData = docs[0];
        const finalSpeed = weenatData.FF !== undefined ? (weenatData.FF * 3.6) : 15;
        const finalDir = weenatData.DD !== undefined ? weenatData.DD : 350;

        setSensorData({
          baseTemp: weenatData.T || 14,
          baseHumidity: weenatData.U || 48,
          windSpeed: finalSpeed,
          windDir: finalDir,
          timestamp: weenatData.timestamp || Date.now()
        });
      }
    }, (err) => console.error("Firestore error:", err));

    // Écoute des tracés de la carte
    const zonesRef = collection(db, 'artifacts', appId, 'public', 'data', 'map_zones');
    const unsubscribeZones = onSnapshot(zonesRef, (snapshot) => {
      const fetchedZones = snapshot.docs.map(doc => doc.data());
      setZones(fetchedZones);
    }, (err) => console.error("Firestore zones error:", err));

    return () => {
      unsubscribeFirestore();
      unsubscribeZones();
    };
  }, [user]);

  useEffect(() => {
    if (!authenticated && currentPage !== 'connexion' && currentPage !== 'creer') {
      setCurrentPage('connexion');
    }
  }, [authenticated, currentPage]);

  useEffect(() => {
    if (currentPage === 'admin' && currentUser?.role !== 'admin') {
      setCurrentPage('accueil');
    }
  }, [currentPage, currentUser]);

  // Système de routage des écrans
  const renderContent = () => {
    switch (currentPage) {
      case 'connexion': return <LoginView onLogin={handleLogin} setCurrentPage={setCurrentPage} />;
      case 'creer': return <RegisterView onCreateAccount={handleCreateAccount} setCurrentPage={setCurrentPage} />;
      case 'accueil': return <HomeView setCurrentPage={setCurrentPage} />;
      case 'dashboard': return <DashboardView sensorData={sensorData} zones={zones} onSimulateData={generateRandomData} />;
      case 'scan': return <ScanIAView />;
      case 'carte': return <MapView sensorData={sensorData} zones={zones} setZones={setZones} />;
      case 'communaute': return <CommunityView user={user} />;
      case 'compte': return <AccountView currentUser={currentUser} onUpdateAccount={handleUpdateAccount} />;
      case 'admin':
        return currentUser?.role === 'admin'
          ? <AdminView zones={zones} setCurrentPage={setCurrentPage} currentUser={currentUser} />
          : <HomeView setCurrentPage={setCurrentPage} />;
      default: return <LoginView setCurrentPage={setCurrentPage} setAuthenticated={setAuthenticated} />;
    }
  };

  const isAdminPage = currentPage === 'admin';

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex items-center justify-center sm:p-8">
      <div className="w-full h-[100dvh] sm:w-[375px] sm:h-[760px] shrink-0 bg-slate-50 sm:rounded-[3rem] sm:border-[14px] sm:border-slate-950 shadow-[0_0_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col relative transition-all duration-300 sm:-translate-y-7">

        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-50"></div>

        {authenticated ? (
          <>
            <Header isAuthenticated={authenticated} setCurrentPage={setCurrentPage} setAuthenticated={setAuthenticated} setCurrentUser={setCurrentUser} currentUser={currentUser} />
            <main className="flex-1 overflow-y-auto bg-slate-50 relative z-0">
              {renderContent()}
            </main>
            {!isAdminPage && <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />}
          </>
        ) : (
          <main className="flex-1 overflow-y-auto bg-slate-50 relative z-0">
            {renderContent()}
          </main>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>

      {/* Modal de confirmation de création de compte */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 shadow-xl animate-scaleIn">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">Compte créé !</h3>
            <p className="text-slate-600 text-center mb-6">Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.</p>
            <button
              onClick={() => {
                setShowConfirmationModal(false);
                setCurrentPage('connexion');
              }}
              className="w-full py-3 rounded-3xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
            >
              Aller à la connexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
