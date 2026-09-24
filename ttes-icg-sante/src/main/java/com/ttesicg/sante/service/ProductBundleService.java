package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.BundleImageRequest;
import com.ttesicg.sante.dto.BundleImageResponse;
import com.ttesicg.sante.dto.BundleItemRequest;
import com.ttesicg.sante.dto.BundleItemResponse;
import com.ttesicg.sante.dto.BundleRequest;
import com.ttesicg.sante.dto.BundleResponse;
import com.ttesicg.sante.entity.BundleImage;
import com.ttesicg.sante.entity.BundleItem;
import com.ttesicg.sante.entity.Inventory;
import com.ttesicg.sante.entity.Product;
import com.ttesicg.sante.entity.ProductBundle;
import com.ttesicg.sante.repository.BundleImageRepository;
import com.ttesicg.sante.repository.BundleItemRepository;
import com.ttesicg.sante.repository.InventoryRepository;
import com.ttesicg.sante.repository.ProductBundleRepository;
import com.ttesicg.sante.repository.ProductRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductBundleService {

    private final ProductBundleRepository bundleRepository;

    private final BundleItemRepository bundleItemRepository;

    private final BundleImageRepository bundleImageRepository;

    private final ProductRepository productRepository;

    private final InventoryRepository inventoryRepository;


    // =========================================================
    // GET TOUS LES PACKS
    // =========================================================

    @Transactional
    public List<BundleResponse> findAll() {

        return bundleRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::map)
                .toList();
    }


    // =========================================================
    // GET PACKS ACTIFS
    // =========================================================

    @Transactional
    public List<BundleResponse> findAllActive() {

        return bundleRepository
                .findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::map)
                .toList();
    }


    // =========================================================
    // GET UN PACK
    // =========================================================

    @Transactional
    public BundleResponse findById(Long id) {

        ProductBundle bundle =
                bundleRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pack introuvable"
                                )
                        );

        return map(bundle);
    }


    // =========================================================
    // GET UN PACK ACTIF
    // =========================================================

    @Transactional
    public BundleResponse findActiveById(Long id) {

        ProductBundle bundle =
                bundleRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pack introuvable"
                                )
                        );

        /*
         * Un client ne doit pas pouvoir consulter
         * un pack désactivé.
         */
        if (!Boolean.TRUE.equals(bundle.getActive())) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Pack introuvable"
            );
        }

        return map(bundle);
    }


    // =========================================================
    // CREER UN PACK
    // =========================================================

    @Transactional
    public BundleResponse create(BundleRequest request) {

        validateItems(request);

        ProductBundle bundle =
                ProductBundle.builder()
                        .name(request.name())
                        .description(request.description())
                        .price(request.price())
                        .active(
                                request.active() == null
                                        || request.active()
                        )
                        .build();

        ProductBundle savedBundle =
                bundleRepository.save(bundle);


        /*
         * Enregistrer les produits du pack.
         */
        saveItems(
                savedBundle,
                request.items()
        );


        /*
         * Enregistrer les images du pack.
         */
        saveImages(
                savedBundle,
                request.images()
        );


        /*
         * Retourner le pack complet avec
         * son stock calculé.
         */
        return map(savedBundle);
    }


    // =========================================================
    // MODIFIER UN PACK
    // =========================================================

    @Transactional
    public BundleResponse update(Long id, BundleRequest request) {

        validateItems(request);

        ProductBundle bundle =
                bundleRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pack introuvable"
                                )
                        );

        bundle.setName(request.name());
        bundle.setDescription(request.description());
        bundle.setPrice(request.price());

        if (request.active() != null) {
            bundle.setActive(request.active());
        }

        /*
         * Supprimer les anciens éléments du pack.
         */
        bundleItemRepository.deleteByBundleId(bundle.getId());
        bundleImageRepository.deleteByBundleId(bundle.getId());

        /*
         * Forcer Hibernate à exécuter immédiatement les DELETE
         * avant de recréer les éléments.
         */
        bundleItemRepository.flush();
        bundleImageRepository.flush();

        /*
         * Recréer les éléments avec les nouvelles données.
         */
        saveItems(bundle, request.items());
        saveImages(bundle, request.images());

        /*
         * Sauvegarder le pack.
         */
        ProductBundle savedBundle =
                bundleRepository.save(bundle);

        return map(savedBundle);
    }


    // =========================================================
    // SUPPRIMER UN PACK
    // =========================================================

    @Transactional
    public void delete(Long id) {

        ProductBundle bundle =
                bundleRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pack introuvable"
                                )
                        );

        bundleRepository.delete(bundle);
    }


    // =========================================================
    // SAUVEGARDER LES PRODUITS DU PACK
    // =========================================================

    private void saveItems(
            ProductBundle bundle,
            List<BundleItemRequest> requests
    ) {

        if (requests == null || requests.isEmpty()) {
            return;
        }


        for (BundleItemRequest request : requests) {

            Product product =
                    productRepository
                            .findById(
                                    request.productId()
                            )
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Produit introuvable : "
                                                    + request.productId()
                                    )
                            );


            BundleItem item =
                    BundleItem.builder()
                            .bundle(bundle)
                            .product(product)
                            .quantity(request.quantity())
                            .build();


            bundleItemRepository.save(item);
        }
    }


    // =========================================================
    // SAUVEGARDER LES IMAGES
    // =========================================================

    private void saveImages(
            ProductBundle bundle,
            List<BundleImageRequest> requests
    ) {

        if (requests == null || requests.isEmpty()) {
            return;
        }


        boolean mainAlreadyDefined = false;


        for (int i = 0; i < requests.size(); i++) {

            BundleImageRequest request =
                    requests.get(i);


            boolean main =
                    request.main();


            /*
             * Une seule image peut être principale.
             *
             * Si plusieurs images sont envoyées
             * avec main=true, seule la première
             * sera conservée comme principale.
             */
            if (main && mainAlreadyDefined) {

                main = false;
            }


            if (main) {

                mainAlreadyDefined = true;
            }


            int displayOrder =
                    request.displayOrder() != null
                            ? request.displayOrder()
                            : i;


            BundleImage image =
                    BundleImage.builder()
                            .bundle(bundle)
                            .imageUrl(
                                    request.imageUrl()
                            )
                            .main(main)
                            .displayOrder(
                                    displayOrder
                            )
                            .build();


            bundleImageRepository.save(image);
        }
    }


    // =========================================================
    // VALIDATION DES PRODUITS
    // =========================================================

    private void validateItems(
            BundleRequest request
    ) {

        if (request.items() == null
                || request.items().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Un pack doit contenir au moins un produit"
            );
        }


        /*
         * Vérifier qu'un même produit
         * n'apparaît pas plusieurs fois.
         */
        long distinctProducts =
                request.items()
                        .stream()
                        .map(BundleItemRequest::productId)
                        .distinct()
                        .count();


        if (distinctProducts
                != request.items().size()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Un même produit ne peut apparaître "
                            + "qu'une seule fois dans un pack"
            );
        }
    }


    // =========================================================
    // CALCUL DU STOCK DU PACK
    // =========================================================

    private int calculateStock(
            ProductBundle bundle
    ) {

        List<BundleItem> items =
                bundleItemRepository
                        .findByBundleId(
                                bundle.getId()
                        );


        if (items == null || items.isEmpty()) {

            return 0;
        }


        /*
         * On commence avec la valeur maximale.
         *
         * Ensuite :
         *
         * stockPack =
         * min(
         *      stockProduit1 / quantité1,
         *      stockProduit2 / quantité2,
         *      ...
         * )
         */
        int stockPack =
                Integer.MAX_VALUE;


        for (BundleItem item : items) {

            Product product =
                    item.getProduct();


            Inventory inventory =
                    inventoryRepository
                            .findByProductId(
                                    product.getId()
                            )
                            .orElse(null);


            int productStock =
                    inventory != null
                            ? inventory.getQuantity()
                            : 0;


            int quantityRequired =
                    item.getQuantity();


            int possiblePacks =
                    productStock / quantityRequired;


            stockPack =
                    Math.min(
                            stockPack,
                            possiblePacks
                    );
        }


        return stockPack == Integer.MAX_VALUE
                ? 0
                : stockPack;
    }


    // =========================================================
    // ENTITY -> RESPONSE
    // =========================================================

    private BundleResponse map(
            ProductBundle bundle
    ) {

        // -----------------------------------------------------
        // PRODUITS DU PACK
        // -----------------------------------------------------

        List<BundleItemResponse> items =
                bundleItemRepository
                        .findByBundleId(
                                bundle.getId()
                        )
                        .stream()
                        .map(item -> {

                            Product product =
                                    item.getProduct();


                            Inventory inventory =
                                    inventoryRepository
                                            .findByProductId(
                                                    product.getId()
                                            )
                                            .orElse(null);


                            Integer availableStock =
                                    inventory != null
                                            ? inventory.getQuantity()
                                            : 0;


                            return new BundleItemResponse(
                                    item.getId(),
                                    product.getId(),
                                    product.getName(),
                                    product.getSku(),
                                    item.getQuantity(),
                                    product.getPrice(),
                                    availableStock
                            );

                        })
                        .toList();


        // -----------------------------------------------------
        // IMAGES DU PACK
        // -----------------------------------------------------

        List<BundleImageResponse> images =
                bundleImageRepository
                        .findByBundleIdOrderByDisplayOrderAsc(
                                bundle.getId()
                        )
                        .stream()
                        .map(image ->
                                new BundleImageResponse(
                                        image.getId(),
                                        image.getImageUrl(),
                                        Boolean.TRUE.equals(
                                                image.getMain()
                                        ),
                                        image.getDisplayOrder()
                                )
                        )
                        .toList();


        // -----------------------------------------------------
        // STOCK DU PACK
        // -----------------------------------------------------

        int stock =
                calculateStock(bundle);


        // -----------------------------------------------------
        // RESPONSE
        // -----------------------------------------------------

        return new BundleResponse(
                bundle.getId(),
                bundle.getName(),
                bundle.getDescription(),
                bundle.getPrice(),
                bundle.getActive(),
                stock,
                items,
                images,
                bundle.getCreatedAt(),
                bundle.getUpdatedAt()
        );
    }
}