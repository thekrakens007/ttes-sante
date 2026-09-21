package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.BundleRequest;
import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.service.ProductBundleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bundles")
@RequiredArgsConstructor
public class ProductBundleController {

    private final ProductBundleService bundleService;


    // =====================================================
    // GET ALL
    // =====================================================

    @GetMapping
    public ResponseEntity<List<BundleResponse>> getAll() {

        return ResponseEntity.ok(
                bundleService.findAll()
        );
    }


    // =====================================================
    // GET ACTIVE
    // =====================================================

    @GetMapping("/active")
    public ResponseEntity<List<BundleResponse>> getActive() {

        return ResponseEntity.ok(
                bundleService.findAllActive()
        );
    }


    // =====================================================
    // GET BY ID
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<BundleResponse> getById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                bundleService.findById(id)
        );
    }


    // =====================================================
    // CREATE
    // =====================================================

    @PostMapping
    public ResponseEntity<BundleResponse> create(
            @Valid @RequestBody BundleRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        bundleService.create(request)
                );
    }


    // =====================================================
    // UPDATE
    // =====================================================

    @PutMapping("/{id}")
    public ResponseEntity<BundleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BundleRequest request
    ) {

        return ResponseEntity.ok(
                bundleService.update(
                        id,
                        request
                )
        );
    }


    // =====================================================
    // DELETE
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {

        bundleService.delete(id);

        return ResponseEntity.noContent().build();
    }
}