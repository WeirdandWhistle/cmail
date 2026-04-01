package net.whynotjava.cmail;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class Router {

    @GetMapping({"/ooh","/ooh/"})
    public String forwardToOoh(){
        return "forward:/ooh/index.html";
    } 
    @GetMapping({"/login/"})
    public String forwardToLogin(){
        return "forward:/login/index.html";
    }
    @GetMapping("/login")
    public String redirectToLogin(){
        return "redirect:/login/";
    }
}