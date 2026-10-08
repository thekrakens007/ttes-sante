package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.dto.GlobalSearchResponse;
import com.ttesicg.sante.dto.ProductResponse;

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


    // =========================================================
    // RECHERCHE GLOBALE
    // =========================================================

    public GlobalSearchResponse search(
            String keyword,
            int page,
            int size
    ) {

        String normalizedKeyword =
                keyword == null
                        ? ""
                        : keyword.trim().toLowerCase(Locale.ROOT);


        // -----------------------------------------------------
        // RECHERCHE VIDE
        // -----------------------------------------------------

        if (normalizedKeyword.isBlank()) {

            return new GlobalSearchResponse(
                    List.of(),
                    List.of()
            );
        }


        // -----------------------------------------------------
        // PACKS ACTIFS
        // -----------------------------------------------------

        List<BundleResponse> allBundles =
                productBundleService.findAllActive();


        /*
         * LinkedHashMap permet :
         *
         * - d'éviter les doublons
         * - de conserver l'ordre
         */
        Map<Long, BundleResponse> matchingBundles =
                new LinkedHashMap<>();


        /*
         * Produits supplémentaires trouvés
         * à travers les packs.
         */
        Map<Long, ProductResponse> additionalProducts =
                new LinkedHashMap<>();


        // =====================================================
        // 1. RECHERCHE DIRECTE DES PRODUITS
        // =====================================================

        int safePage =
                Math.max(page, 0);

        int safeSize =
                size <= 0
                        ? 8
                        : size;


        Pageable pageable =
                PageRequest.of(
                        safePage,
                        safeSize,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );


        Page<ProductResponse> productPage =
                productService.searchAvailableProductsPaginated(
                        normalizedKeyword,
                        pageable
                );


        /*
         * Produits qui correspondent directement
         * à la recherche.
         */
        Map<Long, ProductResponse> products =
                new LinkedHashMap<>();


        productPage
                .getContent()
                .forEach(product ->
                        products.put(
                                product.getId(),
                                product
                        )
                );


        // =====================================================
        // 2. PARCOURIR LES PACKS
        // =====================================================

        for (BundleResponse bundle : allBundles) {

            boolean bundleMatches =
                    matchesBundle(
                            bundle,
                            normalizedKeyword
                    );


            boolean productInsideMatches =
                    false;


            if (bundle.items() != null) {

                for (var item : bundle.items()) {

                    if (item == null) {
                        continue;
                    }


                    boolean productMatches =
                            matchesBundleProduct(
                                    item,
                                    normalizedKeyword
                            );


                    if (productMatches) {

                        productInsideMatches = true;


                        /*
                         * Le produit qui correspond
                         * doit apparaître.
                         */
                        ProductResponse product =
                                productService.findById(
                                        item.productId()
                                );


                        if (product != null) {

                            products.put(
                                    product.getId(),
                                    product
                            );
                        }
                    }
                }
            }


            // =================================================
            // 3. LE PACK CORRESPOND À LA RECHERCHE
            // =================================================

            if (bundleMatches) {

                matchingBundles.put(
                        bundle.id(),
                        bundle
                );


                /*
                 * Si le nom/description du pack correspond,
                 * TOUS les produits du pack doivent apparaître.
                 */
                if (bundle.items() != null) {

                    for (var item : bundle.items()) {

                        if (item == null) {
                            continue;
                        }


                        ProductResponse product =
                                productService.findById(
                                        item.productId()
                                );


                        if (product != null) {

                            products.put(
                                    product.getId(),
                                    product
                            );
                        }
                    }
                }
            }


            // =================================================
            // 4. UN PRODUIT DU PACK CORRESPOND
            // =================================================

            if (productInsideMatches) {

                matchingBundles.put(
                        bundle.id(),
                        bundle
                );
            }
        }


        // =====================================================
        // 5. SÉCURITÉ : AJOUTER LES PACKS DES PRODUITS
        // =====================================================

        /*
         * Les produits trouvés directement doivent également
         * permettre de retrouver les packs qui les contiennent.
         *
         * Cela couvre par exemple :
         *
         * recherche = SKU
         * recherche = marque
         * recherche = principe actif
         * etc.
         */
        for (ProductResponse product : products.values()) {

            if (product == null || product.getId() == null) {
                continue;
            }


            for (BundleResponse bundle : allBundles) {

                if (bundle.items() == null) {
                    continue;
                }


                boolean containsProduct =
                        bundle.items()
                                .stream()
                                .filter(Objects::nonNull)
                                .anyMatch(item ->
                                        Objects.equals(
                                                item.productId(),
                                                product.getId()
                                        )
                                );


                if (containsProduct) {

                    matchingBundles.put(
                            bundle.id(),
                            bundle
                    );
                }
            }
        }


        // =====================================================
        // 6. RÉSULTAT FINAL
        // =====================================================

        return new GlobalSearchResponse(
                new ArrayList<>(products.values()),
                new ArrayList<>(matchingBundles.values())
        );
    }


    // =========================================================
    // RECHERCHE SUR LE PACK
    // =========================================================

    private boolean matchesBundle(
            BundleResponse bundle,
            String keyword
    ) {

        if (bundle == null) {
            return false;
        }


        // -----------------------------------------------------
        // NOM
        // -----------------------------------------------------

        if (
                bundle.name() != null
                        &&
                bundle.name()
                        .toLowerCase(Locale.ROOT)
                        .contains(keyword)
        ) {

            return true;
        }


        // -----------------------------------------------------
        // DESCRIPTION
        // -----------------------------------------------------

        if (
                bundle.description() != null
                        &&
                bundle.description()
                        .toLowerCase(Locale.ROOT)
                        .contains(keyword)
        ) {

            return true;
        }


        return false;
    }


    // =========================================================
    // RECHERCHE SUR UN PRODUIT DU PACK
    // =========================================================

    private boolean matchesBundleProduct(
            Object itemObject,
            String keyword
    ) {

        /*
         * Cette méthode est volontairement remplacée
         * ci-dessous par une méthode typée.
         */

        return false;
    }
}
