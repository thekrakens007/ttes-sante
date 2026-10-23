
package com.ttesicg.sante.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    @Size(max = 400_000)
    @Pattern(
            regexp = "(?i)^(?:https?://\\S{1,492}|data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})?$",
            message = "Le logo doit être une URL HTTP(S) ou une image PNG, JPEG ou WebP."
    )
    private String logoUrl;

    // Facultatif : null signifie qu'aucune catégorie n'est sélectionnée.
    private Long categoryId;
}
