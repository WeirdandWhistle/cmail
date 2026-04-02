let sodium = null;
const KEY_LENGTH = 32;
const X25519_KEY_LEN = 32;
const NOUCE_LENGTH = 24;
const MAC_LENGTH = 16;
const ctx_length = 8;

// opsLimit and memLimit are client dependent BUT should always be the same, and I reccomend useing the same as other clients, for consitancy.
const opsLimit = 4;
const memLimit = 128 * 1000 * 1000; 

let A;
let B;

/* addtional data for message objects:
    [24 bytes] nouce +
    [32 bytes] publicKey (the ECDHE pk for this message) +
    [32 bytes] recipientPublicKey (the public key of who the message is intended for)
*/

/*message object:
{
    payload:{
        message: "text",
        blocks:{
        
        },
        metadata:{
        
        },
        etc...
    },
    username: "username of person claiming to send the message",
    publicKey:"public of person claiming to send the message",
    signature:"base64 of the signature."
}
    payload is what is signed. the signautre of payload is stored in `signature`.
    trust is broken when:
        1. public key pulled from server doesn't match `publicKey`. i.e: server_publicKey(username) != publicKey;
        2. username pulled from server doesn't match `username`. i.e: server_username(publicKey) != username;
        3. signature is not correct. i.e: check_signature(payload, publickey) == false;
    What todo when trust is broken; is client dependent,
     but should at least put a big red box over the message, and should proably not render it at all and report the incedent to the user
*/

/* payload for account entry
    addition data {
        [24 bytes] nouce +
        [32 bytes] public key (Ed25519) +
        [2 bytes] usernameLength (how many bytes until the start if cipher text) (big edian order) +
        [n bytes] username +
        [2 bytes] cipherText length (how many byte until end of message) (big edian order)
    }
    +
    cipherText {
        [32 bytes] private key (Ed25519)
    }
    +
    authentication tag for chacha20-poly1305
*/

const constantWords = ["Just ask for the regular! The regular is a HAM and CHEESE!",
    "Who do you see? Who do you think your talking to? Someone opens the door and gets shot, you think that of me? I am not in danger. I am the danger! I AM THE ONE WHO KNOCKS!",
    "Hello. my name is emigo-montoy0. you killed my father. prepare to die.",
    "1234? thats the password an idiot would put on his luggage!",
    "When life gives you lemons, DONT MAKE LEMONADE! Make life take the lemons back! GET MAD! I DONT WANT YOUR DAMM LEMONS! Demand to see lifes manager!"];

export function init(s){sodium=s;}
function loaded(){
    if(sodium===null){throw new Error("Sodium must be loaded!");}
}
function logConstants(){
    console.log("crypto_pwhash_SALTBYTES",sodium.crypto_pwhash_SALTBYTES);
    console.log("crypto_pwhash_PASSWD_MIN",sodium.crypto_pwhash_PASSWD_MIN);
    console.log("crypto_pwhash_PASSWD_MAX",sodium.crypto_pwhash_PASSWD_MAX);

}
export function getBaseKey(username, password){
    loaded();
    //logConstants();
    
    const salt = sodium.crypto_generichash(sodium.crypto_pwhash_SALTBYTES, username+password+constantWords[2],null);
    return sodium.crypto_pwhash(KEY_LENGTH, password, salt, opsLimit, memLimit ,sodium.crypto_pwhash_ALG_ARGON2ID13);    
}
/**  you should only ever need to use the `messageKey` and `publicKey`. send `publicKey` with message, and encrypt message with `messaegKey`.
 * @param recipientPubkey the public key of the person your sending the message to.
 * @returns a js object contaning the public, private(secret), and exchanged keys to use to send a message: `{publicKey, secretKey, messageKey}`. `meskey` is the sharedsecret used to send the message
 * 
 * */
export function createMessageKeypair(recipientPubkey){
    loaded();
    const privateKey=sodium.randombytes_buf(X25519_KEY_LEN);
    const publicKey=sodium.crypto_scalarmult_base(privateKey);
    const messageKey=sodium.crypto_scalarmult(privateKey,recipientPubkey);
    return {privateKey:privateKey,publicKey:publicKey,messageKey:messageKey};
}
/**
 * 
 * @returns a js object `{publicKey,privateKey}` public key and private key, respectively.
 */
export function createX25519Keypair(){
    loaded();
    const privateKey=sodium.randombytes_buf(X25519_KEY_LEN);
    const publicKey=sodium.crypto_scalarmult_base(privateKey);
    return {publicKey:publicKey,privateKey:privateKey};
}
/**
 * This function is used at account creation to generate the permant public/private keypair used for both signing and *encryption.
 * @returns a js object {publicKey, privateKey, keyType}. the private key contains both the public and private key for ed25519. keyType should only ever be 'ed25519'.
 * * kinda - the key is converted to X25519 before being used for encryption.
 */
export function createEd25519Keypair(){
    loaded();
    let out = sodium.crypto_sign_keypair();
    out.privateKey = out.privateKey.slice(0,KEY_LENGTH);
    return out;
}

/**
 * uses XChaCha20-poly1305 implemented by libsodium
 * @param {String} payload the entire payload of the message. inlcuding metadata, blocks, and other. the entire payload is signed
 * @param {String} username this is the "regisitered name" of the user sending the message. this is used to confirm the the signature of the sender.
 * @param {JsonObject} messageKeypair the shared secret(`messageKey`) and `publicKey` derived from `createMessageKeypair()`. should be of the form `{publicKey, secretKey, messageKey}`
 * @param {Uint8Array} signingKey the ed25519 private key used for signing.
 * @param {Uint8Array} signingPublicKey the public key corisponding to the private `signingKey`
 * @param {Uint8Array} recipientPubkey the Ed25519 public key of the recipient.
 */
export function encryptMessage(payload,username,messageKeypair,signingKey,signingPublicKey,recipientPublicKey){
    if(typeof payload != 'string'){
        throw new Error("payload is not of type string!");
    }
    loaded();
    
    const nouce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

    const addtionalData = nouce.concat(messageKeypair.publicKey, recipientPublicKey);

    const signature = sodium.crypto_sign_detached(payload,signingKey);
    const signatureBase64 = sodium.to_base64(signature);

    const signingPublicKeyBase64 = sodium.to_base64(signingPublicKey);

    const message = `{"payload":${payload},"username":"${username}","publicKey":"${signingPublicKeyBase64}","signature":"${signatureBase64}"}`;
    
    const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(message,addtionalData,null,nouce,messageKeypair.messageKey);

    return addtionalData.concat(encrypted);
}
/**
 * @param {Uint8Array} vaultKey using to encrypt the private key payload. derived from the key schelue (smilar to TLS1.3).
 * @param {Uint8Array} publicKey a Ed25519 public key used for signging and encryption.
 * @param {Uint8Array} privateKey a Ed25519 private key mathmaticly linked to the public key. used for signing.
 * @param {String} username a string of the `username` of the sender! Woah who could have guessed?
 * @returns a `Uint8Array` conating the additionData + the cipherText + the authenication tag. this is what is store in a database entry.
 */
export function generateAccountVault(vaultKey,publicKey,privateKey,username){
    loaded();
    const nouce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0,username.length,false);
    const usernameLength = new Uint8Array(buffer); 
    const usernameArray = sodium.from_string(username);

    // console.log("nouce",nouce);
    const cipherTextLengthArr = setUint16(KEY_LENGTH+sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES);
    const addtionalData = concatArr(nouce,publicKey,usernameLength,usernameArray,cipherTextLengthArr);
    const encryptedObject = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt_detached(privateKey,addtionalData,null,nouce,vaultKey);
    const encrypted = encryptedObject.ciphertext;
    console.log("encrypted with",vaultKey,"nouce",nouce,"additionalData",addtionalData,"A",encrypted);
    A=encrypted;
    return concatArr(addtionalData,encrypted,encryptedObject.mac);
}
export function decodeAccountVault(vault,vaultKey){
    loaded();
    let cursor = 0;
    console.log("vault",vault);

    const nouce = vault.slice(cursor,cursor+NOUCE_LENGTH);
    cursor += NOUCE_LENGTH;

    const publicKey = vault.slice(cursor,cursor+KEY_LENGTH);
    cursor += KEY_LENGTH;

    const usernameLengthArr = vault.slice(cursor,cursor+2);
    cursor += 2;
    const usernameLength = getUint16(usernameLengthArr);

    const usernameArr = vault.slice(cursor,cursor+usernameLength);
    const username = new TextDecoder().decode(usernameArr);
    // console.log("decoded username is",username);
    cursor += usernameLength;

    const cipherTextLengthArr = vault.slice(cursor,cursor+2);
    cursor += 2;
    console.log("cipherTextLengthArr",cipherTextLengthArr);

    const cipherTextLength = getUint16(cipherTextLengthArr);

    // console.log("cursor",cursor,"cipherTextLength",cipherTextLength);
    const cipherText = vault.slice(cursor,cursor+cipherTextLength-16);
    cursor+=cipherTextLength-16;

    const mac = vault.slice(cursor,cursor+MAC_LENGTH);

    const additionData = concatArr(nouce,publicKey,usernameLengthArr,usernameArr,cipherTextLengthArr);
    console.log("decrypted with",vaultKey,"nouce",nouce,"additonalData",additionData,"B",cipherText);
    B=cipherText;
    console.log("A and B same?",comparAB());

    const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt_detached(null,cipherText,mac,additionData,nouce,vaultKey);

    const privateKey = decrypted.slice(0,cursor+KEY_LENGTH);

    let out = {privateKey:privateKey,publicKey:publicKey,username:username,nouce:nouce};

    return out;
    
}
export function getUint16(arr){
    console.log("getUint16 arr",arr);
    return new DataView(arr.buffer).getUint16(0, false);
}
export function setUint16(num){
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0,num,false);
    return new Uint8Array(buf);
}
/**
 * psss.
 * hey you!
 * yeah...
 * you...
 * guess what?
 * I made TLS. You hear that?
 *
 ```text
/$$$$$$       /$$      /$$  /$$$$$$  /$$$$$$$  /$$$$$$$$       /$$$$$$$$ /$$        /$$$$$$    /$$        /$$$$$$   /$$
|_  $$_/      | $$$    /$$$ /$$__  $$| $$__  $$| $$_____/      |__  $$__/| $$       /$$__  $$ /$$$$       /$$__  $$| $$
--| $$        | $$$$  /$$$$| $$  \ $$| $$  \ $$| $$               | $$   | $$      | $$  \__/|_  $$      |__/  \ $$| $$
--| $$        | $$ $$/$$ $$| $$$$$$$$| $$  | $$| $$$$$            | $$   | $$      |  $$$$$$   | $$         /$$$$$/| $$
--| $$        | $$  $$$| $$| $$__  $$| $$  | $$| $$__/            | $$   | $$       \____  $$  | $$        |___  $$|__/
--| $$        | $$\  $ | $$| $$  | $$| $$  | $$| $$               | $$   | $$       /$$  \ $$  | $$       /$$  \ $$    
-/$$$$$$      | $$ \/  | $$| $$  | $$| $$$$$$$/| $$$$$$$$         | $$   | $$$$$$$$|  $$$$$$/ /$$$$$$ /$$|  $$$$$$/ /$$
|______/      |__/     |__/|__/  |__/|_______/ |________/         |__/   |________/ \______/ |______/|__/ \______/ |__/
```
 * @param {Uint8Array} baseKey this is derived from `getBaseKey()`. this is gotten from the password + username scrable. everything is based from this key.
 * @returns {JsonObject} this function returns a big json object of mostly if not all `Uint8Array`s that have various uses for encryption and decryption.
 */
export function keySchedule(baseKey){
    loaded();
    let out = {};

    const vaultKey = sodium.crypto_kdf_derive_from_key(KEY_LENGTH,1,"vaultKey",baseKey);

    out.vaultKey = vaultKey;

    return out;
}
export function concatArr(...arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }  
  return result;
}
export function comparAB(){
    if(A.length != B.length){
        return false;
    }
    for(let i=0; i<A.length;i++){
        if(A[i]!=B[i]){
            console.log("a-b not same at",i,`where A[i]=${A[i]} and B[i]=${b[i]}`);
            return false;
        }
    }
    return true;
}
