import React, { useState } from 'react';
import { Wifi, Link as LinkIcon, CheckCircle, Database, LogOut } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

const AdminView = ({ zones, setCurrentPage }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearAllZones = () => {
    zones.forEach(async (zone) => {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'map_zones', zone.id));
      } catch (e) { console.error(e); }
    });
    setShowClearConfirm(false);
  };

  return (
    <div className="p-6 space-y-4 pb-20 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Paramètres</h2>
      
      {/* MODULE : INTÉGRATIONS IOT */}
      <div className="w-full p-5 bg-white rounded-2xl border border-emerald-100 flex flex-col gap-3 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10"><Wifi size={64} /></div>
        <div className="flex items-center gap-3 relative z-10">
          <LinkIcon size={20} className="text-emerald-600" />
          <span className="font-bold text-gray-800">Intégrations Capteurs (IoT)</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-tight relative z-10 mb-2">
          Connectez votre propre station météo (Agnostique). L'IA Vitinova utilisera ces données pour des analyses intra-parcellaires de haute précision au lieu de la météo régionale.
        </p>
        
        <div className="space-y-2 relative z-10">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Marque de la station</label>
          <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option>Weenat</option>
            <option>Sencrop</option>
            <option>Davis Instruments</option>
            <option>Autre (API Custom)</option>
          </select>
        </div>
        
        <div className="space-y-2 relative z-10">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Clé API (Token)</label>
          <input type="password" value="************************" readOnly className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 focus:outline-none" />
        </div>

        <button className="w-full py-3 mt-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
          <CheckCircle size={16} /> Connecté à Weenat (Château Canon)
        </button>
      </div>

      <div className="w-full p-5 bg-white rounded-2xl border border-gray-100 flex flex-col gap-3 shadow-sm mt-4">
        <div className="flex items-center gap-3">
          <Database size={20} className="text-blue-600" />
          <span className="font-bold text-gray-800">Synchronisation Cloud</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-tight">
          Vos tracés de parcelles sont automatiquement enregistrés et synchronisés sur les serveurs Firebase. 
        </p>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl mt-2 border border-blue-100">
          <span className="text-xs font-bold text-blue-800">Parcelles sauvegardées :</span>
          <span className="text-sm font-black text-blue-600">{zones?.length || 0}</span>
        </div>

        {!showClearConfirm ? (
          <button onClick={() => setShowClearConfirm(true)} className="w-full py-3 mt-2 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50">
            Vider le serveur (Effacer la carte)
          </button>
        ) : (
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Annuler</button>
            <button onClick={clearAllZones} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold">Confirmer</button>
          </div>
        )}
      </div>

      <button onClick={() => setCurrentPage('accueil')} className="w-full mt-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex justify-center items-center gap-2">
        <LogOut size={18} /> Déconnexion
      </button>
    </div>
  );
};

export default AdminView;