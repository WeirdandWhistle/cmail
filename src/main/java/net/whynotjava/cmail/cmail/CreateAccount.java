package net.whynotjava.cmail.cmail;

import java.io.*;

import jakarta.servlet.http.*;
import net.whynotjava.cmail.*;
import net.whynotjava.cmail.util.Util;

public class CreateAccount {

    private Database dbService;

    public static int NOUCE_LENGTH = 24;
    public static int KEY_LENGTH = 32;
    public static int PUBLIC_KEY_LENGTH = KEY_LENGTH;
    public static int PRIVATE_KEY_LENGTH = KEY_LENGTH;

    public CreateAccount(Database dbService){
        this.dbService = dbService;
    }

    public String parseAndRegisterAccount(HttpServletRequest req) throws IOException{

        InputStream inputStream = req.getInputStream();
        DataInputStream is = new DataInputStream(inputStream);

        byte nouce[] = new byte[NOUCE_LENGTH];
        is.read(nouce);

        byte publicKey[] = new byte[PUBLIC_KEY_LENGTH];
        is.read(publicKey);

        int usernameLength = is.readUnsignedShort();

        byte username[] = new byte[usernameLength];
        is.read(username);

        int cipherTextLength = is.readUnsignedShort();

        byte cipherText[] = new byte[cipherTextLength];
        is.read(cipherText);

        System.out.println(Util.bytesToChars(username) + " is making an account with the publick key (in hex)'"+Util.bytesToHex(publicKey)+"'! we're happy for them!");
        return "OK";
    }
    
}