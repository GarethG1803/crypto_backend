const { db } = require('../config/firebase');
const { getCurrentPrices, getChartData, COIN_MAP } = require('../services/coinGeckoService');
const { generateTradeFeedback } = require('../services/tradeFeedbackService');

const FEE_RATE = 0.001; // 0.1%
const INITIAL_BALANCE = 10000;

const getPortfolio = async (req, res) => {
  const userId = req.user.uid;
  try {
    const prices = await getCurrentPrices();

    const doc = await db.collection('simulator').doc(userId).get();
    if (!doc.exists) {
      const initial = { balance: INITIAL_BALANCE, portfolio: {}, costBasis: {}, stopLosses: {} };
      await db.collection('simulator').doc(userId).set(initial);
      return res.json({
        balance: INITIAL_BALANCE,
        holdings: [],
        portfolioValue: 0,
        totalValue: INITIAL_BALANCE,
        pnl: 0,
        pnlPercent: 0,
        prices,
        stopLosses: {},
        triggeredStopLosses: [],
      });
    }

    const data = doc.data();
    const costBasis = data.costBasis || {};
    const stopLosses = data.stopLosses || {};

    // Check and execute triggered stop-losses
    const triggeredStopLosses = [];
    const updates = {};
    let balance = data.balance;
    const portfolio = { ...(data.portfolio || {}) };
    const updatedCostBasis = { ...costBasis };
    const updatedStopLosses = { ...stopLosses };

    for (const [symbol, stopPrice] of Object.entries(stopLosses)) {
      const currentPrice = prices[symbol]?.price;
      const holdingAmount = portfolio[symbol] || 0;
      if (currentPrice && holdingAmount > 0 && currentPrice <= stopPrice) {
        const fee = holdingAmount * currentPrice * FEE_RATE;
        const totalRevenue = holdingAmount * currentPrice - fee;
        balance += totalRevenue;

        triggeredStopLosses.push({
          symbol,
          stopPrice,
          executedPrice: currentPrice,
          amount: holdingAmount,
          revenue: totalRevenue,
          fee,
        });

        // Record transaction
        await db.collection('transactions').add({
          userId,
          type: 'sell',
          crypto: symbol,
          amount: holdingAmount,
          price: currentPrice,
          fee,
          total: totalRevenue,
          timestamp: new Date().toISOString(),
          triggeredBy: 'stop-loss',
        });

        portfolio[symbol] = 0;
        updatedCostBasis[symbol] = 0;
        delete updatedStopLosses[symbol];
      }
    }

    // Persist stop-loss executions if any triggered
    if (triggeredStopLosses.length > 0) {
      const simRef = db.collection('simulator').doc(userId);
      await simRef.update({
        balance,
        portfolio,
        costBasis: updatedCostBasis,
        stopLosses: updatedStopLosses,
      });
    }

    const holdings = Object.entries(portfolio).map(([symbol, amount]) => {
      const crypto = prices[symbol];
      if (!crypto) return null;
      const currentValue = amount * crypto.price;
      const basis = updatedCostBasis[symbol] || 0;
      const holdingPnl = currentValue - basis;
      return {
        symbol,
        name: crypto.name,
        amount,
        value: currentValue,
        costBasis: basis,
        pnl: holdingPnl,
        pnlPercent: basis > 0 ? ((holdingPnl / basis) * 100) : 0,
        change: crypto.change,
        icon: crypto.icon,
        stopLoss: updatedStopLosses[symbol] || null,
      };
    }).filter(h => h && h.amount > 0);

    const portfolioValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalValue = balance + portfolioValue;
    const pnl = totalValue - INITIAL_BALANCE;

    res.json({
      balance,
      holdings,
      portfolioValue,
      totalValue,
      pnl,
      pnlPercent: ((pnl / INITIAL_BALANCE) * 100),
      prices,
      stopLosses: updatedStopLosses,
      triggeredStopLosses,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const executeTrade = async (req, res) => {
  const userId = req.user.uid;
  const { crypto, type, amount, stopLoss } = req.body;

  if (!crypto || !type || !amount) {
    return res.status(400).json({ error: 'crypto, type, and amount are required' });
  }

  if (!['buy', 'sell'].includes(type)) {
    return res.status(400).json({ error: 'type must be "buy" or "sell"' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }

  const prices = await getCurrentPrices();
  const priceData = prices[crypto];
  if (!priceData) {
    return res.status(400).json({ error: 'Invalid cryptocurrency' });
  }

  if (stopLoss !== undefined && stopLoss !== null) {
    if (stopLoss <= 0) {
      return res.status(400).json({ error: 'Stop-loss price must be positive' });
    }
    if (stopLoss >= priceData.price) {
      return res.status(400).json({ error: 'Stop-loss price must be below current price' });
    }
  }

  try {
    const simRef = db.collection('simulator').doc(userId);
    const simDoc = await simRef.get();

    let simData;
    if (!simDoc.exists) {
      simData = { balance: INITIAL_BALANCE, portfolio: {}, costBasis: {}, stopLosses: {} };
      await simRef.set(simData);
    } else {
      simData = simDoc.data();
      if (!simData.costBasis) simData.costBasis = {};
      if (!simData.stopLosses) simData.stopLosses = {};
    }

    const price = priceData.price;
    const fee = amount * price * FEE_RATE;

    if (type === 'buy') {
      const totalCost = amount * price + fee;
      if (totalCost > simData.balance) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const newBalance = simData.balance - totalCost;
      const currentHolding = simData.portfolio[crypto] || 0;
      const currentCostBasis = simData.costBasis[crypto] || 0;

      const updateFields = {
        balance: newBalance,
        [`portfolio.${crypto}`]: currentHolding + amount,
        [`costBasis.${crypto}`]: currentCostBasis + totalCost,
      };

      // Set stop-loss if provided
      if (stopLoss) {
        updateFields[`stopLosses.${crypto}`] = stopLoss;
      }

      await simRef.update(updateFields);

      await db.collection('transactions').add({
        userId,
        type: 'buy',
        crypto,
        amount,
        price,
        fee,
        total: totalCost,
        stopLoss: stopLoss || null,
        timestamp: new Date().toISOString(),
      });

      const portfolioValue = Object.entries(simData.portfolio || {}).reduce((sum, [sym, amt]) => {
        return sum + amt * (prices[sym]?.price || 0);
      }, 0);
      const totalPortfolioBalance = simData.balance + portfolioValue;

      const feedback = generateTradeFeedback({
        type: 'buy',
        crypto,
        amount,
        price,
        avgCost: 0,
        portfolioBalance: totalPortfolioBalance,
        priceChange24h: priceData.change,
      });

      res.json({
        message: `Bought ${amount} ${crypto}`,
        balance: newBalance,
        holding: currentHolding + amount,
        fee,
        total: totalCost,
        feedback,
      });
    } else {
      // Sell
      const currentHolding = simData.portfolio[crypto] || 0;
      if (amount > currentHolding) {
        return res.status(400).json({ error: 'Insufficient holdings' });
      }

      const totalRevenue = amount * price - fee;
      const newBalance = simData.balance + totalRevenue;
      const newHolding = currentHolding - amount;

      const currentCostBasis = simData.costBasis[crypto] || 0;
      const avgCost = currentHolding > 0 ? currentCostBasis / currentHolding : 0;
      const newCostBasis = newHolding > 0
        ? currentCostBasis * (newHolding / currentHolding)
        : 0;

      const updateFields = {
        balance: newBalance,
        [`portfolio.${crypto}`]: newHolding,
        [`costBasis.${crypto}`]: newCostBasis,
      };

      // Remove stop-loss if selling entire position
      if (newHolding === 0 && simData.stopLosses[crypto]) {
        updateFields[`stopLosses.${crypto}`] = require('firebase-admin').firestore.FieldValue.delete();
      }

      await simRef.update(updateFields);

      await db.collection('transactions').add({
        userId,
        type: 'sell',
        crypto,
        amount,
        price,
        fee,
        total: totalRevenue,
        timestamp: new Date().toISOString(),
      });

      const portfolioValue = Object.entries(simData.portfolio || {}).reduce((sum, [sym, amt]) => {
        return sum + amt * (prices[sym]?.price || 0);
      }, 0);
      const totalPortfolioBalance = simData.balance + portfolioValue;

      const feedback = generateTradeFeedback({
        type: 'sell',
        crypto,
        amount,
        price,
        avgCost,
        portfolioBalance: totalPortfolioBalance,
        priceChange24h: priceData.change,
      });

      res.json({
        message: `Sold ${amount} ${crypto}`,
        balance: newBalance,
        holding: newHolding,
        fee,
        total: totalRevenue,
        feedback,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const setStopLoss = async (req, res) => {
  const userId = req.user.uid;
  const { crypto, price } = req.body;

  if (!crypto) {
    return res.status(400).json({ error: 'crypto is required' });
  }

  const prices = await getCurrentPrices();
  const priceData = prices[crypto];
  if (!priceData) {
    return res.status(400).json({ error: 'Invalid cryptocurrency' });
  }

  try {
    const simRef = db.collection('simulator').doc(userId);
    const simDoc = await simRef.get();
    if (!simDoc.exists) {
      return res.status(400).json({ error: 'No portfolio found' });
    }

    const simData = simDoc.data();
    const holding = simData.portfolio?.[crypto] || 0;
    if (holding <= 0) {
      return res.status(400).json({ error: `No ${crypto} holdings to set stop-loss on` });
    }

    // price = null/0 means remove stop-loss
    if (!price) {
      await simRef.update({
        [`stopLosses.${crypto}`]: require('firebase-admin').firestore.FieldValue.delete(),
      });
      return res.json({ message: `Stop-loss removed for ${crypto}` });
    }

    if (price >= priceData.price) {
      return res.status(400).json({ error: 'Stop-loss price must be below current price' });
    }

    await simRef.update({
      [`stopLosses.${crypto}`]: price,
    });

    res.json({ message: `Stop-loss set for ${crypto} at $${price}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getHistory = async (req, res) => {
  const userId = req.user.uid;
  try {
    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .limit(50)
      .get();

    const transactions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getChartDataHandler = async (req, res) => {
  const { symbol } = req.params;
  const days = parseFloat(req.query.days) || 1;

  const upperSymbol = symbol.toUpperCase();
  if (!COIN_MAP[upperSymbol]) {
    return res.status(400).json({ error: `Invalid symbol: ${symbol}` });
  }

  const ALLOWED_DAYS = [0.04, 0.25, 1, 7, 30, 90, 365];
  if (!ALLOWED_DAYS.includes(days)) {
    return res.status(400).json({ error: `days must be one of: ${ALLOWED_DAYS.join(', ')}` });
  }

  try {
    const data = await getChartData(upperSymbol, days);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPortfolio, executeTrade, getHistory, getChartDataHandler, setStopLoss };
