
package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.BundleRequest;
import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.service.ProductBundleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/bundles")
@RequiredArgsConstructor
public class ProductBundleAdminController {

    private final ProductBundleService bundleService;

    // ADMIN : VOIR TOUS LES PACKS AVEC PAGINATION
    @GetMapping
    public ResponseEntity<Page<BundleResponse>> getAll(
            @PageableDefault(
                    size = 8,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {

        return ResponseEntity.ok(
                bundleService.findAll(pageable)
        );
    }

    // ADMIN : VOIR UN PACK
    @GetMapping("/{id}")
    public ResponseEntity<BundleResponse> getById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                bundleService.findById(id)
        );
    }

    // ADMIN : CREER UN PACK
    @PostMapping
    public ResponseEntity<BundleResponse> create(
            @Valid @RequestBody BundleRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bundleService.create(request));
    }

    // ADMIN : MODIFIER UN PACK
    @PutMapping("/{id}")
    public ResponseEntity<BundleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BundleRequest request
    ) {

        return ResponseEntity.ok(
                bundleService.update(id, request)
        );
    }

    // ADMIN : SUPPRIMER UN PACK
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {

        bundleService.delete(id);

        return ResponseEntity.noContent().build();
    }
}
