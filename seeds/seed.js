require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { db } = require('../config/firebase');

const modules = [
  {
    id: 'what-is-cryptocurrency',
    title: 'What is Cryptocurrency?',
    description: 'Learn the basics of cryptocurrency and how it works.',
    difficulty: 'beginner',
    category: 'Fundamentals',
    duration: '10 min',
    rewardPoints: 100,
    quizQuestionCount: 3,
    order: 1,
    content: [
      { type: 'heading', text: 'Introduction to Cryptocurrency' },
      { type: 'paragraph', text: 'Cryptocurrency is a digital or virtual form of currency that uses cryptography for security. Unlike traditional currencies issued by central banks, cryptocurrencies operate on decentralized networks based on blockchain technology.' },
      { type: 'paragraph', text: 'The concept of cryptocurrency was first introduced with Bitcoin in 2009, created by the pseudonymous Satoshi Nakamoto. Since then, thousands of alternative cryptocurrencies have been created.' },
      { type: 'heading', text: 'Key Characteristics' },
      { type: 'paragraph', text: 'Decentralization: No central authority controls the network. Instead, transactions are verified by network participants through cryptography.' },
      { type: 'paragraph', text: 'Security: Cryptographic techniques ensure that transactions are secure and that new units are created in a controlled manner.' },
      { type: 'paragraph', text: 'Transparency: All transactions are recorded on a public ledger (blockchain) that anyone can view and verify.' },
      { type: 'paragraph', text: 'Limited Supply: Most cryptocurrencies have a finite supply, which can help protect against inflation.' },
    ],
  },
  {
    id: 'understanding-bitcoin',
    title: 'Understanding Bitcoin',
    description: 'Dive deep into Bitcoin, the first and most well-known cryptocurrency.',
    difficulty: 'beginner',
    category: 'Fundamentals',
    duration: '15 min',
    rewardPoints: 150,
    quizQuestionCount: 3,
    order: 2,
    content: [
      { type: 'heading', text: 'What is Bitcoin?' },
      { type: 'paragraph', text: 'Bitcoin is the first decentralized cryptocurrency, created in 2009 by an unknown person or group using the pseudonym Satoshi Nakamoto. It introduced the concept of a peer-to-peer electronic cash system.' },
      { type: 'paragraph', text: 'Bitcoin operates without a central bank or single administrator. It can be sent from user to user on the peer-to-peer bitcoin network without intermediaries.' },
      { type: 'heading', text: 'How Bitcoin Works' },
      { type: 'paragraph', text: 'Transactions are verified by network nodes through cryptography and recorded in a public distributed ledger called a blockchain. Bitcoin is unique in that there are a finite number of them: 21 million.' },
      { type: 'paragraph', text: 'New bitcoins are created as a reward for a process known as mining. Mining involves solving complex mathematical problems that verify and add transaction records to the blockchain.' },
      { type: 'paragraph', text: 'The difficulty of mining adjusts approximately every two weeks to ensure that blocks are added to the blockchain at a steady rate of approximately one every 10 minutes.' },
    ],
  },
  {
    id: 'blockchain-technology',
    title: 'Blockchain Technology Explained',
    description: 'Understand the underlying technology that powers cryptocurrencies.',
    difficulty: 'intermediate',
    category: 'Technology',
    duration: '20 min',
    rewardPoints: 200,
    quizQuestionCount: 3,
    order: 3,
    content: [
      { type: 'heading', text: 'What is Blockchain?' },
      { type: 'paragraph', text: 'A blockchain is a distributed database or ledger shared among nodes of a computer network. It stores information electronically in digital format and is best known for its crucial role in cryptocurrency systems.' },
      { type: 'paragraph', text: 'The key innovation of blockchain is that it guarantees the fidelity and security of data records and generates trust without the need for a trusted third party.' },
      { type: 'heading', text: 'How Blockchain Works' },
      { type: 'paragraph', text: 'Each block in the chain contains a number of transactions, and every time a new transaction occurs on the blockchain, a record of that transaction is added to every participant\'s ledger.' },
      { type: 'paragraph', text: 'The decentralized database managed by multiple participants is known as Distributed Ledger Technology (DLT). Blockchain is a type of DLT in which transactions are recorded with an immutable cryptographic signature called a hash.' },
    ],
  },
  {
    id: 'crypto-wallets-security',
    title: 'Cryptocurrency Wallets & Security',
    description: 'Learn about different types of wallets and how to secure your crypto.',
    difficulty: 'intermediate',
    category: 'Security',
    duration: '18 min',
    rewardPoints: 180,
    quizQuestionCount: 3,
    order: 4,
    content: [
      { type: 'heading', text: 'Types of Crypto Wallets' },
      { type: 'paragraph', text: 'A cryptocurrency wallet is a digital tool that allows you to store, send, and receive digital currencies. Wallets don\'t actually store crypto — they store the private keys that give you access to your assets on the blockchain.' },
      { type: 'paragraph', text: 'Hot Wallets are connected to the internet and include mobile wallets, desktop wallets, and web wallets. They are convenient for frequent trading but more vulnerable to hacking.' },
      { type: 'heading', text: 'Security Best Practices' },
      { type: 'paragraph', text: 'Cold Wallets (hardware wallets and paper wallets) are stored offline, making them much more secure against online threats. They are ideal for long-term storage of large amounts.' },
      { type: 'paragraph', text: 'Always enable two-factor authentication, use strong unique passwords, keep your private keys offline, and never share your seed phrase with anyone.' },
    ],
  },
  {
    id: 'smart-contracts-defi',
    title: 'Smart Contracts and DeFi',
    description: 'Explore smart contracts and decentralized finance applications.',
    difficulty: 'advanced',
    category: 'Advanced Concepts',
    duration: '25 min',
    rewardPoints: 250,
    quizQuestionCount: 3,
    order: 5,
    content: [
      { type: 'heading', text: 'Understanding Smart Contracts' },
      { type: 'paragraph', text: 'Smart contracts are self-executing programs stored on a blockchain that run when predetermined conditions are met. They were first proposed by Nick Szabo in 1994 and became practical with Ethereum.' },
      { type: 'paragraph', text: 'They automate the execution of an agreement so that all participants can be immediately certain of the outcome, without any intermediary or time loss.' },
      { type: 'heading', text: 'Decentralized Finance (DeFi)' },
      { type: 'paragraph', text: 'DeFi refers to financial services built on blockchain technology that operate without traditional intermediaries like banks. DeFi applications include lending, borrowing, trading, and insurance platforms.' },
    ],
  },
  {
    id: 'nfts-digital-ownership',
    title: 'NFTs & Digital Ownership',
    description: 'Learn about non-fungible tokens and digital ownership.',
    difficulty: 'advanced',
    category: 'Advanced Concepts',
    duration: '22 min',
    rewardPoints: 220,
    quizQuestionCount: 3,
    order: 6,
    content: [
      { type: 'heading', text: 'What are NFTs?' },
      { type: 'paragraph', text: 'Non-Fungible Tokens (NFTs) are unique digital assets verified using blockchain technology. Unlike cryptocurrencies such as Bitcoin, each NFT is unique and cannot be exchanged on a one-to-one basis.' },
      { type: 'paragraph', text: 'NFTs can represent ownership of digital items like art, music, videos, in-game items, and more. They provide proof of ownership and authenticity on the blockchain.' },
      { type: 'heading', text: 'The Future of Digital Ownership' },
      { type: 'paragraph', text: 'NFTs are reshaping how we think about digital ownership, enabling creators to monetize their work directly and giving buyers verifiable proof of ownership for digital assets.' },
    ],
  },
];

const quizzes = [
  {
    id: 'quiz-what-is-cryptocurrency',
    moduleId: 'what-is-cryptocurrency',
    questions: [
      {
        question: 'What technology underlies most cryptocurrencies?',
        options: ['Cloud Computing', 'Blockchain', 'Artificial Intelligence', 'Quantum Computing'],
        correctAnswer: 1,
        explanation: 'Blockchain technology is the foundation that most cryptocurrencies are built upon, providing a decentralized and secure ledger for transactions.',
      },
      {
        question: 'Which of the following is NOT a key characteristic of cryptocurrency?',
        options: ['Decentralized', 'Central bank control', 'Cryptography security', 'Limited supply'],
        correctAnswer: 1,
        explanation: 'Cryptocurrencies are typically decentralized and not controlled by any central bank, which is one of their defining features.',
      },
      {
        question: 'What ensures the security of cryptocurrency transactions?',
        options: ['Bank verification', 'Government oversight', 'Cryptographic techniques', 'Physical certificate'],
        correctAnswer: 2,
        explanation: 'Cryptographic techniques ensure the integrity and security of cryptocurrency transactions on the blockchain.',
      },
    ],
  },
  {
    id: 'quiz-understanding-bitcoin',
    moduleId: 'understanding-bitcoin',
    questions: [
      {
        question: 'Who created Bitcoin?',
        options: ['Elon Musk', 'Satoshi Nakamoto', 'Vitalik Buterin', 'Mark Zuckerberg'],
        correctAnswer: 1,
        explanation: 'Bitcoin was created by an anonymous person or group using the pseudonym Satoshi Nakamoto in 2009.',
      },
      {
        question: 'What is Bitcoin mining?',
        options: ['Digging for digital coins', 'Solving complex mathematical problems', 'Buying Bitcoin at a discount', 'Creating fake Bitcoin'],
        correctAnswer: 1,
        explanation: 'Bitcoin mining involves solving complex mathematical problems to verify transactions and add them to the blockchain.',
      },
      {
        question: 'What is the maximum supply of Bitcoin?',
        options: ['1 million', '21 million', '100 million', 'Unlimited'],
        correctAnswer: 1,
        explanation: 'Bitcoin has a hard cap of 21 million coins that can ever be created, making it a deflationary asset.',
      },
    ],
  },
  {
    id: 'quiz-blockchain-technology',
    moduleId: 'blockchain-technology',
    questions: [
      {
        question: 'What is a blockchain?',
        options: ['A type of cryptocurrency', 'A distributed ledger technology', 'A social media platform', 'A cloud storage service'],
        correctAnswer: 1,
        explanation: 'A blockchain is a distributed ledger technology that records transactions across a network of computers.',
      },
      {
        question: 'What makes blockchain data immutable?',
        options: ['Password protection', 'Cryptographic hashing and consensus', 'Government regulation', 'Antivirus software'],
        correctAnswer: 1,
        explanation: 'Cryptographic hashing links blocks together, and consensus mechanisms ensure that once data is recorded, it cannot be altered.',
      },
      {
        question: 'What is Proof of Work?',
        options: ['A work verification system', 'A consensus mechanism using computational power', 'A type of cryptocurrency', 'A digital signature'],
        correctAnswer: 1,
        explanation: 'Proof of Work is a consensus mechanism where miners compete to solve complex problems using computational power to validate transactions.',
      },
    ],
  },
  {
    id: 'quiz-crypto-wallets-security',
    moduleId: 'crypto-wallets-security',
    questions: [
      {
        question: 'What is the primary benefit of decentralization in crypto?',
        options: ['Faster transactions', 'No single point of failure', 'Lower fees', 'Better user interface'],
        correctAnswer: 1,
        explanation: 'Decentralization means there is no single point of failure, making the network more resilient and censorship-resistant.',
      },
      {
        question: 'What is a digital wallet used for?',
        options: ['Storing physical money', 'Storing and managing crypto assets', 'Mining cryptocurrency', 'Creating new tokens'],
        correctAnswer: 1,
        explanation: 'A digital wallet stores your private keys and allows you to manage, send, and receive cryptocurrency assets.',
      },
      {
        question: 'Which type of wallet is considered most secure for long-term storage?',
        options: ['Web wallet', 'Mobile wallet', 'Hardware wallet (cold storage)', 'Exchange wallet'],
        correctAnswer: 2,
        explanation: 'Hardware wallets (cold storage) are kept offline, making them the most secure option for long-term cryptocurrency storage.',
      },
    ],
  },
  {
    id: 'quiz-smart-contracts-defi',
    moduleId: 'smart-contracts-defi',
    questions: [
      {
        question: 'What does DeFi stand for?',
        options: ['Digital Finance', 'Decentralized Finance', 'Distributed Files', 'Direct Funding'],
        correctAnswer: 1,
        explanation: 'DeFi stands for Decentralized Finance, referring to financial services built on blockchain technology without traditional intermediaries.',
      },
      {
        question: 'What are smart contracts?',
        options: ['Legal documents', 'Self-executing programs on blockchain', 'Insurance policies', 'Bank agreements'],
        correctAnswer: 1,
        explanation: 'Smart contracts are self-executing programs stored on a blockchain that automatically execute when predetermined conditions are met.',
      },
      {
        question: 'Which blockchain popularized smart contracts?',
        options: ['Bitcoin', 'Ethereum', 'Dogecoin', 'Litecoin'],
        correctAnswer: 1,
        explanation: 'Ethereum was specifically designed to support smart contracts and decentralized applications, making them practical and widely used.',
      },
    ],
  },
  {
    id: 'quiz-nfts-digital-ownership',
    moduleId: 'nfts-digital-ownership',
    questions: [
      {
        question: 'What does NFT stand for?',
        options: ['New Financial Technology', 'Non-Fungible Token', 'Network File Transfer', 'National Funding Trust'],
        correctAnswer: 1,
        explanation: 'NFT stands for Non-Fungible Token, meaning each token is unique and cannot be exchanged one-to-one with another.',
      },
      {
        question: 'What makes NFTs different from regular cryptocurrency?',
        options: ['They are cheaper', 'Each one is unique', 'They are faster', 'They use less energy'],
        correctAnswer: 1,
        explanation: 'Unlike fungible cryptocurrencies where each unit is identical, each NFT is unique and represents ownership of a specific digital asset.',
      },
      {
        question: 'What can NFTs represent?',
        options: ['Only digital art', 'Only music', 'Any unique digital asset', 'Only physical items'],
        correctAnswer: 2,
        explanation: 'NFTs can represent ownership of virtually any unique digital asset including art, music, videos, in-game items, domain names, and more.',
      },
    ],
  },
];

const achievements = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    condition: { type: 'lessonsCompleted', value: 1 },
    rewardPoints: 50,
  },
  {
    id: 'knowledge-seeker',
    title: 'Knowledge Seeker',
    description: 'Complete 3 lessons',
    icon: '📚',
    condition: { type: 'lessonsCompleted', value: 3 },
    rewardPoints: 100,
  },
  {
    id: 'crypto-scholar',
    title: 'Crypto Scholar',
    description: 'Complete all beginner lessons',
    icon: '🎓',
    condition: { type: 'lessonsCompleted', value: 2 },
    rewardPoints: 200,
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '💯',
    condition: { type: 'perfectQuizzes', value: 1 },
    rewardPoints: 75,
  },
  {
    id: 'point-collector',
    title: 'Point Collector',
    description: 'Earn 100 points',
    icon: '💰',
    condition: { type: 'points', value: 100 },
    rewardPoints: 100,
  },
  {
    id: 'crypto-expert',
    title: 'Crypto Expert',
    description: 'Complete all advanced lessons',
    icon: '🎯',
    condition: { type: 'lessonsCompleted', value: 6 },
    rewardPoints: 400,
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Get perfect score on 5 quizzes',
    icon: '👑',
    condition: { type: 'perfectQuizzes', value: 5 },
    rewardPoints: 300,
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    condition: { type: 'streak', value: 7 },
    rewardPoints: 150,
  },
  {
    id: 'dedicated-learner',
    title: 'Dedicated Learner',
    description: 'Learn for 30 consecutive days',
    icon: '⚡',
    condition: { type: 'streak', value: 30 },
    rewardPoints: 500,
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete 2 lessons in a day',
    icon: '🌅',
    condition: { type: 'lessonsCompleted', value: 2 },
    rewardPoints: 50,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete 4 lessons in a day',
    icon: '🦉',
    condition: { type: 'lessonsCompleted', value: 4 },
    rewardPoints: 100,
  },
  {
    id: 'defi-specialist',
    title: 'DeFi Specialist',
    description: 'Complete all DeFi and Smart Contracts lessons',
    icon: '🏦',
    condition: { type: 'lessonsCompleted', value: 5 },
    rewardPoints: 250,
  },
];

const leaderboardUsers = [
  { name: 'CryptoMaster', email: 'cryptomaster@demo.com', points: 2850, level: 6, streak: 15, longestStreak: 15 },
  { name: 'Roy', email: 'roy@demo.com', points: 2540, level: 6, streak: 12, longestStreak: 12 },
  { name: 'Anton', email: 'anton@demo.com', points: 2310, level: 5, streak: 10, longestStreak: 10 },
  { name: 'Insiders', email: 'insiders@demo.com', points: 1980, level: 4, streak: 8, longestStreak: 8 },
  { name: 'DefiExpert', email: 'defiexpert@demo.com', points: 1750, level: 4, streak: 7, longestStreak: 7 },
  { name: 'NFTCollector', email: 'nftcollector@demo.com', points: 980, level: 2, streak: 5, longestStreak: 5 },
  { name: 'CryptoNewbie', email: 'cryptonewbie@demo.com', points: 750, level: 2, streak: 3, longestStreak: 3 },
  { name: 'TokenTrader', email: 'tokentrader@demo.com', points: 620, level: 2, streak: 4, longestStreak: 4 },
  { name: 'Web3Builder', email: 'web3builder@demo.com', points: 480, level: 1, streak: 2, longestStreak: 2 },
];

async function seedCollection(collectionName, data, useId = true) {
  const batch = db.batch();
  for (const item of data) {
    const ref = useId && item.id
      ? db.collection(collectionName).doc(item.id)
      : db.collection(collectionName).doc();
    const docData = { ...item };
    if (useId) delete docData.id;
    batch.set(ref, docData);
  }
  await batch.commit();
  console.log(`  Seeded ${data.length} documents into "${collectionName}"`);
}

async function seed() {
  console.log('Starting seed...\n');

  try {
    // Seed modules
    await seedCollection('modules', modules);

    // Seed quizzes
    await seedCollection('quizzes', quizzes);

    // Seed achievements
    await seedCollection('achievements', achievements);

    // Seed demo leaderboard users (as Firestore docs only, no Firebase Auth)
    for (const user of leaderboardUsers) {
      const docId = user.name.toLowerCase().replace(/\s+/g, '-');
      await db.collection('users').doc(docId).set({
        name: user.name,
        email: user.email,
        points: user.points,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });
    }
    console.log(`  Seeded ${leaderboardUsers.length} demo users into "users"`);

    console.log('\nSeed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err);
  }

  process.exit(0);
}

seed();
