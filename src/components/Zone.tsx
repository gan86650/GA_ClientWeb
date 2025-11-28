import React from 'react';
import { GameCard, ZoneKey } from '../types';
import { Card } from './Card';

interface ZoneProps {
  title: string;
  cards: GameCard[];
  zoneId: ZoneKey;
  onDropCard: (cardUid: string, targetZone: ZoneKey) => void;
  onCardClick: (id: string) => void;
  className?: string;
  layout?: 'grid' | 'row' | 'stack';
}

export const Zone: React.FC<ZoneProps> = ({ 
  title, 
  cards, 
  zoneId, 
  onDropCard, 
  onCardClick, 
  className, 
  layout = 'grid' 
}) => {
  
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove('bg-white/10');
      const uid = e.dataTransfer.getData('cardUid');
      if (uid) onDropCard(uid, zoneId);
  };

  const layoutClass = layout === 'row' 
    ? 'flex overflow-x-auto gap-2 items-center' 
    : layout === 'stack' 
        ? 'flex items-center justify-center' 
        : 'flex flex-wrap content-start gap-2';

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-white/10'); }}
      onDragLeave={(e) => e.currentTarget.classList.remove('bg-white/10')}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed border-gray-700/50 rounded-lg p-2 min-h-[140px] transition-colors ${className}`}
    >
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-600 font-bold pointer-events-none uppercase opacity-30 select-none">
        {title}
      </span>
      
      <div className={`w-full h-full ${layoutClass}`}>
        {cards.map((card, index) => (
            <div key={card.uid} className={layout === 'row' && index > 0 ? '-ml-6 hover:ml-0 transition-all' : ''}>
                <Card 
                    data={card} 
                    onClick={() => onCardClick(card.uid)}
                    onDragStart={(e) => e.dataTransfer.setData('cardUid', card.uid)}
                />
            </div>
        ))}
      </div>
    </div>
  );
};