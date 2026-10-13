
package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CompanyCategoryResponse;
import com.ttesicg.sante.service.CompanyCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/company-categories")
@RequiredArgsConstructor
public class CompanyCategoryController {

    private final CompanyCategoryService categoryService;

    @GetMapping
    public List<CompanyCategoryResponse> findAll() {
        return categoryService.findAll();
    }
}
