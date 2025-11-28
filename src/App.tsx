import React, { useState, useEffect } from 'react';
import { CardData } from './types';
import { fetchDOASDCards } from './services/api';
import { useGameEngine } from './hooks/useGameEngine';
import { Card } from './components/Card';
import { Zone } from './components/Zone';

const App: React.FC = () => {
  const [view, setView] = useState<'builder' | 'game'>('builder');
  const [library, setLibrary] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [builtDeck, setBuiltDeck] = useState<{ material: CardData[], main: CardData[] }>({ material: [], main: [] });

  const { state, actions } = useGameEngine();

  // Initial load effect
  useEffect(() => {
    // Optional: Auto-fetch or setup initial state
  }, []);

  const handleSync = async () => {
    setLoading(true);
    const cards = await fetchDOASDCards();
    setLibrary(cards);
    setLoading(false);
  };

  const addToDeck = (card: CardData) => {
    const isMat = card.types.some(t => t.includes('CHAMPION') || t.includes('REGALIA'));
    if (isMat) {
      if (builtDeck.material.length >= 12) return alert("Material Deck Full");
      setBuiltDeck(prev => ({ ...prev, material: [...prev.material, card] }));
    } else {
      if (builtDeck.main.length >= 60) return alert("Main Deck Full");
      setBuiltDeck(prev => ({ ...prev, main: [...prev.main, card] }));
    }
  };

  const removeFromDeck = (index: number, type: 'material' | 'main') => {
    if (type === 'material') {
      const newMat = [...builtDeck.material];
      newMat.splice(index, 1);
      setBuiltDeck(prev => ({ ...prev, material: newMat }));
    } else {
      const newMain = [...builtDeck.main];
      newMain.splice(index, 1);
      setBuiltDeck(prev => ({ ...prev, main: newMain }));
    }
  };

  const startGame = () => {
    if (builtDeck.material.length === 0 && builtDeck.main.length === 0) return alert("Deck is empty!");
    actions.loadDeck(builtDeck.material, builtDeck.main);
    setView('game');
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden flex flex-col bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      
      {/* Header */}
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-50 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center font-bold shadow text-white">GA</div>
            <h1 className="font-bold tracking-wide hidden md:block text-white">GA Simulator <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">Sandbox Project</span></h1>
        </div>
        <div className="flex gap-2">
            {view === 'builder' ? (
                <button onClick={startGame} className="px-4 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-bold shadow">Start Sandbox</button>
            ) : (
                <button onClick={() => setView('builder')} className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">Edit Deck</button>
            )}
        </div>
      </header>

      {/* Builder View */}
      {view === 'builder' && (
        <div className="flex-1 flex overflow-hidden">
            <div className="w-2/3 bg-gray-800/50 border-r border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-700 flex justify-between items-center gap-2">
                    <h2 className="font-bold text-gray-300 whitespace-nowrap">Card Library ({library.length})</h2>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm flex-1 max-w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={handleSync} disabled={loading} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold whitespace-nowrap">
                        {loading ? "Fetching..." : "Sync DOASD"}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
                    {library
                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(card => (
                        <div key={card.id} onClick={() => addToDeck(card)} className="group relative">
                             <Card data={{...card, uid: card.id, isRested: false}} interactable={false} />
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 cursor-pointer transition-colors rounded" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-1/3 bg-gray-900 p-4 overflow-y-auto">
                <div className="mb-4">
                    <h3 className="text-purple-400 font-bold text-sm mb-2">Material Deck ({builtDeck.material.length})</h3>
                    {builtDeck.material.map((c, i) => (
                        <div key={i} onClick={() => removeFromDeck(i, 'material')} className="text-xs text-gray-300 bg-gray-800 p-1 mb-1 rounded cursor-pointer hover:bg-red-900/50 transition">
                            {c.name}
                        </div>
                    ))}
                </div>
                <div>
                    <h3 className="text-green-400 font-bold text-sm mb-2">Main Deck ({builtDeck.main.length})</h3>
                    {builtDeck.main.map((c, i) => (
                        <div key={i} onClick={() => removeFromDeck(i, 'main')} className="text-xs text-gray-300 bg-gray-800 p-1 mb-1 rounded cursor-pointer hover:bg-red-900/50 transition">
                            {c.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Game View */}
      {view === 'game' && (
        <div className="flex-1 flex flex-col relative p-2 gap-2">
            <div className="h-20 border-b border-dashed border-gray-700 flex items-center justify-center opacity-30">
                <span className="text-gray-500 font-bold">OPPONENT AREA</span>
            </div>

            <div className="flex-1 flex gap-2 overflow-hidden">
                <div className="w-48 flex flex-col gap-2">
                     <div onClick={actions.drawMaterial} className="h-32 bg-purple-900/20 border border-purple-600/50 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-purple-900/40 transition select-none">
                        <span className="text-3xl font-bold text-purple-500 mb-2">M</span>
                        <span className="text-purple-300 text-xs">Deck ({state.materialDeck.length})</span>
                     </div>
                     <Zone title="Material Zone" zoneId="materialZone" cards={state.materialZone} onDropCard={actions.moveCard} onCardClick={actions.toggleRest} className="bg-purple-900/10 border-purple-500/30 flex-1" />
                </div>

                <Zone title="Battlefield" zoneId="battleZone" cards={state.battleZone} onDropCard={actions.moveCard} onCardClick={actions.toggleRest} className="bg-gray-800/30 flex-1 border-gray-500/50" />

                <div className="w-48 flex flex-col gap-2">
                    <div onClick={actions.drawCard} className="h-32 bg-green-900/20 border border-green-600/50 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-green-900/40 transition select-none">
                        <span className="text-3xl font-bold text-green-500 mb-2">D</span>
                        <span className="text-green-300 text-xs">Main Deck ({state.mainDeck.length})</span>
                     </div>
                     <div className="flex-1 flex flex-col gap-2">
                        <Zone title="Graveyard" zoneId="graveyard" cards={state.graveyard} onDropCard={actions.moveCard} onCardClick={actions.toggleRest} className="bg-black/30 flex-1" layout="stack" />
                        <Zone title="Memory" zoneId="memory" cards={state.memory} onDropCard={actions.moveCard} onCardClick={actions.toggleRest} className="bg-blue-900/10 border-blue-500/30 flex-1" layout="stack" />
                     </div>
                </div>
            </div>

            <div className="h-48 shrink-0">
                <Zone title="Hand" zoneId="hand" cards={state.hand} onDropCard={actions.moveCard} onCardClick={actions.toggleRest} className="h-full bg-black/40 border-gray-600/50" layout="row" />
            </div>
        </div>
      )}
    </div>
  );
};

export default App; // <--- 關鍵就是這一行，這是 main.tsx 能夠讀取它的原因