package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.UserProfileResponse;
import com.ttesicg.sante.dto.UserProfileUpdateRequest;
import com.ttesicg.sante.entity.Role;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Utilisateur introuvable")
                );

        return mapToResponse(user);
    }
    public UserProfileResponse getProfileByEmail(String email) { User user = userRepository.findByEmail(email) .orElseThrow(() -> new RuntimeException("Utilisateur introuvable") ); return UserProfileResponse.builder() .id(user.getId()) .firstName(user.getFirstName()) .lastName(user.getLastName()) .email(user.getEmail()) .phone(user.getPhone()) .enabled(user.getEnabled()) .roles( user.getRoles() .stream() .map(role -> role.getName()) .toList() ) .createdAt(user.getCreatedAt()) .updatedAt(user.getUpdatedAt()) .build(); }
    @Transactional
    public UserProfileResponse updateProfile(
            String email,
            UserProfileUpdateRequest request
    ) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Utilisateur introuvable")
                );

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());

        return mapToResponse(userRepository.save(user));
    }

    private UserProfileResponse mapToResponse(User user) {

        List<String> roles = user.getRoles()
                .stream()
                .map(Role::getName)
                .toList();

        return UserProfileResponse.builder()
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