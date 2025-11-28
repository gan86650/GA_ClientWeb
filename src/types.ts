// 1. 基礎卡片資料 (來自 API)
export interface CardData {
  id: string;
  name: string;
  types: string[];
  element: string;
  cost: number;
  img: string;
  text: string;
}

// 2. 遊戲內實體化卡片 (加上唯一 ID 和狀態)
export interface GameCard extends CardData {
  uid: string; // Unique Instance ID
  isRested: boolean;
}

// 3. 遊戲核心狀態
export interface GameState {
  materialDeck: GameCard[];
  mainDeck: GameCard[];
  hand: GameCard[];
  materialZone: GameCard[];
  battleZone: GameCard[];
  graveyard: GameCard[];
  memory: GameCard[];
}

// 定義所有可以存放卡片的區域 Key
export type ZoneKey = keyof GameState;