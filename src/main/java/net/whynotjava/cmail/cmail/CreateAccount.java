package net.whynotjava.cmail.cmail;

import java.io.*;
import java.nio.charset.Charset;
import java.sql.*;
import java.util.*;

import org.springframework.http.*;
import org.springframework.util.*;

import jakarta.servlet.http.*;
import net.whynotjava.cmail.*;
import net.whynotjava.cmail.util.Util;
import tools.jackson.core.*;
import tools.jackson.databind.*;
import tools.jackson.databind.json.*;

public class CreateAccount {

    private Database dbService;

    public static int NOUCE_LENGTH = 24;
    public static int KEY_LENGTH = 32;
    public static int PUBLIC_KEY_LENGTH = KEY_LENGTH;
    public static int PRIVATE_KEY_LENGTH = KEY_LENGTH;
    public static int MAX_VAULT_SIZE = 500;

    public CreateAccount(Database dbService){
        this.dbService = dbService;
    }
    public static void initService(Connection conn) throws SQLException{
        conn.createStatement().executeUpdate("CREATE TABLE IF NOT EXISTS user(username TEXT, publicKey VARBINARY, vault VARBINARY);");
    }

    public ResponseEntity<?> parseAndRegisterAccount(HttpServletRequest req) throws IOException{
        byte vault[];

        try{
            vault = StreamUtils.copyToByteArray(req.getInputStream());
        } catch(OutOfMemoryError e){
            return new ResponseEntity<>(Util.generateJsonError("OutOfMemory", e.getMessage()),HttpStatus.CONTENT_TOO_LARGE);
        }
        if (vault.length > MAX_VAULT_SIZE) {
            return new ResponseEntity<>(Util.generateJsonError("Vault is too big"),HttpStatus.CONTENT_TOO_LARGE);
        }



        InputStream inputStream = new ByteArrayInputStream(vault);
        DataInputStream is = new DataInputStream(inputStream);

        byte nouce[] = new byte[NOUCE_LENGTH];
        is.read(nouce);

        byte publicKey[] = new byte[PUBLIC_KEY_LENGTH];
        is.read(publicKey);

        int usernameLength = is.readUnsignedShort();

        byte usernameBytes[] = new byte[usernameLength];
        is.read(usernameBytes);
        String username = Util.bytesToChars(usernameBytes);

        int cipherTextLength = is.readUnsignedShort();

        byte cipherText[] = new byte[cipherTextLength];
        is.read(cipherText);

        int vaultLength = NOUCE_LENGTH+PUBLIC_KEY_LENGTH+2+usernameLength+2+cipherTextLength;
        // byte[] vault = new byte[vaultLength];
        

        // System.out.println(Util.bytesToChars(username) + " is making an account with the publick key (in hex)'"+Util.bytesToHex(publicKey)+"'! we're happy for them!");

        try (Connection conn = dbService.getDB().getConnection()){
            initService(conn);

            PreparedStatement ps = conn.prepareStatement("INSERT INTO user (username, publicKey, vault) VALUES (? ,?, ?);");
            ps.setString(1, username);
            ps.setBytes(2, publicKey);
            ps.setBytes(3, vault);

            System.out.println("vaultLength="+vault.length);

            ps.executeUpdate();

            return new ResponseEntity<>("{\"ok\":true}",HttpStatus.OK);
        } catch(SQLException e){
            e.printStackTrace();
            return new ResponseEntity<>(Util.generateJsonError("SQLException",e.getMessage()),HttpStatus.INTERNAL_SERVER_ERROR);
        }      
        // return new ResponseEntity<>("{\"ok\":false,\"error\":\"unknown\"}",HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public ResponseEntity<?> getAccountVault(HttpServletRequest req) throws IOException{
        String body = StreamUtils.copyToString(req.getInputStream(), Charset.defaultCharset());

        ObjectMapper om = new ObjectMapper();
        JsonNode json = om.readTree(body);

        JsonNode usernameNode = json.get("username");
        JsonNode publicKeyBase64Node = json.get("publicKey");

        try(Connection conn = dbService.getDB().getConnection()){
            ResultSet rs;
            if(publicKeyBase64Node != null){
                byte publicKey[] = Base64.getDecoder().decode(publicKeyBase64Node.asString());

                PreparedStatement ps = conn.prepareStatement("SELECT vault FROM user WHERE publicKey=? LIMIT 1;");
                ps.setBytes(1, publicKey);

                rs = ps.executeQuery();
            } else if (usernameNode != null) {
                String username = usernameNode.asString();

                PreparedStatement ps = conn.prepareStatement("SELECT vault FROM user WHERE username=? LIMIT 1;");
                ps.setString(1, username);

                rs = ps.executeQuery();
            } else {
                return new ResponseEntity<>(Util.generateJsonError("Both publicKey and username can be null"),HttpStatus.BAD_REQUEST);
            }
            byte vault[] = rs.getBytes(1);
            return new ResponseEntity<>(vault,HttpStatus.OK);
        } catch (SQLException e) {
            return new ResponseEntity<>(Util.generateJsonError("SQLException",e.getMessage()),HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
}