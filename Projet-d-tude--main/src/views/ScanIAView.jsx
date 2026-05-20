import React, { useState, useRef } from 'react';
import { Leaf, Camera, RefreshCw, X, AlertTriangle } from 'lucide-react';

const ScanIAView = () => {
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const analyzeImage = async (base64, mimeType) => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    // Remplacez par votre vraie clé Gemini en local
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const prompt = `Tu es un expert en pathologie viticole. Analyse cette image de vigne. 
    Cherche spécifiquement : maladies fongiques (Black Rot, Mildiou, Oïdium), maladies du bois (Esca), maladies bactériennes (Flavescence dorée), ravageurs (Araignées) ou stress (Gel, Carences).
    Fournis un JSON avec : type (Maladie/Ravageur/Stress/Sain), name (nom précis), confidence (%), action (conseil court).
    TRES IMPORTANT : "confidence" doit TOUJOURS être un nombre entier entre 0 et 100.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING" },
            name: { type: "STRING" },
            confidence: { type: "NUMBER" },
            action: { type: "STRING" }
          },
          required: ["type", "name", "confidence", "action"]
        }
      }
    };

    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Erreur réseau");
      const data = await response.json();
      const aiResponse = JSON.parse(data.candidates[0].content.parts[0].text);
      setResult(aiResponse);
    } catch (err) {
      setError("Erreur lors de l'analyse IA. Vérifiez votre connexion.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        const mimeType = file.type;
        setImage(event.target.result);
        analyzeImage(base64, mimeType);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Scan IA Végétal</h2>
        <Leaf className="text-emerald-600" size={28} />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        {!image ? (
          <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-emerald-200 bg-emerald-50 rounded-2xl h-64 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-100 transition-all">
            <div className="p-4 bg-white rounded-full text-emerald-600 shadow-sm"><Camera size={32} /></div>
            <p className="text-sm font-bold text-emerald-800">Prendre ou charger une photo</p>
            <p className="text-[10px] text-emerald-600">Feuille, grappe ou bois coupé</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-md">
              <img src={image} alt="Vigne" className="w-full h-64 object-cover" />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                  <RefreshCw className="animate-spin mb-2" size={32} />
                  <span className="text-xs font-bold uppercase tracking-widest">Analyse IA en cours...</span>
                </div>
              )}
              <button onClick={() => {setImage(null); setResult(null); setError(null);}} className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"><X size={16} /></button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {result && (
              <div className={`p-5 rounded-2xl border-l-4 shadow-sm animate-scaleIn ${String(result.type) === 'Sain' ? 'bg-emerald-50 border-emerald-500' : 'bg-orange-50 border-orange-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">{String(result.type)}</span>
                  <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-lg border border-gray-100">
                    {Number(result.confidence) <= 1 ? Math.round(Number(result.confidence) * 100) : Math.round(Number(result.confidence))}% confiance
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{String(result.name)}</h3>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Action recommandée :</p>
                  <p className="text-sm text-gray-700 leading-snug">{String(result.action)}</p>
                </div>
              </div>
            )}
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} />
      </div>
    </div>
  );
};

export default ScanIAView;