package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class TherapeuticAreaRequest {


    @NotBlank(message = "Le nom est obligatoire")
    private String name;


    private String description;

}