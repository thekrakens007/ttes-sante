package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CategoryResponse;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.dto.TherapeuticAreaResponse;
import com.ttesicg.sante.service.CategoryService;
import com.ttesicg.sante.service.ProductService;
import com.ttesicg.sante.service.TherapeuticAreaService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final TherapeuticAreaService therapeuticAreaService;


    // =========================================================
    // TOUS LES PRODUITS
    // =========================================================

    @GetMapping
    public List<ProductResponse> getAllProducts() {

        return productService.getAllProducts();
    }


    // =========================================================
    // PRODUITS PAGINÉS
    // RECHERCHE + FILTRES
    // =========================================================

    @GetMapping("/paginated")
    public Page<ProductResponse> getProductsPaginated(

            @RequestParam(
                    defaultValue = "0"
            )
            int page,

            @RequestParam(
                    defaultValue = "8"
            )
            int size,

            @RequestParam(
                    required = false
            )
            String keyword,

            @RequestParam(
                    required = false
            )
            Long categoryId,

            @RequestParam(
                    required = false
            )
            Long companyId,

            @RequestParam(
                    required = false
            )
            Long therapeuticAreaId
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );


        return productService
                .getAvailableProductsPaginated(
                        keyword,
                        categoryId,
                        companyId,
                        therapeuticAreaId,
                        pageable
                );
    }


    // =========================================================
    // RECHERCHE
    // =========================================================

    @GetMapping("/search")
    public Page<ProductResponse> searchProducts(

            @RequestParam String keyword,

            @RequestParam(
                    defaultValue = "0"
            )
            int page,

            @RequestParam(
                    defaultValue = "8"
            )
            int size
    ) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );


        return productService
                .searchAvailableProductsPaginated(
                        keyword,
                        pageable
                );
    }


    // =========================================================
    // CATÉGORIES
    // =========================================================

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {

        return categoryService.findAll();
    }


    // =========================================================
    // DOMAINES THÉRAPEUTIQUES
    // =========================================================

    @GetMapping("/therapeutic-areas")
    public List<TherapeuticAreaResponse> getTherapeuticAreas() {

        return therapeuticAreaService.findAll();
    }


    // =========================================================
    // PRODUIT PAR ID
    // =========================================================

    @GetMapping("/{id}")
    public ProductResponse getProductById(
            @PathVariable Long id
    ) {

        return productService.getProductById(id);
    }


    // =========================================================
    // PRODUITS D'UNE ENTREPRISE
    // =========================================================

    @GetMapping("/company/{companyId}")
    public List<ProductResponse> getProductsByCompany(
            @PathVariable Long companyId
    ) {

        return productService.getProductsByCompany(
                companyId
        );
    }
}
