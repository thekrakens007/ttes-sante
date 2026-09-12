package com.ttesicg.sante.security;

import com.ttesicg.sante.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        var user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Utilisateur non trouvé"
                        )
                );

        // Les comptes Google n'ont pas de mot de passe local.
        // Spring Security exige néanmoins une valeur non nulle.
        String password = user.getPassword();

        if (password == null) {
            password = "{noop}GOOGLE_AUTH_ONLY";
        }

        return org.springframework.security.core.userdetails.User
                .builder()
                .username(user.getEmail())
                .password(password)
                .authorities(
                        user.getRoles()
                                .stream()
                                .map(role -> "ROLE_" + role.getName())
                                .toArray(String[]::new)
                )
                .disabled(!user.getEnabled())
                .build();
    }
}