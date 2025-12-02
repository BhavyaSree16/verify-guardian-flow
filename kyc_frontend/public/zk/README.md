# Zero-Knowledge Circuit Files

This directory should contain the following files for the KYC ZK proof system to work:

## Required Files:

1. **Progressive_KYC.wasm** - The compiled circuit WASM file
   - Generated from the Circom circuit compilation
   - Used by snarkjs to generate proofs

2. **Progressive_KYC_final.zkey** - The final proving key
   - Generated during the trusted setup ceremony
   - Contains the parameters needed for proof generation

3. **verification_key.json** - The verification key
   - Extracted from the zkey file
   - Used to verify proofs off-chain

## File Structure:
```
public/
└── zk/
    ├── Progressive_KYC.wasm
    ├── Progressive_KYC_final.zkey
    ├── verification_key.json
    └── README.md (this file)
```

## How to Generate These Files:

1. **Compile the Circom circuit:**
   ```bash
   circom Progressive_KYC.circom --r1cs --wasm --sym
   ```

2. **Generate the proving key (trusted setup):**
   ```bash
   # Start a new Powers of Tau ceremony
   snarkjs powersoftau new bn128 16 pot16_0000.ptau -v
   snarkjs powersoftau contribute pot16_0000.ptau pot16_0001.ptau --name="First contribution" -v
   snarkjs powersoftau prepare phase2 pot16_0001.ptau pot16_final.ptau -v
   
   # Setup for the circuit
   snarkjs groth16 setup Progressive_KYC.r1cs pot16_final.ptau Progressive_KYC_0000.zkey
   snarkjs zkey contribute Progressive_KYC_0000.zkey Progressive_KYC_0001.zkey --name="1st Contributor Name" -v
   snarkjs zkey export finalzkey Progressive_KYC_0001.zkey Progressive_KYC_final.zkey
   ```

3. **Extract verification key:**
   ```bash
   snarkjs zkey export verificationkey Progressive_KYC_final.zkey verification_key.json
   ```

## Circuit Inputs:

The KYC circuit expects the following inputs:
- `ageNatOK`: 1 if age >= 18, 0 otherwise
- `govtIdOK`: 1 if government ID is verified, 0 otherwise  
- `faceOK`: 1 if face verification passed, 0 otherwise
- `livenessOK`: 1 if liveness detection passed, 0 otherwise
- `salt`: Random number for privacy

## Circuit Outputs:

- `statusBits`: Bitmask of verification results
- `level`: KYC verification level (0-15)
- `credentialHash`: Poseidon hash commitment of the verification data