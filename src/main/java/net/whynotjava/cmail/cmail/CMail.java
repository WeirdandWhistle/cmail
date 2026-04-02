package net.whynotjava.cmail.cmail;

import net.whynotjava.cmail.*;
import net.whynotjava.cmail.util.Util;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.*;

import java.io.IOException;
import java.sql.*;

import org.apache.catalina.connector.*;
import org.springframework.http.*;

import jakarta.servlet.http.*;

@RestController
@RequestMapping("/cmail")
public class CMail{

    @Autowired
    private Database dbService;

    private CreateAccount accountCreator;

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

    // @RequestMapping("/account")
    // public String 

    @RequestMapping("test")
    public String test(){
        String out = "DB STUFF: \n";
        try(Connection conn = dbService.getDB().getConnection()){
            conn.createStatement().executeUpdate("CREATE TABLE IF NOT EXISTS test (val TEXT);");
            conn.createStatement().executeUpdate("INSERT INTO test (val) VALUES ('bob!')");
            ResultSet rs = conn.createStatement().executeQuery("SELECT * FROM test");
            while(rs.next()){
                out += rs.getString("val") + "<br>";
            }   
        } catch(Exception e){
            e.printStackTrace();
        }
        return out;
    }
}