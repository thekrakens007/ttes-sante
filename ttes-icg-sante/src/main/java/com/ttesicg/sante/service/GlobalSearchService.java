package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.BundleItemResponse;
import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.dto.GlobalSearchResponse;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class GlobalSearchService {

    private final ProductService productService;
    private final ProductBundleService productBundleService;
    private final ProductRepository productRepository;


    // =========================================================
    // RECHERCHE GLOBALE
    // =========================================================

    public GlobalSearchResponse search(
            String keyword,
            int page,
            int size,
            Long categoryId,
            Long companyId,
            Long therapeuticAreaId
    ) {

        if (page < 0) {
            page = 0;
        }

        if (size <= 0) {
            size = 8;
        }

        if (size > 50) {
            size = 50;
        }


        String normalizedKeyword =
                normalize(keyword);


        // =====================================================
        // PAGINATION
        // =====================================================

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );


        // =====================================================
        // PRODUITS
        // =====================================================

        Page<ProductResponse> productPage =
                productService
                        .searchAvailableProductsPaginatedWithFilters(
                                normalizedKeyword,
                                categoryId,
                                companyId,
                                therapeuticAreaId,
                                pageable
                        );


        List<ProductResponse> products =
                productPage.getContent();


        // =====================================================
        // PACKS
        // =====================================================

        /*
         * Pour les packs, on conserve ici la logique existante.
         *
         * Les packs correspondants sont filtrés en mémoire.
         */
        List<BundleResponse> allBundles =
                productBundleService.findAllActive();


        Map<Long, BundleResponse> matchingBundles =
                new LinkedHashMap<>();


        for (BundleResponse bundle : allBundles) {

            if (
                    bundle == null ||
                    bundle.id() == null
            ) {
                continue;
            }


            // -------------------------------------------------
            // NOM / DESCRIPTION DU PACK
            // -------------------------------------------------

            if (
                    matchesBundle(
                            bundle,
                            normalizedKeyword
                    )
            ) {

                matchingBundles.put(
                        bundle.id(),
                        bundle
                );

                continue;
            }


            // -------------------------------------------------
            // PRODUIT DU PACK
            // -------------------------------------------------

            if (bundle.items() == null) {
                continue;
            }


            boolean productMatch =
                    bundle.items()
                            .stream()
                            .filter(Objects::nonNull)
                            .anyMatch(
                                    item ->
                                            matchesBundleProduct(
                                                    item,
                                                    normalizedKeyword
                                            )
                            );


            if (productMatch) {

                matchingBundles.put(
                        bundle.id(),
                        bundle
                );
            }
        }


        List<BundleResponse> bundles =
                new ArrayList<>(
                        matchingBundles.values()
                );


        // =====================================================
        // PAGINATION PACKS
        // =====================================================

        long totalBundles =
                bundles.size();


        int totalBundlePages =
                totalBundles == 0
                        ? 0
                        : (int) Math.ceil(
                                (double) totalBundles / size
                        );


        int bundleFrom =
                Math.min(
                        page * size,
                        bundles.size()
                );


        int bundleTo =
                Math.min(
                        bundleFrom + size,
                        bundles.size()
                );


        List<BundleResponse> paginatedBundles =
                bundles.subList(
                        bundleFrom,
                        bundleTo
                );


        // =====================================================
        // RÉSULTAT
        // =====================================================

        return new GlobalSearchResponse(

                products,

                paginatedBundles,

                page,

                size,

                productPage.getTotalElements(),

                totalBundles,

                productPage.getTotalPages(),

                totalBundlePages
        );
    }


    // =========================================================
    // NORMALISATION
    // =========================================================

    private String normalize(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .trim()
                .toLowerCase(Locale.ROOT);
    }


    // =========================================================
    // PACK
    // =========================================================

    private boolean matchesBundle(
            BundleResponse bundle,
            String keyword
    ) {

        if (bundle == null) {
            return false;
        }


        if (
                containsIgnoreCase(
                        bundle.name(),
                        keyword
                )
        ) {
            return true;
        }


        return containsIgnoreCase(
                bundle.description(),
                keyword
        );
    }


    // =========================================================
    // PRODUIT DU PACK
    // =========================================================

    private boolean matchesBundleProduct(
            BundleItemResponse item,
            String keyword
    ) {

        if (item == null) {
            return false;
        }


        if (
                containsIgnoreCase(
                        item.productName(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.sku(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.description(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.brand(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.activeIngredient(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.dosage(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.form(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.ingredients(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                containsIgnoreCase(
                        item.companyName(),
                        keyword
                )
        ) {
            return true;
        }


        if (
                item.categories() != null &&
                item.categories()
                        .stream()
                        .filter(Objects::nonNull)
                        .anyMatch(
                                category ->
                                        containsIgnoreCase(
                                                category,
                                                keyword
                                        )
                        )
        ) {
            return true;
        }


        return item.therapeuticAreas() != null &&
                item.therapeuticAreas()
                        .stream()
                        .filter(Objects::nonNull)
                        .anyMatch(
                                area ->
                                        containsIgnoreCase(
                                                area,
                                                keyword
                                        )
                        );
    }


    // =========================================================
    // CONTAINS
    // =========================================================

    private boolean containsIgnoreCase(
            String value,
            String keyword
    ) {

        if (
                value == null ||
                keyword == null
        ) {
            return false;
        }


        return value
                .toLowerCase(Locale.ROOT)
                .contains(
                        keyword.toLowerCase(Locale.ROOT)
                );
    }
}
