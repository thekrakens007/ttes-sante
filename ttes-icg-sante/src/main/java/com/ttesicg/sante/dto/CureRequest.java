
package com.ttesicg.sante.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CureRequest(
        @NotBlank
        @Size(max = 180)
        String name,

        @Size(max = 10000)
        String description,

        @Size(max = 1000)
        String imageUrl,

        Boolean active,

        @NotEmpty
        List<@Valid CureItemRequest> items
) {
    public record CureItemRequest(
            @NotNull
            @Positive
            Long productId,

            @NotNull
            @Positive
            @Max(10000)
            Integer quantity
    ) {}
}
