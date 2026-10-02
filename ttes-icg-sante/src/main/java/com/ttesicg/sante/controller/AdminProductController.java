package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.ProductRequest;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.service.ProductService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    /**
     * Création d'un produit
     */
    @PostMapping
    public ProductResponse create(
            @Valid @RequestBody ProductRequest request
    ) {
        return productService.create(request);
    }

    /**
     * Modification d'un produit
     */
    @PutMapping("/{id}")
    public ProductResponse update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        return productService.update(id, request);
    }

    /**
     * Liste des produits avec pagination
     * Tri : du plus récent au plus ancien
     */
    @GetMapping
    public List<ProductResponse> findAll() {
        return productService.findAll();
    }

    /**
     * Liste paginée des produits pour l'administration
     */
    @GetMapping("/paginated")
    public Page<ProductResponse> findAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );

        return productService.getProductsPaginated(pageable);
    }

    /**
     * Détail d'un produit
     */
    @GetMapping("/{id}")
    public ProductResponse findById(
            @PathVariable Long id
    ) {
        return productService.findById(id);
    }

    /**
     * Suppression d'un produit
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id
    ) {

        productService.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }

    /**
 * Recherche paginée des produits pour l'administration
 */
@GetMapping("/search")
public Page<ProductResponse> searchProducts(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "8") int size
) {

    Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by(
                    Sort.Direction.DESC,
                    "createdAt"
            )
    );

    return productService.searchProductsPaginated(
            keyword,
            pageable
    );
}
}
