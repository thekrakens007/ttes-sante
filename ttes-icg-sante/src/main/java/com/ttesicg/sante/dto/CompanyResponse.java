package com.ttesicg.sante.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompanyResponse {

    private Long id;

    private String name;

    private String description;

    private String country;

    private String website;
}