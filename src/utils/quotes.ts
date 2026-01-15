// Japanese quotes and proverbs (ことわざ - kotowaza) for daily inspiration

export interface Quote {
  japanese: string;
  romaji: string;
  english: string;
  meaning: string;
  category: 'perseverance' | 'beginning' | 'progress' | 'mastery' | 'failure' | 'consistency';
}

export const quotes: Quote[] = [
  // Perseverance (頑張り)
  {
    japanese: '七転び八起き',
    romaji: 'Nana korobi ya oki',
    english: 'Fall seven times, stand up eight',
    meaning: 'Resilience and never giving up, no matter how many times you fail.',
    category: 'perseverance',
  },
  {
    japanese: '石の上にも三年',
    romaji: 'Ishi no ue ni mo san-nen',
    english: 'Three years on a stone',
    meaning: 'Perseverance and patience will eventually lead to success.',
    category: 'perseverance',
  },
  {
    japanese: '継続は力なり',
    romaji: 'Keizoku wa chikara nari',
    english: 'Continuation is power',
    meaning: 'Persistence and consistency lead to strength and success.',
    category: 'consistency',
  },

  // Beginning (始まり)
  {
    japanese: '千里の道も一歩から',
    romaji: 'Senri no michi mo ippo kara',
    english: 'A journey of a thousand miles begins with a single step',
    meaning: 'Every great achievement starts with a small beginning.',
    category: 'beginning',
  },
  {
    japanese: '始めは処女の如く後は脱兎の如し',
    romaji: 'Hajime wa shojo no gotoku nochi wa datto no gotoshi',
    english: 'Start like a maiden, end like a running rabbit',
    meaning: 'Begin carefully, then act swiftly with gained momentum.',
    category: 'beginning',
  },

  // Progress (進歩)
  {
    japanese: '塵も積もれば山となる',
    romaji: 'Chiri mo tsumoreba yama to naru',
    english: 'Even dust, when piled up, becomes a mountain',
    meaning: 'Small efforts accumulate into great achievements.',
    category: 'progress',
  },
  {
    japanese: '雨垂れ石を穿つ',
    romaji: 'Ame dare ishi wo ugatsu',
    english: 'Dripping water pierces stone',
    meaning: 'Persistent effort will overcome any obstacle.',
    category: 'progress',
  },
  {
    japanese: '急がば回れ',
    romaji: 'Isogaba maware',
    english: 'If you hurry, take the roundabout',
    meaning: 'Sometimes the longer, more careful path is faster in the end.',
    category: 'progress',
  },

  // Mastery (熟練)
  {
    japanese: '習うより慣れろ',
    romaji: 'Narau yori narero',
    english: 'Practice makes perfect',
    meaning: 'Experience and repetition are better teachers than instruction.',
    category: 'mastery',
  },
  {
    japanese: '芸は身を助く',
    romaji: 'Gei wa mi wo tasuku',
    english: 'Art helps the body',
    meaning: 'Skills and mastery you develop will support you throughout life.',
    category: 'mastery',
  },
  {
    japanese: '名人は人を謗らず',
    romaji: 'Meijin wa hito wo soshirazu',
    english: 'A master does not criticize others',
    meaning: 'True mastery comes with humility and understanding.',
    category: 'mastery',
  },

  // Failure & Learning (失敗)
  {
    japanese: '失敗は成功のもと',
    romaji: 'Shippai wa seikou no moto',
    english: 'Failure is the foundation of success',
    meaning: 'Mistakes and failures are learning opportunities.',
    category: 'failure',
  },
  {
    japanese: '負けるが勝ち',
    romaji: 'Makeru ga kachi',
    english: 'Losing is winning',
    meaning: 'Sometimes strategic retreat or accepting small losses leads to greater victory.',
    category: 'failure',
  },

  // Consistency (一貫性)
  {
    japanese: '一日一善',
    romaji: 'Ichi-nichi ichi-zen',
    english: 'One good deed a day',
    meaning: 'Small daily actions create positive change.',
    category: 'consistency',
  },
  {
    japanese: '点滴石を穿つ',
    romaji: 'Tenteki ishi wo ugatsu',
    english: 'Constant dripping wears away stone',
    meaning: 'Consistent small actions achieve great results over time.',
    category: 'consistency',
  },
  {
    japanese: '一石二鳥',
    romaji: 'Isseki ni chou',
    english: 'One stone, two birds',
    meaning: 'Efficiency and getting multiple benefits from one action.',
    category: 'progress',
  },
];

// Get a random quote
export function getRandomQuote(): Quote {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Get quote by category
export function getQuoteByCategory(category: Quote['category']): Quote {
  const categoryQuotes = quotes.filter((q) => q.category === category);
  return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
}

// Get appropriate quote based on user's streak
export function getQuoteForStreak(streak: number): Quote {
  if (streak === 0) {
    return getQuoteByCategory('beginning');
  } else if (streak === 1) {
    return getQuoteByCategory('beginning');
  } else if (streak >= 2 && streak < 7) {
    return getQuoteByCategory('consistency');
  } else if (streak >= 7 && streak < 30) {
    return getQuoteByCategory('progress');
  } else if (streak >= 30) {
    return getQuoteByCategory('mastery');
  }
  return getRandomQuote();
}

// Get quote after missing a day
export function getQuoteAfterMiss(): Quote {
  return getQuoteByCategory('failure');
}

// Format quote for display
export function formatQuote(quote: Quote, includeJapanese: boolean = true): string {
  let message = '';

  if (includeJapanese) {
    message += `💬 "${quote.japanese}"\n`;
    message += `   (${quote.romaji})\n\n`;
  }

  message += `"${quote.english}"\n\n`;
  message += `💡 ${quote.meaning}`;

  return message;
}

// Get daily quote (can be based on date to ensure same quote for everyone on same day)
export function getDailyQuote(): Quote {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % quotes.length;
  return quotes[index];
}
