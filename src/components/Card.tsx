import React from 'react';
import { GameCard } from '../types';

interface CardProps {
  data: GameCard;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  interactable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  data, 
  onClick, 
  onDragStart, 
  size = 'md', 
  interactable = true 
}) => {
  
  const sizeClass = size === 'sm' ? 'w-16 h-24 text-[8px]' : 'w-24 h-36 text-xs';
  const restClass = data.isRested ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200';
  const borderColor = data.types.some(t => t.includes('CHAMPION')) ? 'border-yellow-500' : 'border-gray-600';

  return (
    <div 
      draggable={interactable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`
        ${sizeClass} ${restClass}
        relative bg-gray-800 rounded-lg border-2 ${borderColor} 
        flex flex-col justify-between select-none shadow-lg
        ${interactable ? 'cursor-pointer hover:scale-105 hover:z-50' : ''}
      `}
      style={{ 
        backgroundImage: `url(${data.img})`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 rounded-lg" />
      <div className="relative z-10 p-1">
        {data.cost > 0 && (
             <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold border border-white text-[10px]">
                 {data.cost}
             </div>
        )}
      </div>
      <div className="relative z-10 p-1 text-center">
          <span className="text-white font-bold text-shadow truncate block">{data.name}</span>
      </div>
    </div>
  );
};