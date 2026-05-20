import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Leaf, CloudRain, PenTool, X, Check, Map as MapIcon } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { calculateRisks, getCenter } from '../utils/helpers';

const isValidLatLng = (value) => Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number';

const SatelliteMap = ({ zones, sensorData, mapMode, isDrawing, currentPoints, onAddPoint }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const zonesLayer = useRef(null);
  const drawLayer = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initMap = () => {
      if (!isMounted || !mapContainer.current) return;
      if (!map.current) {
        map.current = window.L.map(mapContainer.current, { zoomControl: false, attributionControl: false }).setView([44.888, -0.162], 15);
        window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map.current);
        zonesLayer.current = window.L.featureGroup().addTo(map.current);
        drawLayer.current = window.L.featureGroup().addTo(map.current);
        setMapReady(true);
      }
    };

    if (!window.L) {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        if (!document.querySelector('link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]')) {
          const link = document.createElement('link'); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
        initMap();
      };
      document.head.appendChild(script);
    } else { initMap(); }

    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !map.current || !zonesLayer.current) return;
    
    zonesLayer.current.clearLayers();
    const latestData = sensorData || { baseTemp: 14, baseHumidity: 48, windSpeed: 5, windDir: 350 };

    zones.forEach(zone => {
      if (!zone || typeof zone !== 'object') return;
      const points = Array.isArray(zone.points) ? zone.points.filter(isValidLatLng) : [];
      const bounds = Array.isArray(zone.bounds) && zone.bounds.every(isValidLatLng) ? zone.bounds : null;
      if (zone.type === 'polygon' && points.length < 3) return;
      if (zone.type !== 'polygon' && !bounds) return;

      const temp = latestData.baseTemp + (typeof zone.tempOffset === 'number' ? zone.tempOffset : 0);
      const hum = latestData.baseHumidity + (typeof zone.humOffset === 'number' ? zone.humOffset : 0);
      const risks = calculateRisks(temp, hum, zone.elevation);
      
      let color = '#10b981'; 
      let popupText = '';
      let showAlert = false;

      if (mapMode === 'maladie') {
        if (risks.diseaseRisk > 60) { color = '#ef4444'; showAlert = true; } 
        else if (risks.diseaseRisk > 15) { color = '#f59e0b'; }
        popupText = risks.diseaseRisk > 0 ? `🦠 ${risks.diseaseName} : <span style="font-size: 15px; font-weight: 900;">${risks.diseaseRisk}%</span>` : `🌿 Aucun risque détecté`;
      } else if (mapMode === 'meteo') {
        if (risks.weatherName.includes("Gel")) {
          if (risks.weatherRisk > 60) { color = '#2563eb'; showAlert = true; }
          else if (risks.weatherRisk > 15) { color = '#60a5fa'; }
        } else if (risks.weatherName.includes("Échaudage") || risks.weatherName.includes("hydrique")) {
          if (risks.weatherRisk > 60) { color = '#ea580c'; showAlert = true; }
          else if (risks.weatherRisk > 15) { color = '#fb923c'; }
        }
        popupText = risks.weatherRisk > 0 ? `⚠️ ${risks.weatherName} : <span style="font-size: 15px; font-weight: 900;">${risks.weatherRisk}%</span>` : `☀️ Conditions optimales`;
      }

      const style = { color: 'white', weight: 1.5, fillColor: color, fillOpacity: 0.5 };
      let leafletShape = zone.type === 'polygon' ? window.L.polygon(zone.points, style) : window.L.rectangle(zone.bounds, style);

      leafletShape.addTo(zonesLayer.current).bindPopup(`
          <div style="font-family: sans-serif; padding: 2px;">
            <h3 style="margin: 2px 0 6px 0; font-size: 14px; color: #1f2937;">${zone.name}</h3>
            <div style="padding: 6px; border-radius: 4px; background: ${showAlert ? (color === '#ef4444' ? '#fee2e2' : color === '#2563eb' ? '#dbeafe' : '#ffedd5') : '#f8fafc'}; color: ${showAlert ? (color === '#ef4444' ? '#991b1b' : color === '#2563eb' ? '#1e40af' : '#9a3412') : '#334155'}; font-weight: 600; font-size: 12px; margin-bottom: 6px; border: 1px solid ${color}40;">
              ${popupText}
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 4px; text-align: right;">Basé sur capteur Weenat</div>
          </div>
      `);

      if (showAlert) {
        const center = getCenter(zone.points || zone.bounds);
        const icon = window.L.divIcon({
          className: 'custom-alert',
          html: `<div style="background: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid ${color}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">⚠️</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        window.L.marker([center.lat, center.lng], { icon }).addTo(zonesLayer.current);
      }
    });
  }, [mapReady, zones, sensorData, mapMode]);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    const container = document.querySelector('.leaflet-container');
    const handleMapClick = (e) => {
      if (isDrawing) onAddPoint([e.latlng.lat, e.latlng.lng]);
    };

    if (isDrawing) {
      container.style.cursor = 'crosshair';
      map.current.on('click', handleMapClick);
    } else {
      container.style.cursor = '';
      map.current.off('click', handleMapClick);
    }
    return () => { if (map.current) map.current.off('click', handleMapClick); };
  }, [mapReady, isDrawing, onAddPoint]);

  useEffect(() => {
    if (!mapReady || !drawLayer.current) return;
    drawLayer.current.clearLayers();
    if (isDrawing && currentPoints.length > 0) {
      const validPoints = currentPoints.filter(isValidLatLng);
      if (validPoints.length === 0) return;
      validPoints.forEach(p => { window.L.circleMarker(p, { radius: 5, color: '#10b981', fillColor: 'white', fillOpacity: 1 }).addTo(drawLayer.current); });
      if (validPoints.length > 1) { window.L.polyline(validPoints, { color: '#10b981', weight: 3, dashArray: '5, 5' }).addTo(drawLayer.current); }
      if (validPoints.length >= 3) { window.L.polygon(validPoints, { color: '#10b981', weight: 1, fillColor: '#10b981', fillOpacity: 0.3 }).addTo(drawLayer.current); }
    }
  }, [mapReady, isDrawing, currentPoints]);

  return <div ref={mapContainer} className="w-full h-full bg-slate-800 z-0 relative rounded-2xl" />;
};

const MapView = ({ sensorData, zones, setZones }) => {
  const [mapMode, setMapMode] = useState('maladie');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotEstate, setNewPlotEstate] = useState('Château Canon');

  const handleAddPoint = useCallback((pt) => setCurrentPoints(prev => [...prev, pt]), []);
  const startDrawing = () => { setIsDrawing(true); setCurrentPoints([]); };
  const cancelDrawing = () => { setIsDrawing(false); setCurrentPoints([]); };
  const finishDrawing = () => { if (currentPoints.length >= 3) { setIsDrawing(false); setShowModal(true); } };

  const saveNewPlot = async () => {
    if (!newPlotName.trim()) return;
    const newZone = {
      id: 'custom-' + Date.now(),
      type: 'polygon',
      points: currentPoints,
      estate: newPlotEstate,
      name: newPlotName,
      plotId: '40055',
      elevation: 75,
      tempOffset: (Math.random() * 2) - 1,
      humOffset: Math.floor(Math.random() * 10) - 5
    };
    
    setZones(prev => [...prev, newZone]);
    setShowModal(false); setNewPlotName(''); setCurrentPoints([]);

    if (!db) {
      console.warn('Sauvegarde locale de la parcelle : Firebase non configuré.');
      return;
    }

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'map_zones', newZone.id), newZone);
    } catch (err) { console.error("Erreur sauvegarde tracé:", err); }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn p-4 space-y-4 relative">
      <div className="flex items-center gap-2 z-10 relative overflow-x-auto no-scrollbar pb-1">
        <div className="flex flex-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 min-w-max">
          <button onClick={() => {if(!isDrawing) setMapMode('maladie')}} className={`px-3 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-lg transition-colors ${mapMode === 'maladie' ? 'bg-red-50 text-red-700 border border-red-100' : 'text-gray-500 hover:bg-gray-50'} ${isDrawing ? 'opacity-50' : ''}`}><Leaf size={14} />Risque Maladies</button>
          <button onClick={() => {if(!isDrawing) setMapMode('meteo')}} className={`px-3 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-lg transition-colors ${mapMode === 'meteo' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'text-gray-500 hover:bg-gray-50'} ${isDrawing ? 'opacity-50' : ''}`}><CloudRain size={14} />Risque Météo</button>
        </div>
        {!isDrawing && <button onClick={startDrawing} className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md hover:bg-emerald-700 transition-colors flex-shrink-0"><PenTool size={18} /></button>}
      </div>

      {isDrawing && (
        <div className="bg-emerald-800 text-white p-3 rounded-xl shadow-lg flex justify-between items-center z-20 animate-scaleIn">
          <div className="text-xs">
            <span className="font-bold">Mode Tracé actif</span><br/>
            <span className="opacity-80">Cliquez pour tracer.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={cancelDrawing} className="p-1.5 bg-red-500/20 text-red-100 rounded-lg hover:bg-red-500/40"><X size={16} /></button>
            <button onClick={finishDrawing} disabled={currentPoints.length < 3} className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold ${currentPoints.length >= 3 ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-emerald-900/50 text-emerald-700 cursor-not-allowed'}`}><Check size={16} /> OK</button>
          </div>
        </div>
      )}

      <div className={`flex-1 rounded-2xl overflow-hidden shadow-inner border-4 ${isDrawing ? 'border-emerald-400' : 'border-white'} relative z-0 transition-colors duration-300`}>
        <SatelliteMap zones={zones} sensorData={sensorData} mapMode={mapMode} isDrawing={isDrawing} currentPoints={currentPoints} onAddPoint={handleAddPoint} />
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn fixed">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-700 mb-2">
              <MapIcon size={24} />
              <h3 className="text-lg font-bold">Nouvelle Parcelle</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Domaine / Château</label>
                <select className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800" value={newPlotEstate} onChange={(e) => setNewPlotEstate(e.target.value)}>
                  <option>Château Canon</option>
                  <option>Château Berliquet</option>
                  <option>Pôle Viticole</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nom de la parcelle</label>
                <input type="text" placeholder="Ex: B10 - Les Murailles" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500" value={newPlotName} onChange={(e) => setNewPlotName(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">Annuler</button>
              <button onClick={saveNewPlot} disabled={!newPlotName.trim()} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;