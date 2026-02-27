require('dotenv').config();
const jwt = require('jsonwebtoken');
const readline = require('readline');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for LRN
rl.question('Enter student LRN: ', (studentLRN) => {
    if (!studentLRN) {
        console.error('LRN is required');
        rl.close();
        return;
    }

    // Generate JWT
    const token = jwt.sign(
        { lrn: studentLRN },
        process.env.JWT_SECRET,
        { expiresIn: '16h' }
    );

    console.log('\nGenerated Token:\n', token);
    rl.close();
});