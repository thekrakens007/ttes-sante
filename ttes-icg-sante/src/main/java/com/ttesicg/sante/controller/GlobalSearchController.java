package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.GlobalSearchResponse;
import com.ttesicg.sante.service.GlobalSearchService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;


    // =========================================================
    // RECHERCHE GLOBALE PRODUITS + PACKS
    // =========================================================

    @GetMapping
    public ResponseEntity<GlobalSearchResponse> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {

        return ResponseEntity.ok(
                globalSearchService.search(
                        keyword,
                        page,
                        size
                )
        );
    }
}
