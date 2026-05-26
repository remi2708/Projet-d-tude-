import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  ServerCog,
  BarChart3,
  Sparkles,
  Search,
  Plus,
  Edit3,
  Trash2,
  ArrowLeftCircle,
  CheckCircle,
  XCircle,
  Cpu,
} from 'lucide-react';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const sampleSyncEvents = [
  { id: 1, label: 'Synchronisation cloud', detail: '22 dernières stations', status: 'Réussie', time: 'Il y a 4 min' },
  { id: 2, label: 'Requête API météo', detail: 'Weenat + OpenWeather', status: 'En cours', time: 'Il y a 12 min' },
  { id: 3, label: 'Mise à jour modèle IA', detail: 'Prévision maturité', status: 'Complétée', time: 'Il y a 1 h' },
];

const sampleModelHistory = [
  { id: 1, action: 'Création modèle', model: 'Stress hydrique', author: 'Admin', date: '26/05/2026' },
  { id: 2, action: 'Modification modèle', model: 'Prévision maturité', author: 'Admin', date: '25/05/2026' },
  { id: 3, action: 'Suppression modèle', model: 'Détection maladie', author: 'Admin', date: '24/05/2026' },
];

const sampleServiceStatus = [
  { id: 1, name: 'API Weenat', status: 'Actif' },
  { id: 2, name: 'Base forum', status: 'Actif' },
  { id: 3, name: 'Service IA', status: 'Bêta' },
  { id: 4, name: 'Synchronisation cloud', status: 'Actif' },
];

const sampleModels = [
  { id: 1, name: 'Prévision de maturité', version: 'v2.1', status: 'Actif', description: 'Analyse des tendances de maturation et recommandations de récolte.' },
  { id: 2, name: 'Détection stress hydrique', version: 'v1.8', status: 'Actif', description: 'Détecte les parcelles sujettes à un manque d’eau.' },
  { id: 3, name: 'Optimisation traitements', version: 'v1.2', status: 'Bêta', description: 'Propose des plans de traitements adaptés selon la météo.' },
];

const sampleStats = {
  activeUsers: 12,
  totalLogins: 234,
  recentActions: 14,
  cloudSyncs: 36,
  iaUsage: 18,
  forumPosts: 28,
};

const AdminView = ({ zones, setCurrentPage, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [models, setModels] = useState(sampleModels);
  const [newModel, setNewModel] = useState({ name: '', version: '', status: 'Actif', description: '' });
  const [editModelId, setEditModelId] = useState(null);

  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const fetchedUsers = snapshot.docs.map((userDoc) => {
        const data = userDoc.data();
        return {
          uid: userDoc.id,
          email: data.email,
          displayName: data.displayName,
          firstName: data.firstName || data.displayName?.split(' ')[0] || '',
          lastName: data.lastName || data.displayName?.split(' ').slice(1).join(' ') || '',
          role: data.role || 'user',
          active: !data.disabled,
          disabled: data.disabled || false,
          createdAt: data.createdAt,
          lastLogin: data.lastLoginAt ? data.lastLoginAt.toDate().toLocaleString('fr-FR') : 'Jamais',
          activity: data.lastLoginAt ? 'Connexion récente' : 'Aucune activité disponible',
        };
      });
      setUsers(fetchedUsers);
    }, (err) => console.error('Erreur Firestore utilisateurs :', err));

    return () => unsubscribe();
  }, []);

  const toggleUserActive = async (uid) => {
    const userDoc = doc(db, 'users', uid);
    const targetUser = users.find((user) => user.uid === uid);
    if (!targetUser) return;
    await updateDoc(userDoc, { disabled: !targetUser.disabled });
    if (selectedUser?.uid === uid) {
      setSelectedUser({ ...selectedUser, active: targetUser.disabled, disabled: !targetUser.disabled });
    }
  };

  const changeRole = async (uid, role) => {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, { role });
    if (selectedUser?.uid === uid) {
      setSelectedUser({ ...selectedUser, role });
    }
  };

  const removeUser = async (uid) => {
    await deleteDoc(doc(db, 'users', uid));
    if (selectedUser?.uid === uid) {
      setSelectedUser(null);
    }
  };

  const addOrUpdateModel = () => {
    if (!newModel.name.trim() || !newModel.version.trim()) return;
    if (editModelId) {
      setModels((prev) => prev.map((model) =>
        model.id === editModelId ? { ...model, ...newModel } : model
      ));
      setEditModelId(null);
    } else {
      setModels((prev) => [
        ...prev,
        { id: Date.now(), ...newModel },
      ]);
    }
    setNewModel({ name: '', version: '', status: 'Actif', description: '' });
  };

  const editModel = (model) => {
    setEditModelId(model.id);
    setNewModel({ name: model.name, version: model.version, status: model.status, description: model.description });
  };

  const deleteModel = (id) => {
    setModels((prev) => prev.filter((model) => model.id !== id));
    if (editModelId === id) {
      setEditModelId(null);
      setNewModel({ name: '', version: '', status: 'Actif', description: '' });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = [user.firstName, user.lastName, user.email].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? user.active : !user.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 animate-fadeIn">
        <div className="rounded-3xl bg-red-50 border border-red-100 p-6">
          <h2 className="text-xl font-bold text-red-700">Accès refusé</h2>
          <p className="mt-2 text-sm text-red-600">Cette section est réservée aux administrateurs. Retournez à l’espace utilisateur normal.</p>
          <button onClick={() => setCurrentPage('accueil')} className="mt-4 inline-flex items-center gap-2 px-4 py-3 rounded-3xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition">
            <ArrowLeftCircle size={18} /> Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-4 py-6 sm:px-8 pb-20 animate-fadeIn">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="rounded-[2rem] bg-gradient-to-r from-emerald-700 to-slate-900 text-white p-8 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80">
                <ShieldCheck size={16} /> Back-office admin
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold">Espace administration</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">Gestion centralisée des utilisateurs, des synchronisations de données, des modèles IA et des statistiques d’usage.</p>
            </div>
            <div className="rounded-[2rem] bg-white/10 p-4 text-left sm:text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Utilisateur connecté</p>
              <p className="mt-2 text-xl font-semibold">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-sm text-white/70">{currentUser.email}</p>
            </div>
          </div>
        </header>

        <div className="flex items-start justify-between gap-4">
          <button onClick={() => setSidebarOpen(true)} className="xl:hidden rounded-3xl bg-white/90 px-4 py-2 text-sm font-semibold shadow-sm">Sections</button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <aside className="relative">
            {/* Mobile overlay sidebar (animated) */}
            <div className={`fixed inset-0 z-40 p-6 overflow-auto bg-white transform transition-transform duration-300 xl:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} role="dialog" aria-modal="true">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Sections</h2>
                <button onClick={() => setSidebarOpen(false)} className="rounded-full bg-slate-100 p-2" aria-label="Fermer">
                  <XCircle size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-[2rem] bg-white p-5 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold">Sections</h2>
                  <div className="mt-4 space-y-3">
                    {[
                      { key: 'users', label: 'Utilisateurs', icon: Users },
                      { key: 'ia', label: 'Données & IA', icon: Cpu },
                      { key: 'stats', label: 'Statistiques', icon: BarChart3 },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => { setSelectedSection(item.key); setSidebarOpen(false); }}
                        className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${selectedSection === item.key ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                      >
                        <item.icon size={18} />
                        <span className="font-semibold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-5 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold">Accès rapide</h2>
                  <div className="mt-4 space-y-3">
                    <button onClick={() => { setSelectedSection('users'); setSidebarOpen(false); }} className="flex w-full items-center justify-between rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
                      Utilisateurs
                      <Users size={16} />
                    </button>
                    <button onClick={() => { setSelectedSection('ia'); setSidebarOpen(false); }} className="flex w-full items-center justify-between rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
                      Modèles IA
                      <ServerCog size={16} />
                    </button>
                    <button onClick={() => { setSelectedSection('stats'); setSidebarOpen(false); }} className="flex w-full items-center justify-between rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
                      Statistiques
                      <BarChart3 size={16} />
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-5 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-bold">Services</h2>
                  <div className="mt-4 space-y-3">
                    {sampleServiceStatus.map((service) => (
                      <div key={service.id} className="rounded-3xl bg-slate-50 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{service.name}</p>
                          <p className="text-xs text-slate-500">Statut</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${service.status === 'Actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{service.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop aside */}
            <div className="hidden xl:block space-y-4">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold">Sections</h2>
                <div className="mt-4 space-y-3">
                  {[
                    { key: 'users', label: 'Utilisateurs', icon: Users },
                    { key: 'ia', label: 'Données & IA', icon: Cpu },
                    { key: 'stats', label: 'Statistiques', icon: BarChart3 },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setSelectedSection(item.key)}
                      className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left transition ${selectedSection === item.key ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                    >
                      <item.icon size={18} />
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-5 shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold">Accès rapide</h2>
                <div className="mt-4 space-y-3">
                  <button onClick={() => setSelectedSection('users')} className="flex w-full items-center justify-between rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
                    Utilisateurs
                    <Users size={16} />
                  </button>
                  <button onClick={() => setSelectedSection('ia')} className="flex w-full items-center justify-between rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
                    Modèles IA
                    <ServerCog size={16} />
                  </button>
                  <button onClick={() => setSelectedSection('stats')} className="flex w-full items-center justify-between rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
                    Statistiques
                    <BarChart3 size={16} />
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-5 shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold">Services</h2>
                <div className="mt-4 space-y-3">
                  {sampleServiceStatus.map((service) => (
                    <div key={service.id} className="rounded-3xl bg-slate-50 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{service.name}</p>
                        <p className="text-xs text-slate-500">Statut</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${service.status === 'Actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{service.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-6 min-w-0">
            {selectedSection === 'users' && (
              <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200 min-w-0">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
                    <p className="mt-2 text-sm text-slate-600">Rechercher, filtrer, modifier les rôles et suivre l’activité des comptes.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Utilisateurs actifs</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{users.filter((user) => user.active).length}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Admins</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{users.filter((user) => user.role === 'admin').length}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Inactifs</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{users.filter((user) => !user.active).length}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Rechercher par nom, email..."
                          className="w-full bg-transparent pl-11 text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <option value="all">Tous les rôles</option>
                          <option value="admin">Admin</option>
                          <option value="user">Utilisateur</option>
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <option value="all">Tous les statuts</option>
                          <option value="active">Actifs</option>
                          <option value="inactive">Désactivés</option>
                        </select>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 overflow-hidden">
                      <div className="hidden sm:grid gap-0 text-xs uppercase tracking-[0.2em] bg-slate-100 text-slate-500 grid-cols-[1.5fr_1fr_1fr_120px_120px] px-4 py-3 sm:min-w-[720px]">
                        <span>Compte</span>
                        <span>Rôle</span>
                        <span>Statut</span>
                        <span className="text-center">Actions</span>
                        <span className="text-center">Détails</span>
                      </div>
                      <div className="divide-y divide-slate-200 bg-white">
                        {filteredUsers.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-slate-500">Aucun utilisateur trouvé.</div>
                        ) : filteredUsers.map((user) => (
                          <div key={user.uid}>
                            {/* Desktop / Tablet row */}
                            <div className="hidden sm:grid items-center gap-2 px-4 py-4 text-sm text-slate-700 grid-cols-[1.5fr_1fr_1fr_120px_120px] sm:min-w-[720px]">
                              <div>
                                <p className="font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                              <select value={user.role} onChange={(e) => changeRole(user.uid, e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                <option value="user">Utilisateur</option>
                                <option value="admin">Administrateur</option>
                              </select>
                              <button onClick={() => toggleUserActive(user.uid)} className={`w-full rounded-2xl px-3 py-2 text-sm font-semibold ${user.active ? 'bg-emerald-600 text-white' : 'bg-red-100 text-red-700'}`}>
                                {user.active ? 'Actif' : 'Désactivé'}
                              </button>
                              <button onClick={() => removeUser(user.uid)} className="rounded-3xl bg-red-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700 hover:bg-red-200 transition">
                                Supprimer
                              </button>
                              <button onClick={() => setSelectedUser(user)} className="rounded-3xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                                Voir
                              </button>
                            </div>

                            {/* Mobile card */}
                            <div className="sm:hidden px-4 py-4">
                              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-slate-500">{user.role}</p>
                                    <p className={`mt-1 text-sm font-semibold ${user.active ? 'text-emerald-700' : 'text-red-600'}`}>{user.active ? 'Actif' : 'Désactivé'}</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button onClick={() => toggleUserActive(user.uid)} className="flex-1 rounded-3xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{user.active ? 'Désactiver' : 'Activer'}</button>
                                  <button onClick={() => setSelectedUser(user)} className="flex-1 rounded-3xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Détails</button>
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <button onClick={() => removeUser(user.uid)} className="flex-1 rounded-3xl bg-red-100 px-3 py-2 text-xs font-bold text-red-700">Supprimer</button>
                                  <select value={user.role} onChange={(e) => changeRole(user.uid, e.target.value)} className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                    <option value="user">Utilisateur</option>
                                    <option value="admin">Administrateur</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                    <div>
                      <h3 className="text-lg font-bold">Détail du compte</h3>
                      <p className="mt-2 text-sm text-slate-600">Informations récentes et activité du compte sélectionné.</p>
                    </div>
                    {selectedUser ? (
                      <div className="rounded-[2rem] bg-white p-5 shadow-sm">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
                        <h3 className="mt-3 text-xl font-bold text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                        <p className="text-sm text-slate-500">{selectedUser.email}</p>
                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          <p><span className="font-semibold">Statut :</span> {selectedUser.active ? 'Actif' : 'Désactivé'}</p>
                          <p><span className="font-semibold">Dernière connexion :</span> {selectedUser.lastLogin}</p>
                          <p><span className="font-semibold">Activité récente :</span> {selectedUser.activity}</p>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button onClick={() => toggleUserActive(selectedUser.uid)} className="flex-1 rounded-3xl bg-emerald-600 px-4 py-3 text-white text-sm font-semibold hover:bg-emerald-700 transition">{selectedUser.active ? 'Désactiver' : 'Activer'}</button>
                          <button onClick={() => setSelectedUser(null)} className="flex-1 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Fermer</button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[2rem] bg-white p-5 text-sm text-slate-600">
                        Sélectionnez un utilisateur pour afficher ses informations détaillées.
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            )}

            {selectedSection === 'ia' && (
              <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200 min-w-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Gestion des données et modèles IA</h2>
                    <p className="mt-2 text-sm text-slate-600">Surveillez les synchronisations, configurez les modèles et suivez l’historique des traitements.</p>
                  </div>
                  <button onClick={() => setSelectedSection('stats')} className="inline-flex items-center gap-2 rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                    <Sparkles size={18} /> Voir les statistiques
                  </button>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-bold">Synchronisations & API</h3>
                    <div className="space-y-3">
                      {sampleSyncEvents.map((event) => (
                        <div key={event.id} className="rounded-3xl bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{event.label}</p>
                              <p className="text-sm text-slate-500">{event.detail}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.status === 'Réussie' ? 'bg-emerald-100 text-emerald-700' : event.status === 'En cours' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{event.status}</span>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">{event.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-bold">Suivi des traitements IA</h3>
                    <div className="mt-4 space-y-3">
                      {sampleModelHistory.map((item) => (
                        <div key={item.id} className="rounded-3xl bg-white p-4 shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                          <p className="text-xs text-slate-500">{item.model} • {item.author}</p>
                          <p className="mt-2 text-xs text-slate-400">{item.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">Modèles IA</h3>
                        <p className="mt-1 text-sm text-slate-500">Ajoutez, modifiez ou supprimez les modèles disponibles.</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{models.length} modèles</span>
                    </div>
                    <div className="mt-5 space-y-4">
                      {models.map((model) => (
                        <div key={model.id} className="rounded-3xl border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{model.name}</p>
                              <p className="text-xs text-slate-500">Version {model.version} • {model.status}</p>
                            </div>
                            <div className="flex gap-2 flex-col sm:flex-row">
                              <button onClick={() => editModel(model)} className="w-full sm:w-auto rounded-3xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"><Edit3 size={14} /></button>
                              <button onClick={() => deleteModel(model.id)} className="w-full sm:w-auto rounded-3xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 transition"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">{model.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-bold">Configurer un modèle</h3>
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">Nom du modèle</label>
                      <input
                        value={newModel.name}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                        placeholder="Ex. Détection stress hydrique"
                      />
                      <label className="block text-sm font-semibold text-slate-700">Version</label>
                      <input
                        value={newModel.version}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, version: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                        placeholder="Ex. v3.0"
                      />
                      <label className="block text-sm font-semibold text-slate-700">Statut</label>
                      <select
                        value={newModel.status}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                      >
                        <option>Actif</option>
                        <option>Bêta</option>
                        <option>Archivés</option>
                      </select>
                      <label className="block text-sm font-semibold text-slate-700">Description</label>
                      <textarea
                        value={newModel.description}
                        onChange={(e) => setNewModel((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none min-h-[120px]"
                        placeholder="Décrivez le rôle du modèle"
                      />
                      <button onClick={addOrUpdateModel} className="w-full rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                        {editModelId ? 'Mettre à jour le modèle' : 'Ajouter un modèle'}
                      </button>
                      {editModelId && (
                        <button onClick={() => { setEditModelId(null); setNewModel({ name: '', version: '', status: 'Actif', description: '' }); }} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selectedSection === 'stats' && (
              <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200 min-w-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Statistiques d’usage</h2>
                    <p className="mt-2 text-sm text-slate-600">Vue d’ensemble des utilisateurs, des connexions, et des interactions du back-office.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-500">Connexions</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{sampleStats.totalLogins}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-500">Synchronisations</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{sampleStats.cloudSyncs}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-500">Posts forum</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{sampleStats.forumPosts}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-[2rem] bg-emerald-600 p-5 text-white shadow-xl text-center">
                    <p className="text-sm uppercase tracking-[0.2em]">Utilisateurs actifs</p>
                    <p className="mt-4 text-4xl font-bold">{sampleStats.activeUsers}</p>
                    <p className="mt-2 text-sm text-white/80">Sur le dernier mois</p>
                  </div>
                  <div className="rounded-[2rem] bg-slate-50 p-5 shadow-sm border border-slate-200 text-center">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Utilisation IA</p>
                    <p className="mt-4 text-4xl font-bold text-slate-900">{sampleStats.iaUsage}</p>
                    <p className="mt-2 text-sm text-slate-500">Fonctionnalités IA activées</p>
                  </div>
                  <div className="rounded-[2rem] bg-slate-50 p-5 shadow-sm border border-slate-200 text-center">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Activité récente</p>
                    <p className="mt-4 text-4xl font-bold text-slate-900">{sampleStats.recentActions}</p>
                    <p className="mt-2 text-sm text-slate-500">Actions administratives</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">Tendances d’utilisation</h3>
                        <p className="mt-1 text-sm text-slate-500">Répartition des fonctionnalités les plus utilisées.</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">Top 3</span>
                    </div>
                    <div className="mt-5 space-y-4">
                      {['Connexion', 'Forum', 'IA'].map((item, index) => (
                        <div key={item} className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-700">
                            <span>{item}</span>
                            <span>{[76, 58, 42][index]}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div className={`h-2 rounded-full ${index === 0 ? 'bg-emerald-600' : index === 1 ? 'bg-sky-500' : 'bg-violet-500'}`} style={{ width: `${[76, 58, 42][index]}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">Suivi des connexions</h3>
                        <p className="mt-1 text-sm text-slate-500">Activité session par jour.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">En direct</span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {['+32', '+21', '+18', '+12', '+7'].map((value, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm">
                          <span className="text-sm text-slate-600">Jour -{idx + 1}</span>
                          <span className="text-lg font-bold text-slate-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
