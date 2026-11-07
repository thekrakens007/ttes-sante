package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CureResponse;
import com.ttesicg.sante.entity.CureType;
import com.ttesicg.sante.service.CureService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cures")
@RequiredArgsConstructor
public class CureController {

    private final CureService cureService;

    @GetMapping
    public Page<CureResponse> getCures(
            @RequestParam(required = false) CureType type,

            @PageableDefault(
                    size = 8,
                    sort = {"createdAt", "id"},
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return cureService.findPublicCures(pageable, type);
    }

    @GetMapping("/{id}")
    public CureResponse getCure(@PathVariable Long id) {
        return cureService.findPublicCure(id);
    }
}