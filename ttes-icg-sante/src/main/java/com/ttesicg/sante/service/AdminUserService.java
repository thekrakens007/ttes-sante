package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.UpdateUserRequest;
import com.ttesicg.sante.dto.UserAdminResponse;
import com.ttesicg.sante.entity.Role;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.RoleRepository;
import com.ttesicg.sante.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    private final RoleRepository roleRepository;


    /**
     * Voir tous les utilisateurs
     */
    @Transactional(readOnly = true)
    public List<UserAdminResponse> findAll() {

        return userRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }


    /**
     * Voir un utilisateur
     */
    @Transactional(readOnly = true)
    public UserAdminResponse findById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Utilisateur introuvable"
                        )
                );

        return map(user);
    }


    /**
     * Modifier un utilisateur
     */
    @Transactional
    public UserAdminResponse update(
            Long id,
            UpdateUserRequest request
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Utilisateur introuvable"
                        )
                );


        /*
         * Vérifier que l'email n'est pas déjà utilisé
         * par un autre utilisateur.
         */
        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {

            throw new RuntimeException(
                    "Cette adresse email est déjà utilisée"
            );
        }


        user.setFirstName(request.getFirstName());

        user.setLastName(request.getLastName());

        user.setEmail(request.getEmail());

        user.setPhone(request.getPhone());


        if (request.getEnabled() != null) {

            user.setEnabled(
                    request.getEnabled()
            );
        }


        /*
         * Modification des rôles
         */
        if (request.getRoleIds() != null) {

            Set<Role> roles =
                    new HashSet<>(
                            roleRepository.findAllById(
                                    request.getRoleIds()
                            )
                    );

            if (roles.size() != request.getRoleIds().size()) {

                throw new RuntimeException(
                        "Un ou plusieurs rôles sont introuvables"
                );
            }

            user.setRoles(roles);
        }


        User saved =
                userRepository.save(user);


        return map(saved);
    }


    /**
     * Activer / désactiver un utilisateur
     */
    @Transactional
    public UserAdminResponse updateStatus(
            Long id,
            Boolean enabled
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Utilisateur introuvable"
                        )
                );

        user.setEnabled(enabled);

        User saved =
                userRepository.save(user);

        return map(saved);
    }


    /**
     * Supprimer un utilisateur
     */
    @Transactional
    public void delete(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Utilisateur introuvable"
                        )
                );

        userRepository.delete(user);
    }


    /**
     * Conversion Entity -> DTO
     */
    private UserAdminResponse map(User user) {

        Set<String> roles =
                user.getRoles()
                        .stream()
                        .map(Role::getName)
                        .collect(java.util.stream.Collectors.toSet());


        return UserAdminResponse.builder()

                .id(user.getId())

                .firstName(user.getFirstName())

                .lastName(user.getLastName())

                .email(user.getEmail())

                .phone(user.getPhone())

                .enabled(user.getEnabled())

                .roles(roles)

                .createdAt(user.getCreatedAt())

                .updatedAt(user.getUpdatedAt())

                .build();
    }
}