# 🛡️ Verify Guardian Flow - Privacy-Preserving KYC System

## 📋 Project Overview

**Verify Guardian Flow** is a comprehensive privacy-preserving KYC (Know Your Customer) verification system that combines **Zero-Knowledge Proofs**, **Blockchain Technology**, **AI-powered Face Matching**, and **Decentralized Storage** to create a secure, private, and tamper-proof identity verification platform.

## 🎯 Problem Statement

Traditional KYC systems expose sensitive personal information, creating privacy risks and centralized data vulnerabilities. Our solution enables identity verification while maintaining complete privacy through cryptographic proofs and decentralized technologies.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERIFY GUARDIAN FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Frontend      │    │   Backend API   │    │   Blockchain │ │
│  │   (React/Vite)  │◄──►│   (FastAPI)     │◄──►│   (Polygon)  │ │
│  │                 │    │                 │    │              │ │
│  │ • Wallet Connect│    │ • Aadhaar Parse │    │ • Smart      │ │
│  │ • KYC Forms     │    │ • Face Matching │    │   Contracts  │ │
│  │ • ZK Proof Gen  │    │ • Data Validate │    │ • Verifier   │ │
│  │ • IPFS Upload   │    │ • Base64 Images │    │ • Soulbound  │ │
│  │ • NFT Minting   │    │                 │    │   NFTs       │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │ Zero-Knowledge  │    │ AI Face Match   │    │   IPFS       │ │
│  │ Proof System    │    │ (DeepFace)      │    │  Storage     │ │
│  │                 │    │                 │    │              │ │
│  │ • Circom 2.0    │    │ • Face Embed    │    │ • Metadata   │ │
│  │ • Groth16       │    │ • Cosine Sim    │    │ • Proofs     │ │
│  │ • snarkjs       │    │ • 75% Threshold │    │ • Documents  │ │
│  │ • Poseidon Hash │    │ • Multi-Face    │    │ • Pinata     │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 System Flow

### **Step 1: User Onboarding**
```
User → Connect Wallet (MetaMask/ThirdWeb) → Access Dashboard
```

### **Step 2: KYC Data Collection**
```
User Input → Aadhaar ZIP Upload → Backend Processing → Data Extraction
       ↓
Face Images (Base64) → AI Face Matching → Similarity Score → Verification
```

### **Step 3: Zero-Knowledge Proof Generation**
```
KYC Data → ZK Circuit (Circom) → Generate Proof → Verify Locally
    ↓
Private Inputs: age, nationality, face_match, liveness
Public Outputs: statusBits, level, credentialHash
```

### **Step 4: Decentralized Storage**
```
Proof + Metadata → IPFS Upload → CID Generation → Immutable Storage
```

### **Step 5: Blockchain Verification**
```
ZK Proof → Smart Contract → On-Chain Verification → Soulbound NFT Mint
```

## 🛠️ Technology Stack

### **Frontend Layer**
| Technology | Purpose | Version |
|------------|---------|---------|
| **React 18** | UI Framework | Latest |
| **TypeScript** | Type Safety | Latest |
| **Vite** | Build Tool | Latest |
| **Tailwind CSS** | Styling | Latest |
| **shadcn/ui** | Component Library | Latest |
| **Framer Motion** | Animations | Latest |
| **ThirdWeb** | Wallet Integration | Latest |
| **React Router** | Navigation | Latest |
| **Lucide Icons** | Icon System | Latest |

### **Backend Layer**
| Technology | Purpose | Version |
|------------|---------|---------|
| **FastAPI** | Web Framework | Latest |
| **Python 3.11+** | Runtime | Latest |
| **DeepFace** | Face Recognition AI | Latest |
| **OpenCV** | Image Processing | Latest |
| **NumPy** | Mathematical Operations | Latest |
| **lxml** | XML Parsing | Latest |
| **Requests** | HTTP Client | Latest |
| **Pydantic** | Data Validation | Latest |

### **Blockchain Layer**
| Technology | Purpose | Network |
|------------|---------|---------|
| **Solidity** | Smart Contracts | Polygon Mumbai |
| **OpenZeppelin** | Security Standards | Latest |
| **Hardhat/Truffle** | Development Framework | Latest |
| **Web3.js/Ethers.js** | Blockchain Interaction | Latest |

### **Zero-Knowledge Proofs**
| Technology | Purpose | Version |
|------------|---------|---------|
| **Circom 2.0** | Circuit Language | Latest |
| **snarkjs** | Proof System | 0.7.5+ |
| **Groth16** | Proof Protocol | Standard |
| **Poseidon** | Hash Function | Latest |

### **Storage & Infrastructure**
| Technology | Purpose | Provider |
|------------|---------|----------|
| **IPFS** | Decentralized Storage | Pinata |
| **Node.js** | Runtime Environment | Latest |

## 📁 Project Structure

```
verify-guardian-flow/
├── 📁 kyc/                          # Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/           # React Components
│   │   │   ├── WalletConnect.tsx    # Wallet Integration
│   │   │   ├── KYCForm.tsx          # KYC Data Input
│   │   │   ├── ProofGenerator.tsx   # ZK Proof Generation
│   │   │   ├── IPFSUploader.tsx     # IPFS Integration
│   │   │   ├── BlockchainSubmit.tsx # On-Chain Submission
│   │   │   ├── NFTMinter.tsx        # Soulbound NFT
│   │   │   └── ui/                  # shadcn/ui Components
│   │   ├── 📁 pages/               # Page Components
│   │   │   ├── Home.tsx            # Landing Page
│   │   │   ├── KYCDashboard.tsx    # Main Dashboard
│   │   │   └── Profile.tsx         # User Profile
│   │   └── 📁 hooks/               # Custom React Hooks
│   ├── package.json                # Dependencies
│   └── vite.config.ts             # Build Configuration
│
├── 📁 kyc_backend/                 # Backend API
│   ├── main.py                    # FastAPI Application
│   ├── 📁 modules/                # Core Modules
│   │   ├── aadhar_xml.py          # Aadhaar Processing
│   │   └── face_match.py          # Face Recognition
│   ├── requirements.txt           # Python Dependencies
│   └── API_DOCUMENTATION.md       # API Documentation
│
├── 📁 zkp/                        # Zero-Knowledge Proofs
│   ├── 📁 circuits/               # Circuit Definitions
│   │   └── Progressive_KYC.circom # Main KYC Circuit
│   ├── 📁 build/                  # Compiled Artifacts
│   │   ├── Progressive_KYC.r1cs   # Constraint System
│   │   └── Progressive_KYC.wasm   # WebAssembly
│   ├── 📁 contracts/              # Smart Contracts
│   │   ├── Verifier.sol           # ZK Verifier
│   │   └── KYC_Soulbound_NFT.sol  # Soulbound NFT
│   ├── 📁 zkeys/                  # Proving Keys
│   ├── 📁 inputs/                 # Test Inputs
│   └── 📁 outputs/                # Generated Proofs
│
└── 📁 docs/                       # Documentation
    ├── frontend_components.md     # Component Guide
    └── todos.md                   # Development Tasks
```

## ⚡ Key Features

### **🔒 Privacy-First Design**
- **Zero-Knowledge Proofs**: Verify identity without revealing sensitive data
- **Local Processing**: KYC validation happens client-side
- **Encrypted Storage**: All sensitive data encrypted before storage

### **🤖 AI-Powered Verification**
- **Face Recognition**: DeepFace AI with 75% similarity threshold
- **Multi-Image Matching**: Passport, Aadhaar, and live photo verification
- **Liveness Detection**: Prevents spoofing attacks
- **Base64 Processing**: Secure image handling without file uploads

### **🌐 Decentralized Architecture**
- **IPFS Storage**: Immutable, decentralized document storage
- **Blockchain Verification**: On-chain proof verification
- **Soulbound NFTs**: Non-transferable identity tokens
- **No Central Authority**: Fully decentralized verification

### **🛡️ Security & Compliance**
- **Groth16 Proofs**: Industry-standard zero-knowledge protocol
- **Poseidon Hashing**: Cryptographically secure hash functions
- **Smart Contract Auditing**: OpenZeppelin security standards
- **CORS Protection**: Secure API access controls

## 🔧 Technical Implementation

### **Zero-Knowledge Circuit Design**
```circom
// Progressive_KYC.circom
template ProgressiveKYC() {
    // Private inputs (hidden from public)
    signal private input ageNatOK;     // Age ≥ 18 & valid nationality
    signal private input govtIdOK;     // Government ID verification
    signal private input faceOK;       // Face matching result  
    signal private input livenessOK;   // Liveness detection
    signal private input salt;         // Unique salt for privacy
    
    // Public outputs (verifiable)
    signal output statusBits;          // Bitmask of passed checks
    signal output level;               // KYC level (0-4)
    signal output credentialHash;      // Poseidon hash commitment
    
    // Circuit logic ensures mathematical validity
    // without revealing private inputs
}
```

### **Face Matching Algorithm**
```python
# Face verification with DeepFace AI
def verify_faces(passport_img, aadhaar_img, live_img):
    # Generate embeddings using Facenet model
    passport_embedding = get_embedding(passport_img)
    aadhaar_embedding = get_embedding(aadhaar_img) 
    live_embedding = get_embedding(live_img)
    
    # Calculate cosine similarity
    passport_live_sim = cosine_similarity(passport_embedding, live_embedding)
    aadhaar_live_sim = cosine_similarity(aadhaar_embedding, live_embedding)
    
    # Convert to percentage and verify threshold
    threshold = 75.0
    verified = (passport_live_sim >= threshold and 
                aadhaar_live_sim >= threshold)
    
    return verified, similarities
```

### **Smart Contract Architecture**
```solidity
// KYC_Soulbound_NFT.sol
contract KYCKycSoulboundNFT is ERC721, Ownable {
    struct KYCInfo {
        uint256 credentialHash;  // ZK proof commitment
        uint8 level;            // Verification level (0-4)
        uint256 statusBits;     // Bitmask of passed checks
    }
    
    function verifyAndMint(
        uint[2] memory _pA,      // ZK proof components
        uint[2][2] memory _pB,   
        uint[2] memory _pC,
        uint[3] memory _publicSignals  // statusBits, level, credentialHash
    ) external {
        // Verify zero-knowledge proof on-chain
        require(verifier.verifyProof(_pA, _pB, _pC, _publicSignals), 
                "Invalid ZK proof");
        
        // Mint soulbound NFT (non-transferable)
        _mint(msg.sender, nextTokenId);
        
        // Store KYC information
        kycOf[msg.sender] = KYCInfo({
            credentialHash: _publicSignals[2],
            level: uint8(_publicSignals[1]),
            statusBits: _publicSignals[0]
        });
    }
}
```

## 🚀 Setup & Installation

### **Prerequisites**
```bash
# Required software
- Node.js 18+ 
- Python 3.11+
- Circom 2.0
- snarkjs
- Git
```

### **1. Clone Repository**
```bash
git clone https://github.com/BhavyaSree16/verify-guardian-flow.git
cd verify-guardian-flow
```

### **2. Frontend Setup**
```bash
cd kyc
npm install
npm run dev    # Starts on http://localhost:5173
```

### **3. Backend Setup**
```bash
cd kyc_backend
pip install -r requirements.txt
python main.py  # Starts on http://localhost:8000
```

### **4. ZK Proof Setup**
```bash
cd zkp
# Compile circuit
circom circuits/Progressive_KYC.circom --r1cs --wasm --sym -o build

# Generate proving keys (trusted setup)
snarkjs powersoftau new bn128 16 powersOfTau/pot16_0000.ptau
snarkjs powersoftau contribute powersOfTau/pot16_0000.ptau powersOfTau/pot16_0001.ptau
snarkjs powersoftau prepare phase2 powersOfTau/pot16_0001.ptau powersOfTau/pot16_final.ptau

# Circuit-specific setup
snarkjs groth16 setup build/Progressive_KYC.r1cs powersOfTau/pot16_final.ptau zkeys/Progressive_KYC_0000.zkey
snarkjs zkey contribute zkeys/Progressive_KYC_0000.zkey zkeys/Progressive_KYC_0001.zkey
snarkjs zkey export verificationkey zkeys/Progressive_KYC_0001.zkey zkeys/verification_key.json
```

### **5. Smart Contract Deployment**
```bash
# Deploy to Polygon Mumbai testnet
npx hardhat deploy --network mumbai
```

## 📊 API Documentation

### **Backend Endpoints**

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/health` | GET | Health Check | None | Status & Features |
| `/extract-aadhaar-from-url` | POST | Parse Aadhaar ZIP | URL + Share Code | Extracted Data |
| `/face-match` | POST | Compare 2 Faces | Base64 Images | Match Percentage |
| `/multi-face-match` | POST | KYC Face Verification | 3 Base64 Images | Verification Result |

### **Request/Response Examples**

**Face Matching:**
```json
// Request
{
  "image1_base64": "base64encodedimage...",
  "image2_base64": "base64encodedimage..."
}

// Response  
{
  "match_percentage": 87.5,
  "is_match": true,
  "threshold": 75.0,
  "success": true,
  "message": "Face matching completed successfully"
}
```

## 🔬 Testing & Validation

### **Unit Tests**
```bash
# Backend API tests
cd kyc_backend
python test_face_api.py

# Frontend component tests  
cd kyc
npm test

# ZK Circuit tests
cd zkp
node test_circuit.js
```

### **Integration Testing**
```bash
# End-to-end workflow test
python test_full_flow.py
```

## 📈 Performance Metrics

| Component | Metric | Performance |
|-----------|---------|-------------|
| **Face Matching** | Processing Time | ~2-3 seconds |
| **ZK Proof Generation** | Generation Time | ~5-10 seconds |
| **Blockchain Verification** | Gas Cost | ~150,000 gas |
| **IPFS Upload** | Upload Time | ~1-2 seconds |
| **Frontend Load** | Initial Load | <3 seconds |

## 🔮 Future Enhancements

### **Phase 2 Roadmap**
- **Multi-Language Support**: Internationalization
- **Mobile App**: React Native implementation  
- **Advanced Biometrics**: Iris and fingerprint recognition
- **Regulatory Compliance**: GDPR, CCPA integration
- **Enterprise Features**: Bulk verification APIs

### **Phase 3 Vision**
- **Cross-Chain Compatibility**: Multi-blockchain support
- **AI/ML Improvements**: Advanced liveness detection
- **Decentralized Identity**: W3C DID integration
- **Zero-Knowledge Evolution**: Latest ZK-STARK protocols

## 🤝 Contributing

### **Development Guidelines**
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message standards

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

### **Key Technologies**
- **[Circom](https://github.com/iden3/circom)** - Zero-Knowledge Circuit Language
- **[snarkjs](https://github.com/iden3/snarkjs)** - JavaScript ZK-SNARK Implementation  
- **[DeepFace](https://github.com/serengil/deepface)** - Face Recognition Library
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python Web Framework
- **[React](https://reactjs.org/)** - Frontend User Interface Library
- **[OpenZeppelin](https://openzeppelin.com/)** - Smart Contract Security Standards

### **Research & Inspiration**
- Privacy-preserving identity verification research
- Zero-knowledge proof applications in KYC
- Decentralized identity standards (W3C DID)
- Blockchain-based credential systems

---

## 📞 Contact & Support

### **Team**
- **Lead Developer**: [Your Name]
- **Blockchain Specialist**: [Team Member]
- **AI/ML Engineer**: [Team Member]

### **Links**
- **🌐 Live Demo**: [Demo URL]
- **📖 Documentation**: [Docs URL]
- **🐛 Issue Tracker**: [Issues URL]
- **💬 Discord**: [Community URL]

---

**Built with ❤️ for a privacy-preserving future**