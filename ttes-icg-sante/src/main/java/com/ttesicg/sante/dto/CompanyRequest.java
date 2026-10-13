
package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CompanyRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 255)
    private String name;

    private String description;

    @Size(max = 100)
    private String country;

    @Size(max = 500)
    private String website;

    @Size(max = 500)
    private String logoUrl;

    // Facultatif : null signifie qu'aucune catégorie n'est sélectionnée.
    private Long categoryId;
}
