package com.ttesicg.sante.dto;

import com.ttesicg.sante.entity.CureType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CureResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        CureType type,
        BigDecimal price,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}