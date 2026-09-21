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

        ProductBundle bundle = bundleRepository
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
    // CREER UN PACK
    // =========================================================

    @Transactional
    public BundleResponse create(BundleRequest request) {

        validateItems(request);

        ProductBundle bundle = ProductBundle.builder()
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

        saveItems(
                savedBundle,
                request.items()
        );

        saveImages(
                savedBundle,
                request.images()
        );

        return map(savedBundle);
    }


    // =========================================================
    // MODIFIER UN PACK
    // =========================================================

    @Transactional
    public BundleResponse update(
            Long id,
            BundleRequest request
    ) {

        validateItems(request);

        ProductBundle bundle =
                bundleRepository.findById(id)
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
         * On remplace complètement les produits
         * du pack.
         */
        bundleItemRepository.deleteByBundleId(
                bundle.getId()
        );

        /*
         * On remplace également les images.
         */
        bundleImageRepository.deleteByBundleId(
                bundle.getId()
        );

        saveItems(
                bundle,
                request.items()
        );

        saveImages(
                bundle,
                request.images()
        );

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
                bundleRepository.findById(id)
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
                    productRepository.findById(
                            request.productId()
                    ).orElseThrow(() ->
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

            boolean main = request.main();

            /*
             * Une seule image principale.
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
                            .imageUrl(request.imageUrl())
                            .main(main)
                            .displayOrder(displayOrder)
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
                        .findByBundleId(bundle.getId());

        if (items == null || items.isEmpty()) {
            return 0;
        }

        int stockPack = Integer.MAX_VALUE;

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
    // TRANSFORMATION ENTITY -> RESPONSE
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
        // STOCK TOTAL DU PACK
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