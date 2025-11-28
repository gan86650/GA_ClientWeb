import { useReducer } from 'react';
import { CardData, GameCard, GameState, ZoneKey } from '../types';
import { generateId, shuffle } from '../utils';

type Action = 
  | { type: 'LOAD_DECK'; material: CardData[]; main: CardData[] }
  | { type: 'DRAW_CARD' }
  | { type: 'DRAW_MATERIAL' }
  | { type: 'MOVE_CARD'; cardUid: string; targetZone: ZoneKey }
  | { type: 'TOGGLE_REST'; cardUid: string };

const initialState: GameState = {
  materialDeck: [], mainDeck: [], hand: [],
  materialZone: [], battleZone: [], graveyard: [], banished: [], memory: []
};

// Helper: 尋找並移除卡片
const findAndRemoveCard = (state: GameState, uid: string): { card: GameCard, newState: GameState } | null => {
  // 搜尋所有區域，包含新增的 banished
  const zones: ZoneKey[] = ['hand', 'materialZone', 'battleZone', 'graveyard', 'banished', 'memory', 'materialDeck', 'mainDeck'];
  for (const zone of zones) {
    const list = state[zone];
    const index = list.findIndex(c => c.uid === uid);
    if (index !== -1) {
      const card = list[index];
      const newList = [...list];
      newList.splice(index, 1);
      return { card, newState: { ...state, [zone]: newList } };
    }
  }
  return null;
};

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOAD_DECK':
      return {
        ...initialState,
        materialDeck: action.material.map(c => ({ ...c, uid: generateId(), isRested: false })),
        mainDeck: shuffle(action.main.map(c => ({ ...c, uid: generateId(), isRested: false }))),
      };
    case 'DRAW_CARD':
      if (state.mainDeck.length === 0) return state;
      const [drawn, ...restDeck] = state.mainDeck;
      return { ...state, mainDeck: restDeck, hand: [...state.hand, drawn] };
    case 'DRAW_MATERIAL':
        if (state.materialDeck.length === 0) return state;
        const [mat, ...restMat] = state.materialDeck;
        return { ...state, materialDeck: restMat, materialZone: [...state.materialZone, mat] };
    case 'MOVE_CARD': {
      const result = findAndRemoveCard(state, action.cardUid);
      if (!result) return state;
      const { card, newState } = result;
      return { ...newState, [action.targetZone]: [...newState[action.targetZone], card] };
    }
    case 'TOGGLE_REST': {
      const toggle = (list: GameCard[]) => list.map(c => c.uid === action.cardUid ? { ...c, isRested: !c.isRested } : c);
      return {
          ...state,
          hand: toggle(state.hand),
          materialZone: toggle(state.materialZone),
          battleZone: toggle(state.battleZone),
          memory: toggle(state.memory),
          banished: toggle(state.banished),
      };
    }
    default: return state;
  }
}

export const useGameEngine = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return {
    state,
    actions: {
      loadDeck: (material: CardData[], main: CardData[]) => dispatch({ type: 'LOAD_DECK', material, main }),
      drawCard: () => dispatch({ type: 'DRAW_CARD' }),
      drawMaterial: () => dispatch({ type: 'DRAW_MATERIAL' }),
      moveCard: (cardUid: string, targetZone: ZoneKey) => dispatch({ type: 'MOVE_CARD', cardUid, targetZone }),
      toggleRest: (cardUid: string) => dispatch({ type: 'TOGGLE_REST', cardUid })
    }
  };
};