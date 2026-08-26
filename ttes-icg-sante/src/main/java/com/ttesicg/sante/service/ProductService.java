package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.ProductImageResponse;
import com.ttesicg.sante.dto.ProductRequest;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.entity.*;
import com.ttesicg.sante.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;


@Service
@RequiredArgsConstructor
public class ProductService {


    private final ProductRepository productRepository;

    private final CompanyRepository companyRepository;

    private final CategoryRepository categoryRepository;

    private final TherapeuticAreaRepository therapeuticAreaRepository;

    private final InventoryRepository inventoryRepository;

    public ProductResponse findById(Long id) {

        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Produit introuvable"));

        return map(product);
    }


    @Transactional
    public void deleteProduct(Long productId) {

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Produit introuvable"
                        )
                );

        productRepository.delete(product);
    }

    public ProductResponse create(ProductRequest request){


        Company company =
                companyRepository.findById(request.getCompanyId())
                        .orElseThrow(
                                () -> new RuntimeException(
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

                        .requiresPrescription(
                                request.getRequiresPrescription()
                        )

                        .build();



        if(request.getCategoryIds()!=null){

            product.setCategories(
                    categoryRepository
                            .findAllById(request.getCategoryIds())
                            .stream()
                            .collect(
                                    java.util.stream.Collectors.toSet()
                            )
            );
        }



        if(request.getTherapeuticAreaIds()!=null){

            product.setTherapeuticAreas(
                    therapeuticAreaRepository
                            .findAllById(
                                    request.getTherapeuticAreaIds()
                            )
                            .stream()
                            .collect(
                                    java.util.stream.Collectors.toSet()
                            )
            );
        }



        productRepository.save(product);



        Inventory inventory =
                Inventory.builder()

                        .product(product)

                        .quantity(0)

                        .minimumQuantity(0)

                        .build();



        inventoryRepository.save(inventory);



        return map(product);
    }


    @Transactional
    public ProductResponse update(Long id, ProductRequest request){


        Product product =
                productRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Produit introuvable"
                                )
                        );



        // Modification de l'entreprise
        if(request.getCompanyId()!=null){

            Company company =
                    companyRepository.findById(
                                    request.getCompanyId()
                            )
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "Entreprise introuvable"
                                    )
                            );

            product.setCompany(company);
        }



        // Informations générales

        product.setName(request.getName());

        product.setSku(request.getSku());

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



        // Mise à jour des catégories

        if(request.getCategoryIds()!=null){

            product.getCategories().clear();

            product.getCategories()
                    .addAll(
                            categoryRepository
                                    .findAllById(
                                            request.getCategoryIds()
                                    )
                    );
        }



        // Mise à jour des domaines thérapeutiques

        if(request.getTherapeuticAreaIds()!=null){

            product.getTherapeuticAreas().clear();

            product.getTherapeuticAreas()
                    .addAll(
                            therapeuticAreaRepository
                                    .findAllById(
                                            request.getTherapeuticAreaIds()
                                    )
                    );
        }



        Product saved =
                productRepository.save(product);



        return map(saved);
    }


    public List<ProductResponse> findAll(){

        return productRepository.findAll()
                .stream()
                .map(this::map)
                .toList();

    }




    private ProductResponse map(Product product) {

        Inventory inventory = inventoryRepository
                .findByProductId(product.getId())
                .orElse(null);

        Integer stock = inventory != null
                ? inventory.getQuantity()
                : 0;

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

                .requiresPrescription(
                        product.getRequiresPrescription()
                )

                .stock(stock)

                .companyName(
                        product.getCompany().getName()
                )

                .categories(
                        product.getCategories()
                                .stream()
                                .map(Category::getName)
                                .collect(
                                        java.util.stream.Collectors.toSet()
                                )
                )

                .therapeuticAreas(
                        product.getTherapeuticAreas()
                                .stream()
                                .map(TherapeuticArea::getName)
                                .collect(
                                        java.util.stream.Collectors.toSet()
                                )
                )

                .images(
                        product.getImages()
                                .stream()
                                .map(image ->
                                        ProductImageResponse.builder()
                                                .id(image.getId())
                                                .imageUrl(image.getImageUrl())
                                                .main(image.getMain())
                                                .displayOrder(image.getDisplayOrder())
                                                .build()
                                )
                                .toList()
                )

                .build();
    }


    public List<ProductResponse> getAllProducts() {

        return productRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }

    public ProductResponse getProductById(Long id) {

        Product product =
                productRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Produit introuvable"
                                )
                        );

        return map(product);
    }

    public List<ProductResponse> searchProducts(String keyword) {

        return productRepository
                .findByNameContainingIgnoreCase(keyword)
                .stream()
                .map(this::map)
                .toList();
    }

    public List<ProductResponse> getProductsByCompany(Long companyId) {


        return productRepository
                .findByCompanyId(companyId)
                .stream()
                .map(this::map)
                .toList();

    }

    @Transactional
    public void delete(Long id){

        Product product =
                productRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Produit introuvable"
                                )
                        );


        productRepository.delete(product);

    }

}