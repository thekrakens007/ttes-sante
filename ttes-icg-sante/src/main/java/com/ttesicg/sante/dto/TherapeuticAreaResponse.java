package com.ttesicg.sante.dto;

import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class TherapeuticAreaResponse {


    private Long id;

    private String name;

    private String description;

    private Boolean active;

}