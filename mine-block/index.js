const fs = require('fs');
const path = require('path');

// Set a configurable difficulty target
const DEFAULT_DIFFICULTY_TARGET = '0000ffff00000000000000000000000000000000000000000000000000000000';
let difficultyTarget = DEFAULT_DIFFICULTY_TARGET;

// Function to validate a transaction (replace with your specific logic)
function validateTransaction(transaction) {
  // Implement your comprehensive transaction validation logic here,
  // checking for essential fields (sender, receiver, amount, signatures),
  // potential double-spending, and adherence to blockchain rules.
  // This is a placeholder for now.
  return true;
}

// Function to create the coinbase transaction
function createCoinbaseTransaction(minerAddress, reward) {
  return {
    sender: 'Miner Reward',
    recipient: minerAddress, // Replace with the actual miner's address
    amount: reward, // Replace with the actual mining reward
  };
}

// Function to calculate the hash of a block header
function calculateHash(blockHeader) {
  // const hash = crypto.createHash('sha256').update(blockHeader).digest('hex');
  // return hash;
}

// Function to mine the block
async function mineBlock(txids, minerAddress, reward) {
  const validTransactions = txids.filter(txid => validateTransaction(getTransaction(txid)));

  const coinbaseTransaction = createCoinbaseTransaction(minerAddress, reward); 

  // Build the block header with essential information
  let blockHeader = `version:<span class="math-inline">\{1\} timestamp\:</span>{Date.now()} difficulty:<span class="math-inline">\{difficultyTarget\} nonce\:</span>{0} coinbase:<span class="math-inline">\{JSON\.stringify\(coinbaseTransaction\)\} txids\:</span>{validTransactions.join(':')}`;
  let nonce = 0; // Initialize mining counter

  console.log('Mining block...');

  // Perform Proof-of-Work (PoW) to find a hash satisfying the difficulty target
  while (true) {
    blockHeader = `version:<span class="math-inline">\{1\} timestamp\:</span>{Date.now()} difficulty:<span class="math-inline">\{difficultyTarget\} nonce\:</span>{nonce} coinbase:<span class="math-inline">\{JSON\.stringify\(coinbaseTransaction\)\} txids\:</span>{validTransactions.join(':')}`;
    const hash = calculateHash(blockHeader);

    if (hash.startsWith(difficultyTarget)) {
      console.log(`Block mined successfully! Hash: ${hash}`);
      break;
    }

    nonce++;
  }

  // Write the block header to output.txt
  fs.writeFile('output.txt', blockHeader, err => {
    if (err) {
      console.error('Error writing to output.txt:', err);
    } else {
      console.log('Block header written to output.txt.');
    }
  });
}

// Function to get a transaction by its ID (optional, for more flexibility)
function getTransaction(txid) {
  // Implement logic to retrieve a transaction from a database or storage based on its ID
  // This could involve querying a blockchain node or a local transaction pool.
  // For simplicity, we'll assume transactions are readily available in the mempool.
  const filePath = path.join(__dirname, 'mempool', `${txid}.json`);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading transaction ${txid}:`, error);
    return null; // Handle missing or invalid transactions
  }
}

// Read files from the mempool directory
fs.readdir(path.join(__dirname, 'mempool'), (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }
});

  const txids = files.map(file => file.replace('.json', '')); // Extract transaction IDs from filenames

  // Allow optional configuration of difficulty target
  const processArgs = process.argv.slice(2);
  if (processArgs.length === 1) {
    difficultyTarget = processArgs[0];
    console.log(`Using custom difficulty target: ${difficultyTarget || DEFAULT_DIFFICULTY_TARGET}`);
  }

  // Mine the block with the extracted transaction IDs
  mineBlock(txids, 'minerAddress', 10); // Replace with actual miner address and reward
