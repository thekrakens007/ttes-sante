package com.ttesicg.sante.config;

import com.ttesicg.sante.entity.Role;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.RoleRepository;
import com.ttesicg.sante.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    @Override
    public void run(String... args) {


        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow();


        if (!userRepository.existsByEmail("admin@ttesicg.com")) {


            User admin = User.builder()
                    .firstName("Admin")
                    .lastName("TTES ICG")
                    .email("admin@ttesicg.com")
                    .password(
                            passwordEncoder.encode("Admin@123")
                    )
                    .enabled(true)
                    .build();


            admin.getRoles().add(adminRole);


            userRepository.save(admin);


            System.out.println(
                    "=============================="
            );

            System.out.println(
                    "ADMIN CREE : admin@ttesicg.com"
            );

            System.out.println(
                    "PASSWORD : Admin@123"
            );

            System.out.println(
                    "=============================="
            );
        }
    }
}