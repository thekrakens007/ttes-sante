package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.AuthResponse;
import com.ttesicg.sante.dto.LoginRequest;
import com.ttesicg.sante.dto.RegisterRequest;
import com.ttesicg.sante.entity.Role;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.RoleRepository;
import com.ttesicg.sante.repository.UserRepository;
import com.ttesicg.sante.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;

    private final JwtService jwtService;

    private final UserRepository userRepository;

    private final RoleRepository roleRepository;

    private final PasswordEncoder passwordEncoder;


    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(

                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Utilisateur non trouvé")
                );

        String token =
                jwtService.generateToken(
                        user.getId(),
                        user.getEmail(),
                        user.getRoles()
                                .stream()
                                .map(role -> "ROLE_" + role.getName())
                                .toList()
                );


        return new AuthResponse(token);
    }


    public AuthResponse register(RegisterRequest request) {

        // Vérifier si l'email existe déjà
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {

            throw new RuntimeException(
                    "Un utilisateur existe déjà avec cet email"
            );
        }


        // Récupérer le rôle CLIENT
        Role clientRole =
                roleRepository.findByName("CLIENT")
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Le rôle CLIENT n'existe pas"
                                )
                        );


        // Créer l'utilisateur
        User user =
                User.builder()

                        .firstName(request.getFirstName())

                        .lastName(request.getLastName())

                        .email(request.getEmail())

                        .password(
                                passwordEncoder.encode(
                                        request.getPassword()
                                )
                        )

                        .phone(request.getPhone())

                        .enabled(true)

                        .roles(
                                Set.of(clientRole)
                        )

                        .build();


        User savedUser =
                userRepository.save(user);


        // Générer directement le JWT
        String token =
                jwtService.generateToken(
                        user.getId(),
                        user.getEmail(),
                        user.getRoles()
                                .stream()
                                .map(role -> "ROLE_" + role.getName())
                                .toList()
                );


        return new AuthResponse(token);
    }
}