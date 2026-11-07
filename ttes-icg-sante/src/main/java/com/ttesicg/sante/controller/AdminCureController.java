package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CureRequest;
import com.ttesicg.sante.dto.CureResponse;
import com.ttesicg.sante.service.CureService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/cures")
@RequiredArgsConstructor
public class AdminCureController {

    private final CureService cureService;

    /*
     * ============================================================
     * LISTE PAGINÉE DES CURES (ADMIN)
     * ============================================================
     */

    @GetMapping
    public Page<CureResponse> getAll(
            @PageableDefault(
                    size = 8,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable
    ) {
        return cureService.findAllForAdmin(pageable);
    }

    /*
     * ============================================================
     * DÉTAIL D'UNE CURE
     * ============================================================
     */

    @GetMapping("/{id}")
    public CureResponse getOne(@PathVariable Long id) {
        return cureService.findForAdmin(id);
    }

    /*
     * ============================================================
     * CRÉATION
     * ============================================================
     */

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CureResponse create(
            @Valid @RequestBody CureRequest request
    ) {
        return cureService.create(request);
    }

    /*
     * ============================================================
     * MODIFICATION
     * ============================================================
     */

    @PutMapping("/{id}")
    public CureResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CureRequest request
    ) {
        return cureService.update(id, request);
    }

    /*
     * ============================================================
     * DÉSACTIVATION
     * ============================================================
     */

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        cureService.delete(id);
    }
}