let sodium = null;
const key_length = 32;
const X25519_KEY_LEN = 32;

const opsLimit = 4;
const memLimit = 88 * 1000 * 1000; //

const constantWords = ["Just ask for the regular! The regular is a HAM and CHEESE!",
    "would you like to purchase some extened warranty?",
    "Hello. my name is emigo-montoy0. you killed my father. prepare to die.",
    "1234? that the password an idiot would put on his luggage!",
    "When life gives you lemons, DONT MAKE LEMONADE! Make life take the lemons back! GET MAD! I DONT WANT YOUR DAMM LEMONS! Demand to see lifes manager!"];

export function init(s){sodium=s;}
function loaded(){
    if(sodium===null){throw new error("Sodium must be loaded!")}
}
function logConstants(){
    console.log("crypto_pwhash_SALTBYTES",sodium.crypto_pwhash_SALTBYTES);
    console.log("crypto_pwhash_PASSWD_MIN",sodium.crypto_pwhash_PASSWD_MIN);
    console.log("crypto_pwhash_PASSWD_MAX",sodium.crypto_pwhash_PASSWD_MAX);

}
export function getBaseKey(username, password){
    loaded();
    logConstants();
    
    const salt = sodium.crypto_generichash(sodium.crypto_pwhash_SALTBYTES, username+password+constantWords[2],null);
    return sodium.crypto_pwhash(key_length, password, salt, opsLimit, memLimit ,sodium.crypto_pwhash_ALG_ARGON2ID13);    
}
/**  you should only ever need to use the `meskey` and `pubkey`. send `pubkey` with message, and encrypt message with `meskey`.
 * @param recipientPubkey the public key of the person your sending the message to.
 * @returns a js object contaning the public, private(secret), and exchanged keys to use to send a message: `{pubkey, seckey, meskey}`. `meskey` is the sharedsecret used to send the message
 * 
 * */
export function createMessageKeypair(recipientPubkey){
    const seckey=sodium.randombytes_buf(X25519_KEY_LEN);
    const pubkey=sodium.crypto_scalarmult_base(seckey);
    const meskey=sodium.crypto_scalarmult(seckey,recipientPubkey);
    return {seckey:seckey,pubkey:pubkey,meskey:meskey};
}
/**
 * 
 * @returns a js object `{pubkey,seckey}` public key and private key, respectively.
 */
export function createKeypair(){
    const seckey=sodium.randombytes_buf(X25519_KEY_LEN);
    const pubkey=sodium.crypto_scalarmult_base(seckey);
    return {pubkey:pubkey,seckey:seckey};
}