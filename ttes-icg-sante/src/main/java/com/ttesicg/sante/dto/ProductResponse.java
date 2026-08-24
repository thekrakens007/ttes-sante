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


    private String companyName;

    private Integer stock;

    private Set<String> categories;


    private Set<String> therapeuticAreas;

    private List<ProductImageResponse> images;

}