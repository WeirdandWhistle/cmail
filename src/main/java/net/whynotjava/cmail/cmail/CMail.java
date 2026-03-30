package net.whynotjava.cmail;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cmail")
public class CMail{

    @RequestMapping("/cmail")
    public String base(){
        return "cmail base";
    }
    @GetMapping("")
    public String home(){
        return "nothing - cmail.java";
    }
    @GetMapping("hello")
    public String hello(){
        return "hello - cmail.java";
    }
}