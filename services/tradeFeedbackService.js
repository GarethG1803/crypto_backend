function generateTradeFeedback({ type, crypto, amount, price, avgCost, portfolioBalance, priceChange24h }) {
  const tradeValue = amount * price;
  const rules = [];

  if (type === 'sell' && avgCost > 0) {
    const pnlPercent = ((price - avgCost) / avgCost) * 100;

    if (pnlPercent < 0) {
      rules.push({
        feedback: `You sold ${crypto} at a ${Math.abs(pnlPercent).toFixed(1)}% loss. Your average cost was $${avgCost.toFixed(2)} and you sold at $${price.toFixed(2)}.`,
        tips: [
          'Consider setting a stop-loss level before entering a trade to limit downside.',
          'Dollar-cost averaging (DCA) can help reduce the impact of buying at a peak.',
          'Avoid selling in panic — have a plan before emotions take over.',
        ],
        concept: 'Stop-Loss Orders',
        conceptExplanation: 'A stop-loss is a predetermined price at which you sell an asset to prevent further losses. For example, setting a stop-loss 10% below your buy price means you automatically sell if the price drops that much. This helps remove emotion from trading decisions and protects your capital from large drawdowns.',
      });
    } else {
      rules.push({
        feedback: `Nice trade! You sold ${crypto} at a ${pnlPercent.toFixed(1)}% profit. You bought around $${avgCost.toFixed(2)} and sold at $${price.toFixed(2)}.`,
        tips: [
          'Consider taking partial profits instead of selling your entire position.',
          'A trailing stop can lock in gains while letting winners run.',
          'Record what went right so you can repeat this strategy.',
        ],
        concept: 'Trailing Stop',
        conceptExplanation: 'A trailing stop moves upward with the price but never moves down. For example, a 5% trailing stop on a coin at $100 triggers a sell at $95. If the price rises to $120, the stop moves to $114. This lets you capture more upside while protecting gains if the price reverses.',
      });
    }
  }

  if (type === 'buy' && priceChange24h !== undefined) {
    if (priceChange24h < 0) {
      rules.push({
        feedback: `You're buying ${crypto} during a dip (${priceChange24h.toFixed(1)}% in 24h). Buying low can be smart — if the fundamentals are solid.`,
        tips: [
          'Check if the dip is driven by news or just normal volatility before buying more.',
          'Don\'t try to catch the exact bottom — even professionals can\'t time it perfectly.',
          'Consider splitting your buy into multiple smaller orders over the next few hours or days.',
        ],
        concept: 'Buying the Dip',
        conceptExplanation: 'Buying the dip means purchasing an asset after its price has fallen, betting it will recover. While this can be profitable, it\'s important to distinguish between a temporary pullback and a fundamental change. A good rule: only buy dips on assets you\'d be happy to hold long-term. The phrase "catching a falling knife" warns that prices can keep falling further than expected.',
      });
    } else if (priceChange24h > 5) {
      rules.push({
        feedback: `${crypto} is up ${priceChange24h.toFixed(1)}% today. Buying during a rally can work, but be aware of FOMO (Fear Of Missing Out).`,
        tips: [
          'Assets that pump hard often pull back — consider waiting for a small dip.',
          'Ask yourself: would I buy this if it hadn\'t just gone up?',
          'Set a strict budget for momentum trades to manage risk.',
        ],
        concept: 'FOMO & Overbought Conditions',
        conceptExplanation: 'FOMO drives traders to buy after a big price increase, fearing they\'ll miss out on more gains. However, sharp rallies often lead to pullbacks as early buyers take profits. Technical indicators like RSI (Relative Strength Index) can signal when an asset is "overbought" — above 70 RSI suggests the price may be due for a correction. Patience often pays off.',
      });
    }
  }

  if (portfolioBalance > 0) {
    const positionPct = (tradeValue / portfolioBalance) * 100;

    if (type === 'buy' && positionPct > 30) {
      rules.push({
        feedback: `This trade uses ${positionPct.toFixed(0)}% of your total portfolio — that's a large position.`,
        tips: [
          'Most professionals risk no more than 1-5% of their portfolio on a single trade.',
          'A large position amplifies both gains AND losses equally.',
          'Consider sizing your position based on how much you\'re willing to lose, not how much you want to gain.',
        ],
        concept: 'Position Sizing',
        conceptExplanation: 'Position sizing determines how much of your portfolio you allocate to a single trade. The key principle: never risk more than you can afford to lose on one trade. A common rule is the 2% rule — risk no more than 2% of your total portfolio on any single trade. This ensures that even a string of losses won\'t wipe out your account.',
      });
    }

    if (type === 'buy' && positionPct < 5 && tradeValue < 500) {
      rules.push({
        feedback: `Starting small with ${crypto} — smart approach! This trade is ${positionPct.toFixed(1)}% of your portfolio.`,
        tips: [
          'Small, regular purchases (DCA) can reduce the impact of volatility.',
          'Use small trades to learn how a coin behaves before committing more.',
          'Track your trades to build a system you can scale up later.',
        ],
        concept: 'Dollar-Cost Averaging (DCA)',
        conceptExplanation: 'DCA means investing a fixed amount at regular intervals regardless of price. For example, buying $100 of Bitcoin every week. When prices are low, you buy more coins; when prices are high, you buy fewer. Over time, this averages out your cost basis and removes the stress of trying to time the market perfectly.',
      });
    }
  }

  // Default fallback
  if (rules.length === 0) {
    if (type === 'buy') {
      rules.push({
        feedback: `You bought ${amount} ${crypto} at $${price.toFixed(2)}.`,
        tips: [
          'Always have a plan for when you\'ll take profits or cut losses.',
          'Diversify across different cryptocurrencies to spread risk.',
          'Only invest what you can afford to lose in crypto markets.',
        ],
        concept: 'Risk Management Basics',
        conceptExplanation: 'Risk management is the process of identifying, assessing, and controlling potential losses. In crypto trading, this means: setting stop-losses, diversifying your portfolio, never investing money you need for essentials, and having clear entry/exit strategies before you trade. The goal isn\'t to avoid all risk — it\'s to take calculated risks where the potential reward justifies the potential loss.',
      });
    } else {
      rules.push({
        feedback: `You sold ${amount} ${crypto} at $${price.toFixed(2)}.`,
        tips: [
          'Review your trade to understand what drove your decision.',
          'Keep a trading journal to identify patterns in your behavior.',
          'Consider rebalancing your portfolio periodically.',
        ],
        concept: 'Trading Journal',
        conceptExplanation: 'A trading journal records every trade you make along with your reasoning, emotions, and outcome. Over time, patterns emerge: maybe you sell too early out of fear, or buy too late out of FOMO. The best traders constantly review their journals to refine their strategy. Even a simple spreadsheet tracking entry price, exit price, reason, and result can dramatically improve your decision-making.',
      });
    }
  }

  // Return the highest priority (first matched) rule
  return rules[0];
}

module.exports = { generateTradeFeedback };
