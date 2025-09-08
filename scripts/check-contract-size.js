const hre = require("hardhat");

async function main() {
  console.log("Checking KASTGovernance contract size...");
  
  // Get the contract factory
  const KASTGovernance = await hre.ethers.getContractFactory("KASTGovernance");
  
  // Get the bytecode
  const bytecode = KASTGovernance.bytecode;
  const bytecodeSize = (bytecode.length - 2) / 2; // Remove '0x' and divide by 2 for bytes
  
  console.log(`Contract bytecode size: ${bytecodeSize} bytes`);
  console.log(`Mainnet limit: 24576 bytes`);
  console.log(`Size check: ${bytecodeSize <= 24576 ? '✅ PASS' : '❌ FAIL'}`);
  
  if (bytecodeSize > 24576) {
    console.log(`Contract exceeds limit by ${bytecodeSize - 24576} bytes`);
  } else {
    console.log(`Contract is ${24576 - bytecodeSize} bytes under the limit`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });