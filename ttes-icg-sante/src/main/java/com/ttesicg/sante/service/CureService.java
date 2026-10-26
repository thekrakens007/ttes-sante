package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.CureRequest;
import com.ttesicg.sante.dto.CureResponse;
import com.ttesicg.sante.entity.Cure;
import com.ttesicg.sante.entity.CureItem;
import com.ttesicg.sante.entity.Product;
import com.ttesicg.sante.repository.CureRepository;
import com.ttesicg.sante.repository.ProductRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class CureService {

    private final CureRepository cureRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CureResponse> findPublicCures() {
        return cureRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CureResponse findPublicCure(Long id) {
        Cure cure = cureRepository.findWithItemsById(id)
                .filter(Cure::isActive)
                .orElseThrow(() ->
                        new EntityNotFoundException("Cure introuvable")
                );

        return toResponse(cure);
    }

    @Transactional(readOnly = true)
    public List<CureResponse> findAllForAdmin() {
        return cureRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CureResponse findForAdmin(Long id) {
        return toResponse(getCure(id));
    }

    public CureResponse create(CureRequest request) {
        Cure cure = new Cure();
        applyRequest(cure, request);
        return toResponse(cureRepository.save(cure));
    }

    public CureResponse update(Long id, CureRequest request) {
        Cure cure = getCure(id);
        applyRequest(cure, request);
        return toResponse(cureRepository.save(cure));
    }

    public void delete(Long id) {
        Cure cure = getCure(id);
        cureRepository.delete(cure);
    }

    private Cure getCure(Long id) {
        return cureRepository.findWithItemsById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Cure introuvable")
                );
    }


    // ============================================================
    // PRIX ET STOCK (utilisés par le panier et les commandes)
    // ============================================================

    /**
     * Prix total d'une cure :
     * somme de (prix du produit × quantité) pour chaque produit.
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateTotalPrice(Cure cure) {
        return cure.getItems().stream()
                .map(item -> {
                    BigDecimal unitPrice = Objects.requireNonNull(
                            item.getProduct().getPrice(),
                            "Le prix du produit ne peut pas être nul"
                    );

                    return unitPrice.multiply(
                            BigDecimal.valueOf(item.getQuantity())
                    );
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Nombre de cures réalisables avec le stock actuel.
     *
     * Exemple :
     *
     * Produit A : 10 en stock, 2 par cure -> 5
     * Produit B : 7  en stock, 1 par cure -> 7
     *
     * Stock de la cure = 5
     */
    @Transactional(readOnly = true)
    public int calculateAvailableStock(Cure cure) {

        if (cure.getItems() == null || cure.getItems().isEmpty()) {
            return 0;
        }

        int stock = Integer.MAX_VALUE;

        for (CureItem item : cure.getItems()) {

            Product product = item.getProduct();

            int productStock = 0;

            if (product.getInventory() != null
                    && product.getInventory().getQuantity() != null) {
                productStock = product.getInventory().getQuantity();
            }

            int required = item.getQuantity();

            if (required <= 0) {
                continue;
            }

            stock = Math.min(stock, productStock / required);
        }
        int availableStock = stock == Integer.MAX_VALUE ? 0 : stock;

        System.out.println(
                "Stock calculé pour la cure "
                        + cure.getId()
                        + " : "
                        + availableStock
        );

        return availableStock;
    }


    private void applyRequest(Cure cure, CureRequest request) {
        cure.setName(request.name().trim());
        cure.setDescription(request.description());
        cure.setImageUrl(request.imageUrl());
        cure.setActive(Boolean.TRUE.equals(request.active()));

        List<Long> ids = request.items().stream()
                .map(CureRequest.CureItemRequest::productId)
                .toList();

        if (ids.stream().distinct().count() != ids.size()) {
            throw new IllegalArgumentException(
                    "Un produit ne peut apparaître qu'une seule fois dans une cure."
            );
        }

        // Indexer les éléments existants par identifiant de produit.
        var existingItems = cure.getItems().stream()
                .collect(java.util.stream.Collectors.toMap(
                        item -> item.getProduct().getId(),
                        item -> item
                ));

        // Identifier les produits encore présents dans la requête.
        var requestedIds = new java.util.HashSet<>(ids);

        // Supprimer uniquement les éléments qui ne sont plus demandés.
        cure.getItems().removeIf(
                item -> !requestedIds.contains(item.getProduct().getId())
        );

        // Mettre à jour les éléments existants ou créer les nouveaux.
        for (CureRequest.CureItemRequest itemRequest : request.items()) {
            Long productId = itemRequest.productId();

            CureItem existingItem = existingItems.get(productId);

            if (existingItem != null) {
                // Le produit existe déjà : modifier sa quantité.
                existingItem.setQuantity(itemRequest.quantity());
            } else {
                // Nouveau produit : créer une association.
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Produit introuvable : " + productId
                        ));

                CureItem newItem = new CureItem();
                newItem.setProduct(product);
                newItem.setQuantity(itemRequest.quantity());
                cure.addItem(newItem);
            }
        }
    }

    private CureResponse toResponse(Cure cure) {
        List<CureResponse.CureProductResponse> items =
                cure.getItems().stream()
                        .map(item -> {
                            Product product = item.getProduct();

                            BigDecimal unitPrice = Objects.requireNonNull(
                                    product.getPrice(),
                                    "Le prix du produit ne peut pas être nul"
                            );

                            BigDecimal subtotal = unitPrice.multiply(
                                    BigDecimal.valueOf(item.getQuantity())
                            );

                            // Product ne possède pas de getImageUrl().
                            // Ses images sont accessibles via getImages().
                            String productImageUrl = product.getImages()
                                    .stream()
                                    .filter(image ->
                                            Boolean.TRUE.equals(image.getMain())
                                    )
                                    .findFirst()
                                    .map(image -> image.getImageUrl())
                                    .orElseGet(() ->
                                            product.getImages()
                                                    .stream()
                                                    .findFirst()
                                                    .map(image -> image.getImageUrl())
                                                    .orElse(null)
                                    );

                            return new CureResponse.CureProductResponse(
                                    product.getId(),
                                    product.getName(),
                                    productImageUrl,
                                    item.getQuantity(),
                                    unitPrice,
                                    subtotal
                            );
                        })
                        .toList();

        BigDecimal total = items.stream()
                .map(CureResponse.CureProductResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CureResponse(
                cure.getId(),
                cure.getName(),
                cure.getDescription(),
                cure.getImageUrl(),
                cure.isActive(),
                total,
                items,
                calculateAvailableStock(cure)
        );
    }
}