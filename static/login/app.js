import * as crypto from '/js/crypto.js';
import * as login from "/js/login.js";

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
const password_comment =document.getElementById("passwordComment");
const alerts = document.getElementById("alerts");
const body = document.getElementById("body");

let keys = null;

signup_password.addEventListener("keyup",()=>{
    const len = signup_password.value.length;
    let mes = "How did you even manage this?";
    let color = "purple";
    if(len <= 0){
        mes = "";
        color="";
    }
    else if(len <= 4){
        mes = "You really should NOT use a that short of a password.";
        color="red";
    }else if(4 < len && len <= 8){
        mes="Your password would take a few weeks to guess.";
        color="#FFA500";
    } else if(6<len && len<=12){
        mes="Pretty good, but theres still one more tier";
        color="#00ff00";
    } else if(12<len && len<32){
        mes="Damm near perfect!";
        color="#029902";
    } else if(len == 32){
        mes="Perfect!";
        color="#da9100";
    } else if(len<=33){
        mes="Then you had to go and ruin a good thing! THANKS A LOT!";
        color="RED";
    } else if(len<=34){
        mes="You dont get any more security out of this!";
        color="grey";
    }else if(len<=35){
        mes="Theres no more messages after this.";
        color="grey";
    }else if(len<=36){
        mes="Make me a liar!";
        color="grey";
    }else if(len<=37){
        mes="Make me a liar AGAIN!";
        color="grey";
    }else if(true){
        mes="nahhh for real though... i getting bored writing this";
        color="grey";
    }    
    password_comment.innerText=mes;
    password_comment.style.color=color;
});

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

    await login.logIn(crypto,baseKey,username);
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