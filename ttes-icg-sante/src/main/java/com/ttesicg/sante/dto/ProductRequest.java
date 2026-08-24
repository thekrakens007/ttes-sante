package com.ttesicg.sante.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;


@Data
public class ProductRequest {


    @NotNull(message = "L'entreprise est obligatoire")
    private Long companyId;


    @NotBlank(message = "Le nom est obligatoire")
    private String name;


    @NotBlank(message = "Le SKU est obligatoire")
    private String sku;


    private String description;


    private String brand;


    private String activeIngredient;


    private String dosage;


    private String form;


    @NotNull(message = "Le prix est obligatoire")
    private BigDecimal price;


    private Boolean requiresPrescription = false;

    private Integer stock;

    private Set<Long> categoryIds;


    private Set<Long> therapeuticAreaIds;

}