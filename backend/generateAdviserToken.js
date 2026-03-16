require('dotenv').config({ path: __dirname + '/.env' });
const jwt = require('jsonwebtoken');
const readline = require('readline');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for adviserId
rl.question('Enter adviser ID: ', (adviserId) => {
    if (!adviserId) {
        console.error('Adviser ID is required');
        rl.close();
        return;
    }

    // Generate JWT
    const token = jwt.sign(
        { adviserId },
        process.env.JWT_SECRET,
        { expiresIn: '16h' }
    );

    console.log('\nGenerated Token:\n', token);
    rl.close();
});