let sodium = null;
const key_length = 32;

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