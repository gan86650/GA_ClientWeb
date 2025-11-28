import React, { useState, useEffect } from 'react';
import { CardData, GameCard, GameState } from './types'; // Removed ZoneKey if not explicitly used
import { fetchDOASDCards } from './services/api';
import { useGameEngine } from './hooks/useGameEngine';
import { Card } from './components/Card';
import { Zone } from './components/Zone';

// --- Sub-Component: Material Selection Modal ---
const MaterialSelectionModal: React.FC<{
    isOpen: boolean;
    cards: GameCard[];
    onSelect: (cardUid: string) => void;
    onClose: () => void;
}> = ({ isOpen, cards, onSelect, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-purple-400">選擇 Material (Materialize)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {cards.length === 0 && <p className="col-span-full text-center text-gray-500">Material Deck 是空的</p>}
                    {cards.map(card => (
                        <div key={card.uid} onClick={() => onSelect(card.uid)} className="hover:scale-105 transition cursor-pointer">
                            <Card data={{ ...card, isRested: false }} interactable={false} size="md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Sub-Component: Player Board (可重複使用的半場) ---
const PlayerBoard: React.FC<{
    isOpponent?: boolean;
    state: GameState;
    actions: any; // Using any for simplicity in this context, ideally should be typed
    onOpenMaterialModal: () => void;
}> = ({ isOpponent = false, state, actions, onOpenMaterialModal }) => {
    
    // 對手區域不顯示手牌內容
    const displayState = isOpponent ? { ...state, hand: [] } : state; 

    return (
        <div className={`flex-1 flex flex-col gap-2 p-2 relative ${isOpponent ? 'rotate-180 pointer-events-none opacity-80 bg-black/20' : ''}`}>
            
            {/* 上半部：戰場與主要區域 */}
            <div className="flex-1 flex gap-4 h-full min-h-0">
                
                {/* [Layout] 左側：Material 系統 (加大空間 w-1/3) */}
                <div className="w-1/3 max-w-[350px] flex flex-col gap-2 transition-all duration-300">
                    {/* Material Deck */}
                    <div 
                        onClick={isOpponent ? undefined : onOpenMaterialModal} 
                        className="h-24 bg-purple-900/20 border-2 border-purple-500/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-900/40 hover:border-purple-400 transition group relative"
                    >
                        <span className="font-bold text-purple-400 tracking-wider">MATERIAL DECK</span>
                        <div className="absolute bottom-1 right-2 text-xs text-purple-300 bg-black/50 px-2 rounded-full">
                            {displayState.materialDeck.length}
                        </div>
                    </div>

                    {/* Material Zone (垂直堆疊顯示 Champion Level Up) */}
                    <div className="flex-1 bg-purple-900/5 border-2 border-dashed border-purple-500/20 rounded-lg p-2 relative overflow-visible">
                        <span className="absolute top-2 left-2 text-[10px] text-purple-500/50 font-bold uppercase">Material / Champion Stack</span>
                        <div className="mt-6 flex flex-col items-center gap-[-40px]">
                            {displayState.materialZone.map((card: GameCard, index: number) => (
                                <div 
                                    key={card.uid} 
                                    style={{ marginTop: index > 0 ? '-100px' : '0', zIndex: index }} 
                                    className="transition-transform hover:z-50 hover:translate-x-4"
                                >
                                    <Card 
                                        data={card} 
                                        onClick={() => actions.toggleRest(card.uid)}
                                        onDragStart={(e) => e.dataTransfer.setData('cardUid', card.uid)}
                                    />
                                </div>
                            ))}
                            {displayState.materialZone.length === 0 && (
                                <div className="text-purple-500/20 text-sm mt-10 text-center">空</div>
                            )}
                        </div>
                        <div 
                            className="absolute inset-0 z-0" 
                            onDragOver={(e) => e.preventDefault()} 
                            onDrop={(e) => {
                                e.preventDefault();
                                const uid = e.dataTransfer.getData('cardUid');
                                if(uid) actions.moveCard(uid, 'materialZone');
                            }} 
                        />
                    </div>
                </div>

                {/* 中間與右側容器 */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    
                    {/* 上層：戰場 + 牌堆 */}
                    <div className="flex-1 flex gap-2 min-h-0">
                        {/* [Layout] Battlefield (空間被左右壓縮) */}
                        <Zone 
                            title="BATTLEFIELD" 
                            zoneId="battleZone" 
                            cards={displayState.battleZone} 
                            onDropCard={actions.moveCard} 
                            onCardClick={actions.toggleRest} 
                            className="bg-gray-800/20 border-gray-600/30 flex-[3]" 
                        />

                        {/* [Layout] Right Column: Deck / Banish / Grave (加寬 w-48) */}
                        <div className="w-48 flex flex-col gap-2 shrink-0 transition-all duration-300">
                            {/* Main Deck */}
                            <div 
                                onClick={isOpponent ? undefined : actions.drawCard} 
                                className="h-20 bg-green-900/20 border-2 border-green-500/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-green-900/40 hover:border-green-400 transition"
                            >
                                <span className="font-bold text-green-500">DECK</span>
                                <span className="text-xs text-green-300">{displayState.mainDeck.length}</span>
                            </div>

                            {/* [New] Banish Zone */}
                            <Zone 
                                title="BANISH" 
                                zoneId="banished" 
                                cards={displayState.banished} 
                                onDropCard={actions.moveCard} 
                                onCardClick={actions.toggleRest} 
                                className="bg-red-900/10 border-red-500/20 flex-1" 
                                layout="stack" 
                            />

                            {/* Grave Zone */}
                            <Zone 
                                title="GRAVE" 
                                zoneId="graveyard" 
                                cards={displayState.graveyard} 
                                onDropCard={actions.moveCard} 
                                onCardClick={actions.toggleRest} 
                                className="bg-black/40 border-gray-700 flex-1" 
                                layout="stack" 
                            />
                        </div>
                    </div>

                    {/* 下層：Memory Zone */}
                    <div className="h-32 shrink-0">
                        <Zone 
                            title="MEMORY ZONE (COST)" 
                            zoneId="memory" 
                            cards={displayState.memory} 
                            onDropCard={actions.moveCard} 
                            onCardClick={actions.toggleRest} 
                            className="bg-blue-900/10 border-blue-500/20 w-full h-full" 
                            layout="row" 
                        />
                    </div>
                </div>
            </div>

            {/* 最下方：手牌 */}
            <div className="h-40 shrink-0 mt-1 relative z-50">
                {!isOpponent ? (
                    <Zone 
                        title="HAND" 
                        zoneId="hand" 
                        cards={displayState.hand} 
                        onDropCard={actions.moveCard} 
                        onCardClick={actions.toggleRest} 
                        className="h-full bg-black/60 border-gray-500/50 rounded-xl" 
                        layout="row" 
                    />
                ) : (
                    <div className="h-full bg-black/20 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center">
                        <span className="text-gray-600 font-bold">OPPONENT HAND (5)</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [view, setView] = useState<'builder' | 'game'>('builder');
  const [library, setLibrary] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isMatModalOpen, setMatModalOpen] = useState(false);

  const [builtDeck, setBuiltDeck] = useState<{ material: CardData[], main: CardData[] }>({ material: [], main: [] });

  const { state, actions } = useGameEngine();

  // --- 對手狀態 (Dummy State for Visuals) ---
  // 這確保對手區域是獨立的，不會跟著玩家變動
  const opponentDummyState: GameState = {
      materialDeck: Array(12).fill({} as any), // 模擬有 12 張牌
      mainDeck: Array(60).fill({} as any),     // 模擬有 60 張牌
      hand: Array(5).fill({} as any),          // 模擬有 5 張手牌
      materialZone: [],
      battleZone: [],
      graveyard: [],
      banished: [],
      memory: []
  };

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

  const handleMaterialSelect = (uid: string) => {
      actions.moveCard(uid, 'materialZone');
      setMatModalOpen(false);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden flex flex-col bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-50 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center font-bold text-xs shadow text-white">GA</div>
            <h1 className="font-bold tracking-wide hidden md:block text-white text-sm">GA Simulator</h1>
        </div>
        <div className="flex gap-2">
            {view === 'builder' ? (
                <button onClick={startGame} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-bold shadow text-white">Start Game</button>
            ) : (
                <button onClick={() => setView('builder')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white">Edit Deck</button>
            )}
        </div>
      </header>

      {/* --- Builder View --- */}
      {view === 'builder' && (
        <div className="flex-1 flex overflow-hidden">
            <div className="w-2/3 bg-gray-800/50 border-r border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-700 flex justify-between items-center gap-2">
                    <h2 className="font-bold text-gray-300 text-sm whitespace-nowrap">Library ({library.length})</h2>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm flex-1 max-w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={handleSync} disabled={loading} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold text-white whitespace-nowrap">
                        {loading ? "Syncing..." : "Sync DOASD"}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start scrollbar-hide">
                    {library
                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(card => (
                        <div key={card.id} onClick={() => addToDeck(card)} className="group relative cursor-pointer hover:scale-105 transition-transform">
                             <Card data={{...card, uid: card.id, isRested: false}} interactable={false} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-1/3 bg-gray-900 p-4 overflow-y-auto">
                <div className="mb-4">
                    <h3 className="text-purple-400 font-bold text-sm mb-2">Material ({builtDeck.material.length})</h3>
                    {builtDeck.material.map((c, i) => (
                        <div key={i} onClick={() => removeFromDeck(i, 'material')} className="text-xs text-gray-300 bg-gray-800 p-1 mb-1 rounded cursor-pointer hover:bg-red-900/50 transition truncate">
                            {c.name}
                        </div>
                    ))}
                </div>
                <div>
                    <h3 className="text-green-400 font-bold text-sm mb-2">Main ({builtDeck.main.length})</h3>
                    {builtDeck.main.map((c, i) => (
                        <div key={i} onClick={() => removeFromDeck(i, 'main')} className="text-xs text-gray-300 bg-gray-800 p-1 mb-1 rounded cursor-pointer hover:bg-red-900/50 transition truncate">
                            {c.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* --- Game View --- */}
      {view === 'game' && (
        <div className="flex-1 flex flex-col relative bg-[#1a1a1a]">
            
            {/* 1. 對手區域 (使用 opponentDummyState) */}
            <div className="flex-1 border-b-2 border-white/5 flex flex-col">
                <PlayerBoard 
                    isOpponent={true} 
                    state={opponentDummyState} 
                    actions={actions} // 對手動作暫時無效或未實作
                    onOpenMaterialModal={() => {}} 
                />
            </div>

            {/* 2. 玩家區域 */}
            <div className="flex-1 flex flex-col">
                <PlayerBoard 
                    isOpponent={false} 
                    state={state} 
                    actions={actions} 
                    onOpenMaterialModal={() => setMatModalOpen(true)} 
                />
            </div>

            {/* Material 選擇彈窗 */}
            <MaterialSelectionModal 
                isOpen={isMatModalOpen} 
                cards={state.materialDeck} 
                onSelect={handleMaterialSelect} 
                onClose={() => setMatModalOpen(false)} 
            />

        </div>
      )}
    </div>
  );
};

export default App;