package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.BundleItemResponse;
import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.dto.GlobalSearchResponse;
import com.ttesicg.sante.dto.ProductResponse;

import lombok.RequiredArgsConstructor;

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


        // =====================================================
        // RECHERCHE VIDE
        // =====================================================

        if (normalizedKeyword.isBlank()) {

            return new GlobalSearchResponse(
                    List.of(),
                    List.of()
            );
        }


        // =====================================================
        // RÉSULTATS
        // =====================================================

        /*
         * LinkedHashMap permet :
         *
         * - d'éviter les doublons
         * - de conserver l'ordre d'apparition
         */
        Map<Long, ProductResponse> products =
                new LinkedHashMap<>();


        Map<Long, BundleResponse> bundles =
                new LinkedHashMap<>();


        // =====================================================
        // 1. RÉCUPÉRER TOUS LES PACKS ACTIFS
        // =====================================================

        List<BundleResponse> allBundles =
                productBundleService.findAllActive();


        // =====================================================
        // 2. RECHERCHE DIRECTE DES PRODUITS
        // =====================================================

        /*
         * IMPORTANT :
         *
         * On ne limite pas cette recherche à 8 produits.
         *
         * Pourquoi ?
         *
         * Si le produit correspondant est le 25e résultat,
         * il faut quand même pouvoir retrouver les packs
         * qui contiennent ce produit.
         */
        Pageable pageable =
                Pageable.unpaged(
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );


        productService
                .searchAvailableProductsPaginated(
                        normalizedKeyword,
                        pageable
                )
                .getContent()
                .forEach(product -> {

                    if (
                            product != null
                                    &&
                            product.getId() != null
                    ) {

                        products.put(
                                product.getId(),
                                product
                        );
                    }
                });


        // =====================================================
        // 3. PARCOURIR LES PACKS
        // =====================================================

        for (BundleResponse bundle : allBundles) {

            if (bundle == null || bundle.id() == null) {
                continue;
            }


            // -------------------------------------------------
            // LE NOM OU LA DESCRIPTION DU PACK CORRESPOND
            // -------------------------------------------------

            boolean bundleMatches =
                    matchesBundle(
                            bundle,
                            normalizedKeyword
                    );


            if (bundleMatches) {

                /*
                 * Le pack lui-même apparaît.
                 */
                bundles.put(
                        bundle.id(),
                        bundle
                );


                /*
                 * TOUS les produits du pack apparaissent.
                 */
                addProductsFromBundle(
                        bundle,
                        products
                );
            }


            // -------------------------------------------------
            // RECHERCHE DANS LES PRODUITS DU PACK
            // -------------------------------------------------

            if (bundle.items() == null) {
                continue;
            }


            for (BundleItemResponse item : bundle.items()) {

                if (item == null) {
                    continue;
                }


                /*
                 * Le produit contenu dans le pack correspond
                 * à la recherche.
                 */
                if (
                        matchesBundleProduct(
                                item,
                                normalizedKeyword
                        )
                ) {

                    /*
                     * Le pack contenant ce produit apparaît.
                     */
                    bundles.put(
                            bundle.id(),
                            bundle
                    );


                    /*
                     * Le produit correspondant apparaît également.
                     */
                    addProductFromBundleItem(
                            item,
                            products
                    );
                }
            }
        }


        // =====================================================
        // 4. POUR CHAQUE PRODUIT TROUVÉ,
        //    RETROUVER LES PACKS QUI LE CONTIENNENT
        // =====================================================

        /*
         * Exemple :
         *
         * Recherche : "Stemcell"
         *
         * ProductService trouve :
         *
         *     Double Stemcell
         *
         * Ensuite on cherche tous les packs qui contiennent
         * Double Stemcell.
         */
        for (ProductResponse product : products.values()) {

            if (
                    product == null
                            ||
                    product.getId() == null
            ) {
                continue;
            }


            for (BundleResponse bundle : allBundles) {

                if (
                        bundle == null
                                ||
                        bundle.items() == null
                ) {
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

                    bundles.put(
                            bundle.id(),
                            bundle
                    );
                }
            }
        }


        // =====================================================
        // 5. RETOUR FINAL
        // =====================================================

        return new GlobalSearchResponse(
                new ArrayList<>(products.values()),
                new ArrayList<>(bundles.values())
        );
    }


    // =========================================================
    // VÉRIFIER SI LE PACK CORRESPOND
    // =========================================================

    private boolean matchesBundle(
            BundleResponse bundle,
            String keyword
    ) {

        if (bundle == null) {
            return false;
        }


        // -----------------------------------------------------
        // NOM DU PACK
        // -----------------------------------------------------

        if (
                bundle.name() != null
                        &&
                containsIgnoreCase(
                        bundle.name(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // DESCRIPTION DU PACK
        // -----------------------------------------------------

        if (
                bundle.description() != null
                        &&
                containsIgnoreCase(
                        bundle.description(),
                        keyword
                )
        ) {

            return true;
        }


        return false;
    }


    // =========================================================
    // VÉRIFIER SI UN PRODUIT DU PACK CORRESPOND
    // =========================================================

    private boolean matchesBundleProduct(
            BundleItemResponse item,
            String keyword
    ) {

        if (item == null) {
            return false;
        }


        // -----------------------------------------------------
        // NOM
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.productName(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // SKU
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.sku(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // DESCRIPTION
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.description(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // MARQUE
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.brand(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // PRINCIPE ACTIF
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.activeIngredient(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // DOSAGE
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.dosage(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // FORME
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.form(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // INGRÉDIENTS
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.ingredients(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // ENTREPRISE
        // -----------------------------------------------------

        if (
                containsIgnoreCase(
                        item.companyName(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // CATÉGORIES
        // -----------------------------------------------------

        if (
                item.categories() != null
                        &&
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


        // -----------------------------------------------------
        // DOMAINES THÉRAPEUTIQUES
        // -----------------------------------------------------

        if (
                item.therapeuticAreas() != null
                        &&
                item.therapeuticAreas()
                        .stream()
                        .filter(Objects::nonNull)
                        .anyMatch(
                                area ->
                                        containsIgnoreCase(
                                                area,
                                                keyword
                                        )
                        )
        ) {

            return true;
        }


        return false;
    }


    // =========================================================
    // AJOUTER TOUS LES PRODUITS D'UN PACK
    // =========================================================

    private void addProductsFromBundle(
            BundleResponse bundle,
            Map<Long, ProductResponse> products
    ) {

        if (
                bundle == null
                        ||
                bundle.items() == null
        ) {
            return;
        }


        for (BundleItemResponse item : bundle.items()) {

            addProductFromBundleItem(
                    item,
                    products
            );
        }
    }


    // =========================================================
    // AJOUTER UN PRODUIT D'UN PACK
    // =========================================================

    private void addProductFromBundleItem(
            BundleItemResponse item,
            Map<Long, ProductResponse> products
    ) {

        if (
                item == null
                        ||
                item.productId() == null
        ) {
            return;
        }


        /*
         * Si le produit est déjà présent, inutile de refaire
         * une requête en base.
         */
        if (
                products.containsKey(
                        item.productId()
                )
        ) {
            return;
        }


        try {

            ProductResponse product =
                    productService.findById(
                            item.productId()
                    );


            if (
                    product != null
                            &&
                    product.getId() != null
            ) {

                products.put(
                        product.getId(),
                        product
                );
            }

        } catch (Exception exception) {

            /*
             * Le produit peut avoir été supprimé ou être
             * devenu indisponible.
             *
             * On ne bloque pas toute la recherche globale
             * pour un seul produit.
             */
        }
    }


    // =========================================================
    // CONTAINS IGNORE CASE
    // =========================================================

    private boolean containsIgnoreCase(
            String value,
            String keyword
    ) {

        if (
                value == null
                        ||
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
