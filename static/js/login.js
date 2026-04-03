const sessionStorage = window.sessionStorage;
const TRUSTED_ERROR_URL = "https://github.com/WeirdandWhistle/cmail/blob/main/SEREVR_NOT_TRUSTED.txt";

if(sessionStorage.getItem("baseKey") === null){
    console.log("whats mathname?",window.location.pathname.split("/"));
    try {
        if(window.location.pathname.split("/")[1] != "login"){
            window.location.pathname = "/login/";
        }
    } catch{
        window.location.pathname = "/login/";
    }
}

export async function logIn(crypto,baseKey,username) {
    const res = await fetch("/cmail/account/get",{
        method:'POST',
        body:JSON.stringify({username:username}),
    });
    let vault = await res.bytes();
    const keys = crypto.keySchedule(baseKey);
    vault = crypto.decodeAccountVault(vault,keys.vaultKey);
    if(vault.username != username){
        window.location.href = TRUSTED_ERROR_URL;
    }
    console.log("load session!");
    const sessionStorage = window.sessionStorage;
    sessionStorage.setItem("baseKey",sodium.to_base64(baseKey));
    sessionStorage.setItem("keys",crypto.encodeJSON(keys));
    sessionStorage.setItem("vault",crypto.encodeJSON(vault));
}