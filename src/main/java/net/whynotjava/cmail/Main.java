package net.whynotjava.cmail;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.*;
import java.sql.*;


@RestController
@SpringBootApplication
public class Main {

    public static String DB_URL = "jdbc:sqlite:database.sqlite"; 
    @Autowired
    private Database dbService;
    
    public static void main(String[] args){
        SpringApplication.run(Main.class, args);
    }

}