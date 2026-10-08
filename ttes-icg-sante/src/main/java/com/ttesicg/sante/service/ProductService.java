package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.ProductImageResponse;
import com.ttesicg.sante.dto.ProductRequest;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.entity.*;
import com.ttesicg.sante.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CompanyRepository companyRepository;
    private final CategoryRepository categoryRepository;
    private final TherapeuticAreaRepository therapeuticAreaRepository;
    private final InventoryRepository inventoryRepository;


    // =========================================================
    // FIND BY ID
    // =========================================================

    public ProductResponse findById(Long id) {

        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Produit introuvable")
                );

        return map(product);
    }


    // =========================================================
    // PRODUITS DISPONIBLES PAGINÉS
    // =========================================================

    public Page<ProductResponse> getAvailableProductsPaginated(
            Pageable pageable
    ) {

        return productRepository
                .findAvailableProducts(pageable)
                .map(this::map);
    }

    public Page<ProductResponse> searchAvailableProductsPaginatedWithFilters(
        String keyword,
        Long categoryId,
        Long companyId,
        Long therapeuticAreaId,
        Pageable pageable
) {

    Page<Product> products =
            productRepository.findAvailableProductsWithFilters(
                    keyword == null ? "" : keyword,
                    categoryId,
                    companyId,
                    therapeuticAreaId,
                    pageable
            );

    return products.map(
            this::mapToProductResponse
    );
}

    // =========================================================
    // PRODUITS PAGINÉS
    // =========================================================

    public Page<ProductResponse> getProductsPaginated(
            Pageable pageable
    ) {

        return productRepository
                .findAll(pageable)
                .map(this::map);
    }


    // =========================================================
    // PRODUITS DISPONIBLES
    // RECHERCHE + FILTRES + PAGINATION
    // =========================================================

    public Page<ProductResponse> getAvailableProductsPaginated(
            String keyword,
            Long categoryId,
            Long companyId,
            Long therapeuticAreaId,
            Pageable pageable
    ) {

        String normalizedKeyword =
                keyword != null
                        ? keyword.trim()
                        : "";

        return productRepository
                .findAvailableProductsWithFilters(
                        normalizedKeyword,
                        categoryId,
                        companyId,
                        therapeuticAreaId,
                        pageable
                )
                .map(this::map);
    }


    // =========================================================
    // CREATE
    // =========================================================

    @Transactional
    public ProductResponse create(ProductRequest request) {

        Company company =
                companyRepository
                        .findById(request.getCompanyId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Entreprise introuvable"
                                )
                        );

        Product product =
                Product.builder()
                        .company(company)
                        .name(request.getName())
                        .sku(request.getSku())
                        .description(request.getDescription())
                        .brand(request.getBrand())
                        .activeIngredient(request.getActiveIngredient())
                        .dosage(request.getDosage())
                        .form(request.getForm())
                        .price(request.getPrice())
                        .purchasePrice(request.getPurchasePrice())
                        .ingredients(request.getIngredients())
                        .requiresPrescription(
                                request.getRequiresPrescription()
                        )
                        .build();


        // =====================================================
        // CATÉGORIES
        // =====================================================

        if (
                request.getCategoryIds() != null
                        &&
                !request.getCategoryIds().isEmpty()
        ) {

            product.setCategories(
                    categoryRepository
                            .findAllById(request.getCategoryIds())
                            .stream()
                            .collect(Collectors.toSet())
            );
        }


        // =====================================================
        // DOMAINES THÉRAPEUTIQUES
        // =====================================================

        if (
                request.getTherapeuticAreaIds() != null
                        &&
                !request.getTherapeuticAreaIds().isEmpty()
        ) {

            product.setTherapeuticAreas(
                    therapeuticAreaRepository
                            .findAllById(
                                    request.getTherapeuticAreaIds()
                            )
                            .stream()
                            .collect(Collectors.toSet())
            );
        }


        // =====================================================
        // SAUVEGARDE
        // =====================================================

        productRepository.save(product);


        // =====================================================
        // STOCK
        // =====================================================

        int stock =
                request.getStock() != null
                        ? request.getStock()
                        : 0;

        Inventory inventory =
                Inventory.builder()
                        .product(product)
                        .quantity(stock)
                        .minimumQuantity(0)
                        .build();

        inventoryRepository.save(inventory);

        return map(product);
    }


    // =========================================================
    // UPDATE
    // =========================================================

    @Transactional
    public ProductResponse update(
            Long id,
            ProductRequest request
    ) {

        Product product =
                productRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produit introuvable"
                                )
                        );


        // =====================================================
        // ENTREPRISE
        // =====================================================

        if (request.getCompanyId() != null) {

            Company company =
                    companyRepository
                            .findById(
                                    request.getCompanyId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Entreprise introuvable"
                                    )
                            );

            product.setCompany(company);
        }


        // =====================================================
        // INFORMATIONS
        // =====================================================

        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setDescription(request.getDescription());
        product.setBrand(request.getBrand());
        product.setActiveIngredient(
                request.getActiveIngredient()
        );
        product.setDosage(request.getDosage());
        product.setForm(request.getForm());
        product.setPrice(request.getPrice());
        product.setPurchasePrice(
                request.getPurchasePrice()
        );
        product.setIngredients(
                request.getIngredients()
        );
        product.setRequiresPrescription(
                request.getRequiresPrescription()
        );


        // =====================================================
        // CATÉGORIES
        // =====================================================

        if (request.getCategoryIds() != null) {

            product.getCategories().clear();

            if (!request.getCategoryIds().isEmpty()) {

                product.getCategories().addAll(
                        categoryRepository.findAllById(
                                request.getCategoryIds()
                        )
                );
            }
        }


        // =====================================================
        // DOMAINES THÉRAPEUTIQUES
        // =====================================================

        if (request.getTherapeuticAreaIds() != null) {

            product.getTherapeuticAreas().clear();

            if (
                    !request
                            .getTherapeuticAreaIds()
                            .isEmpty()
            ) {

                product.getTherapeuticAreas().addAll(
                        therapeuticAreaRepository.findAllById(
                                request.getTherapeuticAreaIds()
                        )
                );
            }
        }


        Product saved =
                productRepository.save(product);


        // =====================================================
        // STOCK
        // =====================================================

        if (request.getStock() != null) {

            Inventory inventory =
                    inventoryRepository
                            .findByProductId(id)
                            .orElseGet(() ->
                                    Inventory.builder()
                                            .product(saved)
                                            .quantity(0)
                                            .minimumQuantity(0)
                                            .build()
                            );

            inventory.setQuantity(
                    request.getStock()
            );

            inventoryRepository.save(inventory);
        }

        return map(saved);
    }


    // =========================================================
    // MAP PRODUCT -> RESPONSE
    // =========================================================

    private ProductResponse map(Product product) {

        Inventory inventory =
                inventoryRepository
                        .findByProductId(product.getId())
                        .orElse(null);

        Integer stock =
                inventory != null
                        ? inventory.getQuantity()
                        : 0;


        Long companyId =
                product.getCompany() != null
                        ? product.getCompany().getId()
                        : null;


        String companyName =
                product.getCompany() != null
                        ? product.getCompany().getName()
                        : null;


        Set<Long> categoryIds =
                product.getCategories()
                        .stream()
                        .map(Category::getId)
                        .collect(Collectors.toSet());


        Set<String> categories =
                product.getCategories()
                        .stream()
                        .map(Category::getName)
                        .collect(Collectors.toSet());


        Set<Long> therapeuticAreaIds =
                product.getTherapeuticAreas()
                        .stream()
                        .map(TherapeuticArea::getId)
                        .collect(Collectors.toSet());


        Set<String> therapeuticAreas =
                product.getTherapeuticAreas()
                        .stream()
                        .map(TherapeuticArea::getName)
                        .collect(Collectors.toSet());


        return ProductResponse.builder()

                .id(product.getId())

                .name(product.getName())

                .sku(product.getSku())

                .description(product.getDescription())

                .brand(product.getBrand())

                .activeIngredient(
                        product.getActiveIngredient()
                )

                .dosage(product.getDosage())

                .form(product.getForm())

                .price(product.getPrice())

                .purchasePrice(
                        product.getPurchasePrice()
                )

                .ingredients(
                        product.getIngredients()
                )

                .requiresPrescription(
                        product.getRequiresPrescription()
                )

                .stock(stock)

                .companyId(companyId)

                .companyName(companyName)

                .categoryIds(categoryIds)

                .categories(categories)

                .therapeuticAreaIds(
                        therapeuticAreaIds
                )

                .therapeuticAreas(
                        therapeuticAreas
                )

                .images(
                        product.getImages()
                                .stream()
                                .map(image ->
                                        ProductImageResponse.builder()
                                                .id(image.getId())
                                                .imageUrl(
                                                        image.getImageUrl()
                                                )
                                                .main(
                                                        image.getMain()
                                                )
                                                .displayOrder(
                                                        image.getDisplayOrder()
                                                )
                                                .build()
                                )
                                .toList()
                )

                .build();
    }


    // =========================================================
    // FIND ALL
    // =========================================================

    public List<ProductResponse> findAll() {

        return productRepository
                .findAll()
                .stream()
                .map(this::map)
                .toList();
    }


    public List<ProductResponse> getAllProducts() {

        return productRepository
                .findAll()
                .stream()
                .map(this::map)
                .toList();
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    public ProductResponse getProductById(Long id) {

        Product product =
                productRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produit introuvable"
                                )
                        );

        return map(product);
    }


    // =========================================================
    // SEARCH SIMPLE
    // =========================================================

    public List<ProductResponse> searchProducts(
            String keyword
    ) {

        return productRepository
                .findByNameContainingIgnoreCase(keyword)
                .stream()
                .map(this::map)
                .toList();
    }


    // =========================================================
    // PRODUITS PAR ENTREPRISE
    // =========================================================

    public List<ProductResponse> getProductsByCompany(
            Long companyId
    ) {

        return productRepository
                .findByCompanyId(companyId)
                .stream()
                .map(this::map)
                .toList();
    }


    // =========================================================
    // SEARCH CLIENT PAGINATED
    // =========================================================

    public Page<ProductResponse> searchAvailableProductsPaginated(
            String keyword,
            Pageable pageable
    ) {

        return productRepository
                .searchAvailableProducts(
                        keyword.trim(),
                        pageable
                )
                .map(this::map);
    }


    // =========================================================
    // SEARCH ADMIN PAGINATED
    // =========================================================

    public Page<ProductResponse> searchProductsPaginated(
            String keyword,
            Pageable pageable
    ) {

        return productRepository
                .searchProducts(
                        keyword.trim(),
                        pageable
                )
                .map(this::map);
    }


    // =========================================================
    // DELETE
    // =========================================================

    @Transactional
    public void delete(Long id) {

        Product product =
                productRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produit introuvable"
                                )
                        );

        productRepository.delete(product);
    }


    @Transactional
    public void deleteProduct(Long productId) {

        Product product =
                productRepository
                        .findById(productId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Produit introuvable"
                                )
                        );

        productRepository.delete(product);
    }
}
