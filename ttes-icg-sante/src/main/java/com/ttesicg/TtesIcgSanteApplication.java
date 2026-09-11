package com.ttesicg;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class TtesIcgSanteApplication {

    public static void main(String[] args) {
        SpringApplication.run(TtesIcgSanteApplication.class, args);
    }

    @Bean
    CommandLineRunner testEnv(Environment env) {
        return args -> {
            String pwd = env.getProperty("MAIL_PASSWORD");
            System.out.println("========== TEST .ENV ==========");
            System.out.println("MAIL_PASSWORD = [" + pwd + "]");
            System.out.println("Longueur = " + pwd.length());
            System.out.println("Codes = " + java.util.Arrays.toString(pwd.chars().toArray()));
            System.out.println("================================");
        };
    }
}
