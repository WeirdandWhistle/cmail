package net.whynotjava.cmail.cmail;

import java.io.*;
import java.sql.*;
import java.util.Base64;

import org.apache.logging.log4j.message.*;
import org.springframework.http.*;
import org.springframework.util.*;

import jakarta.servlet.http.*;
import net.whynotjava.cmail.*;
import net.whynotjava.cmail.util.Util;
import static net.whynotjava.cmail.Constants.*;


public class Messages {

    private Database dbService;

    public Messages(Database dbService){
        this.dbService = dbService;
    }

    public void initService(Connection conn) throws SQLException{
        // keys are in ED25519 besides of course the publicKey in the payload
        conn.createStatement().executeUpdate(
            "CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, timestamp INT, recipientUsername TEXT, recipientPublicKey VARBINARY, payload VARBINARY);"
        );
    }

    public ResponseEntity<?> send(HttpServletRequest req) throws IOException{
        

        if(req.getContentLength() > MAX_MESSAGE_SIZE){
            return Util.generateJsonErrorRes("PayloadTooLargeException","Body is too big!",HttpStatus.CONTENT_TOO_LARGE);
        }

        byte body[] = StreamUtils.copyToByteArray(req.getInputStream());

       if(body.length > MAX_MESSAGE_SIZE){
            return Util.generateJsonErrorRes("PayloadTooLargeException","Body is too big!",HttpStatus.CONTENT_TOO_LARGE);
        }

        InputStream is = new ByteArrayInputStream(body);

        byte nouce[] = new byte[NOUCE_LENGTH];
        is.read(nouce);

        byte publicKey[] = new byte[PUBLIC_KEY_LENGTH];
        is.read(publicKey);

        byte recicientPublicKey[] = new byte[PUBLIC_KEY_LENGTH];
        is.read(recicientPublicKey);

        // int messageLength = body.length - NOUCE_LENGTH - 2*PUBLIC_KEY_LENGTH;
        // byte message[] = new byte[messageLength];
        // is.read(message);

        try(Connection conn = dbService.getDB().getConnection()){

            PreparedStatement ps = conn.prepareStatement("SELECT username FROM user WHERE publicKey=? LIMIT 1;");
            ps.setBytes(1, recicientPublicKey);
            ResultSet rs = ps.executeQuery();
            String recipientUsername = rs.getString("username");

            if(recipientUsername == null){
                return Util.generateJsonErrorRes("IllegalArgumentException","user recieving message does NOT exsist",HttpStatus.BAD_REQUEST);
            }

            int currentTime = Util.getCurrentTime();

            ps = conn.prepareStatement(
                "INSERT INTO messages (timestamp INT, recipientUsername TEXT, recipientPublicKey VARBINARY, payload VARBINARY) VALUES (?, ?, ?, ?);"
            );
            ps.setInt(1, currentTime);
            ps.setString(2, recipientUsername);
            ps.setBytes(3, recicientPublicKey);
            ps.setBytes(4, body);

        } catch(SQLException e){
            return Util.generateJsonErrorRes("SQLException",e.getMessage());
        }

        return Util.okRes();
    }
    
    public ResponseEntity<?> get(String publicKeyBase64, String username, String limit, String start, String end){
        byte publicKey[] = null;
        if(publicKeyBase64 != null){
            try {
                publicKey = Base64.getUrlDecoder().decode(publicKeyBase64);
            } catch (IllegalArgumentException e) {
                return Util.generateJsonErrorRes("IllegalArgumentException","publicKey is not valid json!",HttpStatus.BAD_REQUEST);
            }
        }

        try (Connection conn = dbService.getDB().getConnection()){
            PreparedStatement ps
            = conn.prepareStatement("SELECT payload FROM");
            
            
            
            
            // PreparedStatement ps = conn.prepareStatement("SELECT payload FROM messages WHERE recipientPublicKey=?;");
        } catch (SQLException e) {
            return Util.generateJsonErrorRes("SQLException",e.getMessage());
        }

        return null;
    }
}
