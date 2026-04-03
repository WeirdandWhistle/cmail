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

const alerts = document.getElementById("alerts");

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