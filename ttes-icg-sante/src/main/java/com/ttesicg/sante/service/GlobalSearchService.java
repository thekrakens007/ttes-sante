package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.BundleItemResponse;
import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.dto.GlobalSearchResponse;
import com.ttesicg.sante.dto.ProductResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
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
                normalizeText(keyword);


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

        Map<Long, ProductResponse> products =
                new LinkedHashMap<>();

        Map<Long, BundleResponse> bundles =
                new LinkedHashMap<>();


        // =====================================================
        // 1. TOUS LES PACKS ACTIFS
        // =====================================================

        List<BundleResponse> allBundles =
                productBundleService.findAllActive();


        // =====================================================
        // 2. RECHERCHE DIRECTE DES PRODUITS
        // =====================================================

        /*
         * On récupère tous les produits correspondants.
         *
         * Cela permet ensuite de retrouver tous les packs
         * contenant ces produits.
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
                        keyword.trim(),
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
        // 3. RECHERCHE DANS LES PACKS
        // =====================================================

        for (BundleResponse bundle : allBundles) {

            if (
                    bundle == null
                            ||
                    bundle.id() == null
            ) {
                continue;
            }


            // -------------------------------------------------
            // NOM / DESCRIPTION DU PACK
            // -------------------------------------------------

            boolean bundleMatches =
                    matchesBundle(
                            bundle,
                            normalizedKeyword
                    );


            if (bundleMatches) {

                /*
                 * Le pack correspond.
                 */
                bundles.put(
                        bundle.id(),
                        bundle
                );


                /*
                 * Tous les produits du pack sont également
                 * retournés.
                 */
                addProductsFromBundle(
                        bundle,
                        products
                );
            }


            // -------------------------------------------------
            // PRODUITS DU PACK
            // -------------------------------------------------

            if (bundle.items() == null) {
                continue;
            }


            for (BundleItemResponse item : bundle.items()) {

                if (item == null) {
                    continue;
                }


                if (
                        matchesBundleProduct(
                                item,
                                normalizedKeyword
                        )
                ) {

                    /*
                     * Le pack contenant le produit apparaît.
                     */
                    bundles.put(
                            bundle.id(),
                            bundle
                    );


                    /*
                     * Le produit apparaît également.
                     */
                    addProductFromBundleItem(
                            item,
                            products
                    );
                }
            }
        }


        // =====================================================
        // 4. PRODUIT → PACKS
        // =====================================================

        /*
         * Exemple :
         *
         * Recherche : "Sanofi"
         *
         * Les produits de Sanofi sont trouvés.
         *
         * On cherche ensuite tous les packs contenant
         * ces produits.
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
        // 5. RETOUR
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
        // NOM
        // -----------------------------------------------------

        if (
                containsIgnoreCaseAndAccent(
                        bundle.name(),
                        keyword
                )
        ) {

            return true;
        }


        // -----------------------------------------------------
        // DESCRIPTION
        // -----------------------------------------------------

        if (
                containsIgnoreCaseAndAccent(
                        bundle.description(),
                        keyword
                )
        ) {

            return true;
        }


        return false;
    }


    // =========================================================
    // VÉRIFIER UN PRODUIT CONTENU DANS UN PACK
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                containsIgnoreCaseAndAccent(
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
                                        containsIgnoreCaseAndAccent(
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
                                        containsIgnoreCaseAndAccent(
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
    // AJOUTER TOUS LES PRODUITS DU PACK
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
    // AJOUTER UN PRODUIT
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
             * On ignore un produit supprimé ou indisponible
             * sans bloquer toute la recherche.
             */
        }
    }


    // =========================================================
    // NORMALISATION DU TEXTE
    // =========================================================

    /**
     * Transforme par exemple :
     *
     * Médicaments -> medicaments
     * MÉDICAMENTS -> medicaments
     * médicament  -> medicament
     * Équipement  -> equipement
     */
    private String normalizeText(String value) {

        if (value == null) {
            return "";
        }


        return Normalizer
                .normalize(
                        value.trim(),
                        Normalizer.Form.NFD
                )
                .replaceAll(
                        "\\p{M}",
                        ""
                )
                .toLowerCase(
                        Locale.ROOT
                );
    }


    // =========================================================
    // RECHERCHE PARTIELLE + SANS ACCENT
    // =========================================================

    private boolean containsIgnoreCaseAndAccent(
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


        String normalizedValue =
                normalizeText(value);


        String normalizedKeyword =
                normalizeText(keyword);


        return normalizedValue.contains(
                normalizedKeyword
        );
    }
}
