import React, { useState } from 'react';
import { 
  RefreshCw, Thermometer, Droplets, Wind, Navigation, 
  Activity, Map as MapIcon, MapPin, Trash2 
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { calculateRisks, getCardinalDirection } from '../utils/helpers';

const DashboardView = ({ sensorData, zones, onSimulateData }) => {
  const latestData = sensorData || { baseTemp: 14, baseHumidity: 48, windSpeed: 5, windDir: 350 };
  const estates = [...new Set(zones.map(z => z.estate))];
  
  // Fonction de suppression de parcelle depuis le dashboard
  const confirmDelete = async (zone) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'map_zones', zone.id));
    } catch (err) {
      console.error("Erreur suppression Firebase:", err);
    }
  };
  
  return (
    <div className="p-6 space-y-5 animate-fadeIn pb-12 relative">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Données IoT</h2>
          <button 
            onClick={onSimulateData} 
            className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition-colors shadow-sm active:scale-95"
          >
            <RefreshCw size={12} />
            Actualiser
          </button>
        </div>
        
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Source Ultra-Locale</p>
            <p className="text-[10px] text-emerald-600 font-medium">Station Weenat - Château Canon</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-orange-500 mb-2 relative z-10">
            <Thermometer size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Temp. Parcelle</span>
          </div>
          <p className="text-3xl font-black text-gray-800 relative z-10">{latestData.baseTemp.toFixed(1)}°C</p>
          <Thermometer className="absolute -bottom-2 -right-2 text-orange-50 opacity-50" size={80} />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-blue-500 mb-2 relative z-10">
            <Droplets size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Hum. Parcelle</span>
          </div>
          <p className="text-3xl font-black text-gray-800 relative z-10">{latestData.baseHumidity.toFixed(0)}%</p>
          <Droplets className="absolute -bottom-2 -right-2 text-blue-50 opacity-50" size={80} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
            <Wind size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Anémomètre IoT</div>
            <p className="text-xl font-black text-gray-800">{latestData.windSpeed.toFixed(1)} km/h</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cap Vectoriel</div>
          <div className="flex items-center gap-1 text-gray-700 font-bold">
            <Navigation size={16} style={{ transform: `rotate(${latestData.windDir + 180}deg)` }} className="text-indigo-500" />
            <span className="text-xs text-gray-600 font-semibold">Vent du {getCardinalDirection(latestData.windDir)}</span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Activity size={16} className="text-emerald-600" />
          Analyse des Risques par Parcelle
        </h3>
        
        {zones.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-500">
            <MapIcon className="mx-auto text-gray-300 mb-3" size={28} />
            <p className="text-sm font-bold">Aucune parcelle tracée.</p>
            <p className="text-[11px] mt-1">L'IA de risque utilise les données Weenat couplées à vos tracés géographiques.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {estates.map((estate) => (
              <React.Fragment key={estate}>
                <div className="p-3 bg-gray-50 border-y border-gray-200 flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-600" />
                  <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider">{estate}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {zones.filter(z => z.estate === estate).map(zone => {
                    const temp = latestData.baseTemp + zone.tempOffset;
                    const hum = latestData.baseHumidity + zone.humOffset;
                    const risks = calculateRisks(temp, hum, zone.elevation);
                    
                    return (
                      <div key={zone.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800 text-sm">{zone.name}</h4>
                            <button 
                              onClick={() => confirmDelete(zone)}
                              className="text-gray-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1"
                              title="Supprimer la parcelle"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-bold ${risks.diseaseRisk > 60 ? 'text-red-600' : risks.diseaseRisk > 15 ? 'text-orange-500' : 'text-emerald-600'}`}>
                            {risks.diseaseRisk > 0 ? `${risks.diseaseName} (${risks.diseaseRisk}%)` : '🌿 Sain'}
                          </div>
                          <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                            {temp.toFixed(1)}°C <span className="text-gray-300 mx-1">|</span> {hum.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;