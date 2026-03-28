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
const alerts = document.getElementById("alerts");

async function main(){
    await sodium.ready;
    console.log("from main",sodium.to_hex(sodium.crypto_hash_sha256("test")));
    console.log("sodium loaded and ready to go!");
}

let count = 1;
function alert(text,color){
    const alertTime = 5;
    const element = `<div id="alert-${count}" style="height: min-content; width: 100%;color: ${color};border: 1px ${color} solid; padding: 2px;">${text}</div>`;

    alerts.insertAdjacentHTML("afterbegin",element);

    setTimeout(()=>{document.getElementById(`alert-${count}`).remove();},alertTime*1000);
}

function signin(){
    alert("for no reason","green");
}
function signup(){

}