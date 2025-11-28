import { CardData } from '../types';

const API_BASE = "https://api.gatcg.com/cards/search";

export const fetchDOASDCards = async (): Promise<CardData[]> => {
  let allCards: CardData[] = [];
  let page = 1;
  let hasMore = true;

  try {
    // 限制抓取前 10 頁，避免無限迴圈
    while (hasMore && page <= 10) { 
      const res = await fetch(`${API_BASE}?prefix=DOASD&page=${page}`);
      if (!res.ok) break;
      
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data;
      
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        const mapped = data.map((raw: any) => {
            let imgSlug = raw.slug;
            if (raw.editions) {
                const edition = raw.editions.find((e: any) => e.set?.prefix === "DOASD");
                if (edition) imgSlug = edition.slug;
            }

            return {
                id: raw.uuid,
                name: raw.name,
                types: raw.types || ["UNKNOWN"],
                element: raw.element || "NORM",
                cost: raw.stats?.cost_memory || 0,
                img: `https://api.gatcg.com/cards/images/${imgSlug}.jpg`,
                text: raw.effect_raw || ""
            };
        });
        allCards = [...allCards, ...mapped];
        page++;
        // 簡單限速避免請求過快
        await new Promise(r => setTimeout(r, 50));
      }
    }
  } catch (err) {
    console.error("Fetch Error", err);
  }
  return allCards;
};