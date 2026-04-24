const { db } = require('../config/firebase');

const CRYPTO_PRICES = {
  BTC: { name: 'Bitcoin', price: 43567.89, change: 2.34, icon: '₿' },
  ETH: { name: 'Ethereum', price: 2345.67, change: -1.12, icon: 'Ξ' },
  ADA: { name: 'Cardano', price: 0.58, change: 5.67, icon: '₳' },
  SOL: { name: 'Solana', price: 98.23, change: 3.45, icon: '◎' },
  DOT: { name: 'Polkadot', price: 7.82, change: -0.89, icon: '●' },
};

const FEE_RATE = 0.001; // 0.1%

const getPortfolio = async (req, res) => {
  const userId = req.user.uid;
  try {
    const doc = await db.collection('simulator').doc(userId).get();
    if (!doc.exists) {
      // Initialize if not exists
      const initial = { balance: 10000, portfolio: {}, totalValue: 10000 };
      await db.collection('simulator').doc(userId).set(initial);
      return res.json({ ...initial, holdings: [], prices: CRYPTO_PRICES });
    }

    const data = doc.data();
    const holdings = Object.entries(data.portfolio || {}).map(([symbol, amount]) => {
      const crypto = CRYPTO_PRICES[symbol];
      return {
        symbol,
        name: crypto.name,
        amount,
        value: amount * crypto.price,
        change: crypto.change,
        icon: crypto.icon,
      };
    }).filter(h => h.amount > 0);

    const portfolioValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalValue = data.balance + portfolioValue;

    res.json({
      balance: data.balance,
      portfolio: data.portfolio,
      holdings,
      portfolioValue,
      totalValue,
      prices: CRYPTO_PRICES,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const executeTrade = async (req, res) => {
  const userId = req.user.uid;
  const { crypto, type, amount } = req.body;

  if (!crypto || !type || !amount) {
    return res.status(400).json({ error: 'crypto, type, and amount are required' });
  }

  if (!['buy', 'sell'].includes(type)) {
    return res.status(400).json({ error: 'type must be "buy" or "sell"' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }

  const priceData = CRYPTO_PRICES[crypto];
  if (!priceData) {
    return res.status(400).json({ error: 'Invalid cryptocurrency' });
  }

  try {
    const simRef = db.collection('simulator').doc(userId);
    const simDoc = await simRef.get();

    let simData;
    if (!simDoc.exists) {
      simData = { balance: 10000, portfolio: {} };
      await simRef.set(simData);
    } else {
      simData = simDoc.data();
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

      await simRef.update({
        balance: newBalance,
        [`portfolio.${crypto}`]: currentHolding + amount,
      });

      // Record transaction
      await db.collection('transactions').add({
        userId,
        type: 'buy',
        crypto,
        amount,
        price,
        fee,
        total: totalCost,
        timestamp: new Date().toISOString(),
      });

      res.json({
        message: `Bought ${amount} ${crypto}`,
        balance: newBalance,
        holding: currentHolding + amount,
        fee,
        total: totalCost,
      });
    } else {
      // Sell
      const currentHolding = simData.portfolio[crypto] || 0;
      if (amount > currentHolding) {
        return res.status(400).json({ error: 'Insufficient holdings' });
      }

      const totalRevenue = amount * price - fee;
      const newBalance = simData.balance + totalRevenue;

      await simRef.update({
        balance: newBalance,
        [`portfolio.${crypto}`]: currentHolding - amount,
      });

      // Record transaction
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

      res.json({
        message: `Sold ${amount} ${crypto}`,
        balance: newBalance,
        holding: currentHolding - amount,
        fee,
        total: totalRevenue,
      });
    }
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

module.exports = { getPortfolio, executeTrade, getHistory };
