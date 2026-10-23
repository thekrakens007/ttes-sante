package com.ttesicg.sante.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CompanyRequestTest {

    private final Validator validator =
            Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsPublicLogoUrlsAndUploadedWebpImages() {
        CompanyRequest request = new CompanyRequest();
        request.setName("Example company");

        request.setLogoUrl("https://example.com/logo.png");
        assertFalse(hasLogoViolation(request));

        request.setLogoUrl("data:image/webp;base64,QUJD");
        assertFalse(hasLogoViolation(request));
    }

    @Test
    void rejectsUnsupportedLogoSchemes() {
        CompanyRequest request = new CompanyRequest();
        request.setName("Example company");
        request.setLogoUrl("javascript:alert(1)");

        assertTrue(hasLogoViolation(request));
    }

    private boolean hasLogoViolation(CompanyRequest request) {
        return validator.validate(request).stream()
                .anyMatch(violation ->
                        violation.getPropertyPath().toString().equals("logoUrl"));
    }
}
