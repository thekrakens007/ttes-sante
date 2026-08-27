package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.CompanyRequest;
import com.ttesicg.sante.dto.CompanyResponse;
import com.ttesicg.sante.dto.ProductResponse;
import com.ttesicg.sante.entity.Company;
import com.ttesicg.sante.entity.Product;
import com.ttesicg.sante.repository.CompanyRepository;
import com.ttesicg.sante.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    private final ProductRepository productRepository;


    // =========================================================
    // CREER
    // =========================================================

    public CompanyResponse create(
            CompanyRequest request
    ) {

        Company company = Company.builder()
                .name(request.getName())
                .description(request.getDescription())
                .country(request.getCountry())
                .website(request.getWebsite())
                .build();

        Company saved =
                companyRepository.save(company);

        return map(saved);
    }


    // =========================================================
    // MODIFIER
    // =========================================================

    public CompanyResponse update(
            Long id,
            CompanyRequest request
    ) {

        Company company =
                companyRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Entreprise introuvable"
                                )
                        );

        company.setName(
                request.getName()
        );

        company.setDescription(
                request.getDescription()
        );

        company.setCountry(
                request.getCountry()
        );

        company.setWebsite(
                request.getWebsite()
        );

        companyRepository.save(company);

        return map(company);
    }


    // =========================================================
    // LISTE DES ENTREPRISES
    // =========================================================

    public List<CompanyResponse> findAll() {

        return companyRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }


    // =========================================================
    // DETAIL ENTREPRISE
    // =========================================================

    public CompanyResponse findById(
            Long id
    ) {

        Company company =
                companyRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Entreprise introuvable"
                                )
                        );

        return map(company);
    }


    // =========================================================
    // PRODUITS D'UNE ENTREPRISE
    // =========================================================

    public List<ProductResponse> findProducts(
            Long companyId
    ) {

        companyRepository.findById(companyId)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Entreprise introuvable"
                        )
                );

        return productRepository
                .findByCompanyId(companyId)
                .stream()
                .map(this::mapProduct)
                .toList();
    }


    // =========================================================
    // SUPPRIMER
    // =========================================================

    public void delete(
            Long id
    ) {

        companyRepository.deleteById(id);
    }


    // =========================================================
    // MAPPING COMPANY
    // =========================================================

    private CompanyResponse map(
            Company company
    ) {

        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .description(company.getDescription())
                .country(company.getCountry())
                .website(company.getWebsite())
                .build();
    }


    // =========================================================
    // MAPPING PRODUCT
    // =========================================================

    private ProductResponse mapProduct(
            Product product
    ) {

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

                .stock(
                        product.getInventory() != null
                                ? product.getInventory().getQuantity()
                                : 0
                )

                .companyId(
                        product.getCompany().getId()
                )

                .companyName(
                        product.getCompany().getName()
                )

                .categoryIds(
                        product.getCategories()
                                .stream()
                                .map(category -> category.getId())
                                .collect(
                                        java.util.stream.Collectors.toSet()
                                )
                )

                .categories(
                        product.getCategories()
                                .stream()
                                .map(category -> category.getName())
                                .collect(
                                        java.util.stream.Collectors.toSet()
                                )
                )

                .therapeuticAreaIds(
                        product.getTherapeuticAreas()
                                .stream()
                                .map(area -> area.getId())
                                .collect(
                                        java.util.stream.Collectors.toSet()
                                )
                )

                .therapeuticAreas(
                        product.getTherapeuticAreas()
                                .stream()
                                .map(area -> area.getName())
                                .collect(
                                        java.util.stream.Collectors.toSet()
                                )
                )

                .images(
                        product.getImages()
                                .stream()
                                .map(image ->
                                        com.ttesicg.sante.dto.ProductImageResponse
                                                .builder()
                                                .id(image.getId())
                                                .imageUrl(image.getImageUrl())
                                                .build()
                                )
                                .toList()
                )

                .build();
    }
}