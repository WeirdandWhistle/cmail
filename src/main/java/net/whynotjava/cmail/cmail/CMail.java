package net.whynotjava.cmail.cmail;

import net.whynotjava.cmail.*;
import net.whynotjava.cmail.util.Util;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.*;

import java.io.IOException;
import java.sql.*;
import java.util.Arrays;
import java.util.Base64;

import org.apache.catalina.connector.*;
import org.springframework.http.*;

import jakarta.servlet.http.*;

@RestController
@RequestMapping("/cmail")
public class CMail{

    @Autowired
    private Database dbService;

    private final CreateAccount accountCreator;

    @Autowired
    public CMail(Database dbService){
        this.accountCreator = new CreateAccount(dbService);
    }

    @RequestMapping({"","/"})
    public String base(){
        return "OK";
    }
    @PostMapping("/account/create")
    public ResponseEntity<?> createAccount(HttpServletRequest req){
        try {
            return accountCreator.parseAndRegisterAccount(req);
        } catch (IOException e) {
            return new ResponseEntity<>(Util.generateJsonError("IOException",e.getMessage()),HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @PostMapping("/account/get")
    public ResponseEntity<?> getAccount(HttpServletRequest req){
        try {
            return accountCreator.getAccountVault(req);
        } catch (IOException e) {
            return new ResponseEntity<>(Util.generateJsonError("IOException",e.getMessage()),HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * This api call (`HTTP GET /cmail/account/info`) you must include at least one of the query paramaters.
     * @param publicKeyBase64URL `?publicKey=base64URLSafe` the public key to look up the username of
     * @param username `?username=someonesUsername` the username to look up the public key of
     * @return publicKey if sent username. username if sent publicKey. JSON if sent both (`{ok:true, publicKeyMatch:false, usernameMatch:true}`)
     */
    @GetMapping("/account/info")
    public ResponseEntity<String> accountInfo(@RequestParam(required=false,value="publicKey") String publicKeyBase64URL, @RequestParam(required=false) String username){
        if(Util.isValidBase64URL(publicKeyBase64URL)){
            return Util.generateJsonErrorRes("IllegalArgumentException", "publicKey Base64 is invalid", HttpStatus.BAD_REQUEST);
        }

        try(Connection conn = dbService.getDB().getConnection()){
        if(username != null && publicKeyBase64URL == null){
            PreparedStatement ps = conn.prepareStatement("SELECT publicKey FROM user WHERE username=? LIMIT 1;");
            ps.setString(1, username);
            byte publicKey[] = ps.executeQuery().getBytes("publicKey");
            if(publicKey == null){
                return new ResponseEntity<>("{\"ok\":true,\"publicKey\":null}",HttpStatus.OK);
            }
            String publicKeyBase64 = Base64.getEncoder().encodeToString(publicKey);
            return new ResponseEntity<>("{\"ok\":true,\"publicKey\":\""+publicKeyBase64+"\"}",HttpStatus.OK);
        } else if(publicKeyBase64URL != null && username == null){
            byte publicKey[] = Base64.getUrlDecoder().decode(publicKeyBase64URL);
            PreparedStatement ps = conn.prepareStatement("SELECT username FROM user WHERE publicKey=? LIMIT 1;");
            ps.setBytes(1, publicKey);
            String usernameAttached = ps.executeQuery().getString("username");
            return new ResponseEntity<>("{\"ok\":true,\"username\":\""+usernameAttached+"\"}",HttpStatus.OK);
        } else if(publicKeyBase64URL != null && username != null){
            // no promises that this works! lol
            PreparedStatement ps = conn.prepareStatement("SELECT publicKey FROM user WHERE username=? LIMIT 1;");
            ps.setString(1, username);
            byte publicKey[] = ps.executeQuery().getBytes("publicKey");

            byte publicKeyAttached[] = Base64.getUrlDecoder().decode(publicKeyBase64URL);
            ps = conn.prepareStatement("SELECT username FROM user WHERE publicKey=? LIMIT 1;");
            ps.setBytes(1, publicKeyAttached);
            String usernameAttached = ps.executeQuery().getString("username");

            boolean publicKeyMatch = Arrays.equals(publicKey, publicKeyAttached);
            boolean usernameMatch = username.equals(usernameAttached);

            return new ResponseEntity<>("{\"ok\":true,\"publicKeyMatch\":"+publicKeyMatch+",\"usernameMatch\":"+usernameMatch+"}",HttpStatus.OK);
        } else {
            return Util.generateJsonErrorRes("IllegalArgumentException","Paramerters can be null!",HttpStatus.BAD_REQUEST);
        }
    } catch(SQLException e){
        return Util.generateJsonErrorRes("SQLException",e.getMessage());
    } catch(IllegalArgumentException e){
        return Util.generateJsonErrorRes("IllegalArgumentException",e.getMessage()+" - probaly base64 wrong",HttpStatus.BAD_REQUEST);
    }
    }
}