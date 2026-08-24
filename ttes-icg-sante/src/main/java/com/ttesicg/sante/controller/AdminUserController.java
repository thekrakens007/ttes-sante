package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.UpdateUserRequest;
import com.ttesicg.sante.dto.UserAdminResponse;
import com.ttesicg.sante.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;


    /**
     * Voir tous les utilisateurs
     */
    @GetMapping
    public List<UserAdminResponse> findAll() {

        return adminUserService.findAll();
    }


    /**
     * Voir un utilisateur
     */
    @GetMapping("/{id}")
    public UserAdminResponse findById(
            @PathVariable Long id
    ) {

        return adminUserService.findById(id);
    }


    /**
     * Modifier un utilisateur
     */
    @PutMapping("/{id}")
    public UserAdminResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {

        return adminUserService.update(
                id,
                request
        );
    }


    /**
     * Activer / désactiver
     */
    @PatchMapping("/{id}/status")
    public UserAdminResponse updateStatus(
            @PathVariable Long id,
            @RequestParam Boolean enabled
    ) {

        return adminUserService.updateStatus(
                id,
                enabled
        );
    }


    /**
     * Supprimer
     */
    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {

        adminUserService.delete(id);
    }
}