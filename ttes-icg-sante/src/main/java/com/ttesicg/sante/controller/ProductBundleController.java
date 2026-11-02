
package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.service.ProductBundleService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bundles")
@RequiredArgsConstructor
public class ProductBundleController {

    private final ProductBundleService bundleService;

    // CLIENT : CONSULTER LES PACKS ACTIFS AVEC PAGINATION
    @GetMapping
    public ResponseEntity<Page<BundleResponse>> getAll(
            @PageableDefault(
                    size = 8,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {

        return ResponseEntity.ok(
                bundleService.findAllActive(pageable)
        );
    }

    // CLIENT : CONSULTER UN PACK ACTIF
    @GetMapping("/{id}")
    public ResponseEntity<BundleResponse> getById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                bundleService.findActiveById(id)
        );
    }
}
