
package com.ttesicg.sante.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CompanyCategoryResponse {

    private Long id;
    private String name;
    private String description;
}
