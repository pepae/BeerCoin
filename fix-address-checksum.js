// Fix Tina's address checksum
const { ethers } = require('ethers');

const originalAddress = '0xB9532aC5Ba3CB087A58D436B15B45d2FfbdB1e63';

console.log('Original address:', originalAddress);

// Get the correct checksummed version
const checksummedAddress = ethers.getAddress(originalAddress.toLowerCase());

console.log('Correct checksummed address:', checksummedAddress);

// Test that both are equivalent
console.log('Are they equivalent?', originalAddress.toLowerCase() === checksummedAddress.toLowerCase());
