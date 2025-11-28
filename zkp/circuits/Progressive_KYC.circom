pragma circom 2.0.0;

// include "circomlib/poseidon.circom";
include "poseidon.circom";

// Enforces that `in` is either 0 or 1.
template BoolBit() {
    signal input in;
    in * (in - 1) === 0;
}

// Progressive KYC circuit:
// Private inputs are booleans indicating which checks passed.
// Public outputs are statusBits, level, and a Poseidon credentialHash.
//
// Flags:
//  - ageNatOK   : age >= 18 and nationality is valid (from Govt ID)
//  - govtIdOK   : Govt ID (e.g. Aadhaar) is valid
//  - faceOK     : face verification passed
//  - livenessOK : liveness detection passed (optional, can be 0)
//  - salt       : per-credential secret for uniqueness/unlinkability
//
// Outputs:
//  - statusBits   : bitmask encoding which flags are 1
//                   bit0: ageNatOK
//                   bit1: govtIdOK
//                   bit2: faceOK
//                   bit3: livenessOK
//  - level        : simple level = sum of the flags (0..4) – can be customized
//  - credentialHash : Poseidon(ageNatOK, govtIdOK, faceOK, livenessOK, salt)
template KYCKycProgressive() {
    // --------- PRIVATE INPUTS ----------
    signal input ageNatOK;     // 0 or 1
    signal input govtIdOK;     // 0 or 1
    signal input faceOK;       // 0 or 1
    signal input livenessOK;   // 0 or 1
    signal input salt;         // field element (random/stable per credential)

    // --------- PUBLIC OUTPUTS ----------
    signal output statusBits;       // bitmask
    signal output level;            // KYC "strength"
    signal output credentialHash;   // Poseidon commitment

    // --------- BOOLEAN ENFORCEMENT ----------
    component bAge   = BoolBit();
    component bGovt  = BoolBit();
    component bFace  = BoolBit();
    component bLive  = BoolBit();

    bAge.in  <== ageNatOK;
    bGovt.in <== govtIdOK;
    bFace.in <== faceOK;
    bLive.in <== livenessOK;

    // --------- STATUS BITMASK ----------
    // statusBits = ageNatOK + 2*govtIdOK + 4*faceOK + 8*livenessOK
    statusBits <== ageNatOK
                 + 2 * govtIdOK
                 + 4 * faceOK
                 + 8 * livenessOK;

    // --------- LEVEL LOGIC ----------
    // simple version: level = number of successful checks
    // you can customize: e.g. require ageNatOK == 1 when govtIdOK == 1, etc.
    level <== ageNatOK + govtIdOK + faceOK + livenessOK;

    // --------- CREDENTIAL HASH ----------
    // Poseidon over (ageNatOK, govtIdOK, faceOK, livenessOK, salt)
    component hash = Poseidon(5);
    hash.inputs[0] <== ageNatOK;
    hash.inputs[1] <== govtIdOK;
    hash.inputs[2] <== faceOK;
    hash.inputs[3] <== livenessOK;
    hash.inputs[4] <== salt;

    credentialHash <== hash.out;
}

// Main component
component main = KYCKycProgressive();
