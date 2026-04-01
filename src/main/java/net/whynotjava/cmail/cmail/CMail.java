package net.whynotjava.cmail.cmail;

import net.whynotjava.cmail.*;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.*;

import java.io.IOException;
import java.sql.*;

import jakarta.servlet.http.*;

@RestController
@RequestMapping("/cmail")
public class CMail{

    @Autowired
    private Database dbService;

    private CreateAccount accountCreator;

    public CMail(){
        this.accountCreator = new CreateAccount(dbService);
    }

    @RequestMapping({"","/"})
    public String base(){
        return "OK";
    }
    @PostMapping("/account/create")
    public String createAccount(HttpServletRequest req) throws IOException{
        return accountCreator.parseAndRegisterAccount(req);
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