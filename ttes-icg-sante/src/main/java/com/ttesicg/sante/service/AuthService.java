package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.*;
import com.ttesicg.sante.entity.Role;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.RoleRepository;
import com.ttesicg.sante.repository.UserRepository;
import com.ttesicg.sante.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final long VERIFICATION_VALIDITY_HOURS = 24;
    private static final long RESET_VALIDITY_MINUTES = 60;

    public AuthResponse login(LoginRequest request) {

        // Si le compte est désactivé (email non vérifié), Spring Security lève
        // une DisabledException ici, avant même d'atteindre la ligne suivante.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRoles().stream().map(r -> "ROLE_" + r.getName()).toList()
        );

        return new AuthResponse(token);
    }

    public MessageResponse register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Un utilisateur existe déjà avec cet email");
        }

        Role clientRole = roleRepository.findByName("CLIENT")
                .orElseThrow(() -> new RuntimeException("Le rôle CLIENT n'existe pas"));

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .enabled(false)                 // bloqué tant que l'email n'est pas vérifié
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(VERIFICATION_VALIDITY_HOURS))
                .roles(Set.of(clientRole))
                .build();

        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), verificationToken);

        // Plus de connexion automatique : l'utilisateur doit d'abord vérifier son email
        return new MessageResponse("Inscription réussie. Vérifiez votre boîte mail pour activer votre compte.");
    }

    public MessageResponse verifyEmail(String token) {

        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Token de vérification invalide"));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Le lien de vérification a expiré");
        }

        user.setEmailVerified(true);
        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return new MessageResponse("Email vérifié avec succès. Vous pouvez maintenant vous connecter.");
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Aucun compte associé à cet email"));

        String resetToken = UUID.randomUUID().toString();
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(RESET_VALIDITY_MINUTES));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);

        return new MessageResponse("Un email de réinitialisation a été envoyé.");
    }

    public MessageResponse resetPassword(ResetPasswordRequest request) {

        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Token de réinitialisation invalide"));

        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Le lien de réinitialisation a expiré");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        return new MessageResponse("Mot de passe réinitialisé avec succès.");
    }
}