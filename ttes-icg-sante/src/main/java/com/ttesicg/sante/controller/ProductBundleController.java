package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.service.ProductBundleService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bundles")
@RequiredArgsConstructor
public class ProductBundleController {

    private final ProductBundleService bundleService;


    // =====================================================
    // CLIENT : CONSULTER LES PACKS ACTIFS
    // =====================================================

    @GetMapping
    public ResponseEntity<List<BundleResponse>> getAll() {

        return ResponseEntity.ok(
                bundleService.findAllActive()
        );
    }


    // =====================================================
    // CLIENT : CONSULTER UN PACK ACTIF
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<BundleResponse> getById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                bundleService.findActiveById(id)
        );
    }
}