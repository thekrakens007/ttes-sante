package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.*;
import com.ttesicg.sante.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;


    @PostMapping("/login")
    public AuthResponse login(
            @RequestBody LoginRequest request
    ){

        return authService.login(request);
    }


    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request
    ){

        return authService.register(request);
    }
}