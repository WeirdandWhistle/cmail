let sodium;
window.sodium = {
    onload: function (s) {
        console.log("loaded sodium from main file!");
        sodium=s;
        main();
    }
};

const signin_password = document.getElementById("signin-password");
const signin_username = document.getElementById("signin-username");
const signup_password = document.getElementById("signup-password");
const signup_username = document.getElementById("signup-username");

async function main(){
    await sodium.ready;
    console.log("from main",sodium.to_hex(sodium.crypto_hash_sha256("test")));
    console.log("sodium loaded and ready to go!");
}