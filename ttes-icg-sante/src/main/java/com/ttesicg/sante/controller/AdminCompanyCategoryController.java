
package com.ttesicg.sante.controller;

import com.ttesicg.sante.dto.CompanyCategoryRequest;
import com.ttesicg.sante.dto.CompanyCategoryResponse;
import com.ttesicg.sante.service.CompanyCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/company-categories")
@RequiredArgsConstructor
public class AdminCompanyCategoryController {

    private final CompanyCategoryService categoryService;

    @PostMapping
    public CompanyCategoryResponse create(
            @Valid @RequestBody CompanyCategoryRequest request
    ) {
        return categoryService.create(request);
    }

    @GetMapping
    public List<CompanyCategoryResponse> findAll() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    public CompanyCategoryResponse findById(@PathVariable Long id) {
        return categoryService.findById(id);
    }

    @PutMapping("/{id}")
    public CompanyCategoryResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CompanyCategoryRequest request
    ) {
        return categoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        categoryService.delete(id);
    }
}
