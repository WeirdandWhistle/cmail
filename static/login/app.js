import * as crypto from '../crypto.js';

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
const signin_button = document.getElementById("signin-button");
const signup_password = document.getElementById("signup-password");
const signup_username = document.getElementById("signup-username");
const signup_button = document.getElementById("signup-button");
const alerts = document.getElementById("alerts");
const body = document.getElementById("body");

let keys = null;

async function main(){
    await sodium.ready;
    console.log("from main",sodium.to_hex(sodium.crypto_hash_sha256("test")));
    console.log("sodium loaded and ready to go!");
    crypto.init(sodium);

    console.log("sign keypair",crypto.createEd25519Keypair());
}

let count = 1;
function alert(text,color){
    const alertTime = 5;
    const element = `<div id="alert-${count}" style="margin:5px;height: min-content; width: 100%;color: ${color};border: 1px ${color} solid; padding: 2px;">${text}</div>`;

    alerts.insertAdjacentHTML("afterbegin",element);

    setTimeout(()=>{document.getElementById(`alert-${count}`).remove();},alertTime*1000);
}

signin_button.addEventListener("click",signin);
async function signin(){
    alert("Logging in!","green");

    const username = signin_username.value;
    const password = signin_password.value;
    if(password.length <= 0){
        alert("Belive it or not you do need a password!","red");
        return;
    }
    if(username.length <= 0){
        alert("Belive it or not you do need a username!","red");
        return;
    }
    
    const baseKey = crypto.getBaseKey(username,password);

    await logIn(baseKey,username);
}

signup_button.addEventListener("click",signup);
async function signup(){
    //console.log("starting sign up sequence!");
    const username = signup_username.value;
    const password = signup_password.value;
    if(password.length <= 0){
        alert("Belive it or not you do need a password!","red");
        return;
    }
    if(username.length <= 0){
        alert("Belive it or not you do need a username!","red");
        return;
    }
    
    const start = window.performance.now();
    const baseKey = crypto.getBaseKey(username,password);
    const end= window.performance.now();

    //console.log("baseKey",baseKey);

    let dif = end-start;
    dif /= 1000;
    //console.log("baseKey Calculation took",dif,"seconds");
    //console.log("baseKey:",baseKey);

    keys = crypto.keySchedule(baseKey);

    const idKeys = crypto.createEd25519Keypair();
    console.log("created privateKey",idKeys.privateKey);

    const accountVault = crypto.generateAccountVault(keys.vaultKey,idKeys.publicKey,idKeys.privateKey,username);

    // console.log("accountVault",accountVault);

    const res = await fetch("/cmail/account/create",{
        method: 'POST',
        body:accountVault,
    });
    const json = await res.json();
    if(json.ok){
        alert("Succseful Sign Up!","green");
    } else {
        alert("Error: "+json.error,"red");
    }
}
async function logIn(baseKey,username) {
    const res = await fetch("/cmail/account/get",{
        method:'POST',
        body:JSON.stringify({username:username}),
    });
    let vault = await res.bytes();
    keys = crypto.keySchedule(baseKey);
    vault = crypto.decodeAccountVault(vault,keys.vaultKey);
}