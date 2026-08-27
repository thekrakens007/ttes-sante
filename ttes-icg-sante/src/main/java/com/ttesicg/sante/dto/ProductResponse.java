package com.ttesicg.sante.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Data
@Builder
public class ProductResponse {

    private Long id;

    private String name;

    private String sku;

    private String description;

    private String brand;

    private String activeIngredient;

    private String dosage;

    private String form;

    private BigDecimal price;

    private Boolean requiresPrescription;

    private Integer stock;

    // ==========================================
    // ENTREPRISE
    // ==========================================

    private Long companyId;

    private String companyName;

    // ==========================================
    // CATEGORIES
    // ==========================================

    private Set<Long> categoryIds;

    private Set<String> categories;

    // ==========================================
    // DOMAINES THERAPEUTIQUES
    // ==========================================

    private Set<Long> therapeuticAreaIds;

    private Set<String> therapeuticAreas;

    // ==========================================
    // IMAGES
    // ==========================================

    private List<ProductImageResponse> images;

}