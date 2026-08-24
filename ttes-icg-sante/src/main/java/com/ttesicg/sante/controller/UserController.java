package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.UserProfileResponse;
import com.ttesicg.sante.dto.UserProfileUpdateRequest;
import com.ttesicg.sante.service.UserService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    /**
     * Profil de l'utilisateur connecté
     */
    @GetMapping("/profile")
    public UserProfileResponse getProfile(
            Authentication authentication
    ) {

        return userService.getProfile(
                authentication.getName()
        );
    }


    /**
     * Modifier le profil
     */
    @PutMapping("/profile")
    public UserProfileResponse updateProfile(
            Authentication authentication,
            @Valid @RequestBody UserProfileUpdateRequest request
    ) {

        return userService.updateProfile(
                authentication.getName(),
                request
        );
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(
            Authentication authentication
    ) {
        return userService.getProfileByEmail(
                authentication.getName()
        );
    }
}