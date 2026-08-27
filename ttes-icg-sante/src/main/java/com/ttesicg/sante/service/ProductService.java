package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.ProductImageResponse;
import com.ttesicg.sante.dto.ProductRequest;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.entity.*;
import com.ttesicg.sante.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

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


    // =====================================================
    // FIND BY ID
    // =====================================================

    public ProductResponse findById(Long id) {

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


    // =====================================================
    // CREATE
    // =====================================================

    @Transactional
    public ProductResponse create(ProductRequest request) {

        // ================================================
        // ENTREPRISE
        // ================================================

        Company company =
                companyRepository
                        .findById(request.getCompanyId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Entreprise introuvable"
                                )
                        );


        // ================================================
        // PRODUIT
        // ================================================

        Product product =
                Product.builder()

                        .company(company)

                        .name(request.getName())

                        .sku(request.getSku())

                        .description(request.getDescription())

                        .brand(request.getBrand())

                        .activeIngredient(
                                request.getActiveIngredient()
                        )

                        .dosage(request.getDosage())

                        .form(request.getForm())

                        .price(request.getPrice())

                        .requiresPrescription(
                                request.getRequiresPrescription()
                        )

                        .build();


        // ================================================
        // CATEGORIES
        // ================================================

        if (
                request.getCategoryIds() != null
                        &&
                        !request.getCategoryIds().isEmpty()
        ) {

            product.setCategories(
                    categoryRepository
                            .findAllById(
                                    request.getCategoryIds()
                            )
                            .stream()
                            .collect(Collectors.toSet())
            );

        }


        // ================================================
        // DOMAINES THERAPEUTIQUES
        // ================================================

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


        // ================================================
        // SAUVEGARDE PRODUIT
        // ================================================

        productRepository.save(product);


        // ================================================
        // STOCK
        // ================================================

        int stock = request.getStock() != null
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


    // =====================================================
    // UPDATE
    // =====================================================

    @Transactional
    public ProductResponse update(
            Long id,
            ProductRequest request
    ) {

        // ================================================
        // PRODUIT
        // ================================================

        Product product =
                productRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produit introuvable"
                                )
                        );


        // ================================================
        // ENTREPRISE
        // ================================================

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


        // ================================================
        // INFORMATIONS GENERALES
        // ================================================

        product.setName(
                request.getName()
        );

        product.setSku(
                request.getSku()
        );

        product.setDescription(
                request.getDescription()
        );

        product.setBrand(
                request.getBrand()
        );

        product.setActiveIngredient(
                request.getActiveIngredient()
        );

        product.setDosage(
                request.getDosage()
        );

        product.setForm(
                request.getForm()
        );

        product.setPrice(
                request.getPrice()
        );

        product.setRequiresPrescription(
                request.getRequiresPrescription()
        );


        // ================================================
        // CATEGORIES
        // ================================================

        if (request.getCategoryIds() != null) {

            product.getCategories().clear();

            if (!request.getCategoryIds().isEmpty()) {

                product.getCategories().addAll(
                        categoryRepository
                                .findAllById(
                                        request.getCategoryIds()
                                )
                );

            }

        }


        // ================================================
        // DOMAINES THERAPEUTIQUES
        // ================================================

        if (
                request.getTherapeuticAreaIds() != null
        ) {

            product
                    .getTherapeuticAreas()
                    .clear();

            if (
                    !request
                            .getTherapeuticAreaIds()
                            .isEmpty()
            ) {

                product
                        .getTherapeuticAreas()
                        .addAll(
                                therapeuticAreaRepository
                                        .findAllById(
                                                request
                                                        .getTherapeuticAreaIds()
                                        )
                        );

            }

        }


        // ================================================
        // SAUVEGARDE PRODUIT
        // ================================================

        Product saved =
                productRepository.save(product);


        // ================================================
        // STOCK
        // ================================================

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


            inventoryRepository.save(
                    inventory
            );

        }


        return map(saved);
    }


    // =====================================================
    // MAP PRODUCT -> RESPONSE
    // =====================================================

    private ProductResponse map(Product product) {

        // ================================================
        // STOCK
        // ================================================

        Inventory inventory =
                inventoryRepository
                        .findByProductId(
                                product.getId()
                        )
                        .orElse(null);


        Integer stock =
                inventory != null
                        ? inventory.getQuantity()
                        : 0;


        // ================================================
        // COMPANY ID
        // ================================================

        Long companyId =
                product.getCompany() != null
                        ? product.getCompany().getId()
                        : null;


        String companyName =
                product.getCompany() != null
                        ? product.getCompany().getName()
                        : null;


        // ================================================
        // CATEGORY IDS
        // ================================================

        Set<Long> categoryIds =
                product.getCategories()
                        .stream()
                        .map(Category::getId)
                        .collect(Collectors.toSet());


        // ================================================
        // CATEGORY NAMES
        // ================================================

        Set<String> categories =
                product.getCategories()
                        .stream()
                        .map(Category::getName)
                        .collect(Collectors.toSet());


        // ================================================
        // THERAPEUTIC AREA IDS
        // ================================================

        Set<Long> therapeuticAreaIds =
                product.getTherapeuticAreas()
                        .stream()
                        .map(TherapeuticArea::getId)
                        .collect(Collectors.toSet());


        // ================================================
        // THERAPEUTIC AREA NAMES
        // ================================================

        Set<String> therapeuticAreas =
                product.getTherapeuticAreas()
                        .stream()
                        .map(TherapeuticArea::getName)
                        .collect(Collectors.toSet());



        // ================================================
        // RESPONSE
        // ================================================

        return ProductResponse.builder()

                .id(product.getId())

                .name(product.getName())

                .sku(product.getSku())

                .description(product.getDescription())

                .brand(product.getBrand())

                .activeIngredient(
                        product.getActiveIngredient()
                )

                .dosage(
                        product.getDosage()
                )

                .form(
                        product.getForm()
                )

                .price(
                        product.getPrice()
                )

                .requiresPrescription(
                        product.getRequiresPrescription()
                )

                .stock(stock)

                // COMPANY
                .companyId(companyId)

                .companyName(companyName)

                // CATEGORIES
                .categoryIds(categoryIds)

                .categories(categories)

                // THERAPEUTIC AREAS
                .therapeuticAreaIds(
                        therapeuticAreaIds
                )

                .therapeuticAreas(
                        therapeuticAreas
                )

                // IMAGES
                .images(
                        product.getImages()
                                .stream()
                                .map(image ->
                                        ProductImageResponse
                                                .builder()
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


    // =====================================================
    // FIND ALL
    // =====================================================

    public List<ProductResponse> findAll() {

        return productRepository
                .findAll()
                .stream()
                .map(this::map)
                .toList();
    }


    // =====================================================
    // GET ALL PRODUCTS
    // =====================================================

    public List<ProductResponse> getAllProducts() {

        return productRepository
                .findAll()
                .stream()
                .map(this::map)
                .toList();
    }


    // =====================================================
    // GET PRODUCT BY ID
    // =====================================================

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


    // =====================================================
    // SEARCH
    // =====================================================

    public List<ProductResponse> searchProducts(
            String keyword
    ) {

        return productRepository
                .findByNameContainingIgnoreCase(
                        keyword
                )
                .stream()
                .map(this::map)
                .toList();
    }


    // =====================================================
    // PRODUCTS BY COMPANY
    // =====================================================

    public List<ProductResponse> getProductsByCompany(
            Long companyId
    ) {

        return productRepository
                .findByCompanyId(companyId)
                .stream()
                .map(this::map)
                .toList();
    }


    // =====================================================
    // DELETE
    // =====================================================

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


    // =====================================================
    // DELETE PRODUCT
    // =====================================================

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