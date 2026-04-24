const http = require('http');
const https = require('https');

const BASE = 'http://localhost:5001/api';
const API_KEY = 'AIzaSyAOX4ar_yCPTpk4GPa2W5cvVjkgwVP_lys';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const email = 'routetest' + Date.now() + '@test.com';

  // 1. SIGNUP
  console.log('=== 1. POST /auth/signup ===');
  const signup = await request('POST', '/auth/signup', { name: 'Route Tester', email, password: 'test123456' });
  console.log('Status:', signup.status);
  console.log('Response:', JSON.stringify(signup.data, null, 2));

  const customToken = signup.data.token;

  // Exchange custom token for ID token
  console.log('\n--- Exchanging custom token for ID token ---');
  const exchangeRes = await httpsPost(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=' + API_KEY,
    { token: customToken, returnSecureToken: true }
  );
  const idToken = exchangeRes.idToken;
  if (!idToken) {
    console.log('FAILED to get ID token:', exchangeRes);
    return;
  }
  console.log('ID Token obtained: YES');

  // 2. LOGIN
  console.log('\n=== 2. POST /auth/login ===');
  const login = await request('POST', '/auth/login', { email });
  console.log('Status:', login.status);
  console.log('Response:', JSON.stringify(login.data, null, 2));

  // 3. GET ALL MODULES
  console.log('\n=== 3. GET /modules ===');
  const modules = await request('GET', '/modules', null, idToken);
  console.log('Status:', modules.status);
  console.log('Modules count:', Array.isArray(modules.data) ? modules.data.length : 'N/A');
  if (Array.isArray(modules.data)) console.log('Titles:', modules.data.map(m => m.title));

  // 4. GET MODULE BY ID
  console.log('\n=== 4. GET /modules/what-is-cryptocurrency ===');
  const mod = await request('GET', '/modules/what-is-cryptocurrency', null, idToken);
  console.log('Status:', mod.status);
  console.log('Title:', mod.data.title);
  console.log('Content blocks:', mod.data.content ? mod.data.content.length : 0);

  // 5. COMPLETE LESSON
  console.log('\n=== 5. POST /progress/completeLesson ===');
  const complete = await request('POST', '/progress/completeLesson', { moduleId: 'what-is-cryptocurrency' }, idToken);
  console.log('Status:', complete.status);
  console.log('Response:', JSON.stringify(complete.data, null, 2));

  // 6. GET PROGRESS
  console.log('\n=== 6. GET /progress ===');
  const progress = await request('GET', '/progress', null, idToken);
  console.log('Status:', progress.status);
  console.log('Progress entries:', Array.isArray(progress.data) ? progress.data.length : 'N/A');
  if (Array.isArray(progress.data)) console.log('Data:', JSON.stringify(progress.data, null, 2));

  // 7. GET QUIZ
  console.log('\n=== 7. GET /quiz/what-is-cryptocurrency ===');
  const quiz = await request('GET', '/quiz/what-is-cryptocurrency', null, idToken);
  console.log('Status:', quiz.status);
  console.log('Questions:', quiz.data.questions ? quiz.data.questions.length : 0);
  if (quiz.data.questions) {
    const hasNoAnswers = quiz.data.questions.every(q => q.correctAnswer === undefined);
    console.log('Answers stripped:', hasNoAnswers);
  }

  // 8. SUBMIT QUIZ (perfect score)
  console.log('\n=== 8. POST /quiz/submit (perfect score) ===');
  const submit = await request('POST', '/quiz/submit', { moduleId: 'what-is-cryptocurrency', answers: [1, 1, 2] }, idToken);
  console.log('Status:', submit.status);
  console.log('Response:', JSON.stringify(submit.data, null, 2));

  // 9. GET ACHIEVEMENTS
  console.log('\n=== 9. GET /achievements ===');
  const achievements = await request('GET', '/achievements', null, idToken);
  console.log('Status:', achievements.status);
  console.log('Total achievements:', Array.isArray(achievements.data) ? achievements.data.length : 'N/A');
  if (Array.isArray(achievements.data)) {
    const unlocked = achievements.data.filter(a => a.unlocked);
    console.log('Unlocked:', unlocked.map(a => a.title));
  }

  // 10. GET LEADERBOARD
  console.log('\n=== 10. GET /leaderboard ===');
  const lb = await request('GET', '/leaderboard', null, idToken);
  console.log('Status:', lb.status);
  if (lb.data.leaderboard) console.log('Top users:', lb.data.leaderboard.map(u => u.name + ': ' + u.points + 'pts'));
  if (lb.data.currentUser) console.log('Current user rank:', lb.data.currentUser.rank);

  // 11. GET PORTFOLIO
  console.log('\n=== 11. GET /simulator/portfolio ===');
  const portfolio = await request('GET', '/simulator/portfolio', null, idToken);
  console.log('Status:', portfolio.status);
  console.log('Balance:', portfolio.data.balance);
  console.log('Holdings:', portfolio.data.holdings ? portfolio.data.holdings.length : 0);
  console.log('Prices:', Object.keys(portfolio.data.prices || {}));

  // 12. BUY CRYPTO
  console.log('\n=== 12. POST /simulator/trade (buy 0.1 BTC) ===');
  const buy = await request('POST', '/simulator/trade', { crypto: 'BTC', type: 'buy', amount: 0.1 }, idToken);
  console.log('Status:', buy.status);
  console.log('Response:', JSON.stringify(buy.data, null, 2));

  // 13. SELL CRYPTO
  console.log('\n=== 13. POST /simulator/trade (sell 0.05 BTC) ===');
  const sell = await request('POST', '/simulator/trade', { crypto: 'BTC', type: 'sell', amount: 0.05 }, idToken);
  console.log('Status:', sell.status);
  console.log('Response:', JSON.stringify(sell.data, null, 2));

  // 14. GET TRANSACTION HISTORY
  console.log('\n=== 14. GET /simulator/history ===');
  const history = await request('GET', '/simulator/history', null, idToken);
  console.log('Status:', history.status);
  console.log('Transactions:', Array.isArray(history.data) ? history.data.length : 'N/A');
  if (Array.isArray(history.data)) console.log('Data:', JSON.stringify(history.data, null, 2));

  console.log('\n========================================');
  console.log('  ALL 14 ROUTES TESTED');
  console.log('========================================');
}

run().catch(console.error);
