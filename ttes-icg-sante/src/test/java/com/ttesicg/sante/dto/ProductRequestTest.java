package com.ttesicg.sante.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductRequestTest {

    private final Validator validator =
            Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void dosageAllowsUpTo1000Characters() {
        ProductRequest request = new ProductRequest();
        request.setDosage("x".repeat(1000));

        assertFalse(hasDosageViolation(request));
    }

    @Test
    void dosageRejectsMoreThan1000Characters() {
        ProductRequest request = new ProductRequest();
        request.setDosage("x".repeat(1001));

        assertTrue(hasDosageViolation(request));
    }

    private boolean hasDosageViolation(ProductRequest request) {
        return validator.validate(request).stream()
                .anyMatch(violation ->
                        violation.getPropertyPath().toString().equals("dosage"));
    }
}
