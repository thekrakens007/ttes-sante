package com.ttesicg.sante.controller;


import com.ttesicg.sante.dto.CategoryRequest;
import com.ttesicg.sante.dto.CategoryResponse;
import com.ttesicg.sante.service.CategoryService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {



    private final CategoryService categoryService;



    @PostMapping
    public CategoryResponse create(
            @Valid @RequestBody CategoryRequest request
    ){
        System.out.println("yooooooooooooooooooooooooooooooooooooooooooooo");
        return categoryService.create(request);

    }

    @GetMapping("/{id}")
    public CategoryResponse findById(
            @PathVariable Long id
    ){
        System.out.println("yooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
        return categoryService.findById(id);
    }


    @PutMapping("/{id}")
    public CategoryResponse update(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request
    ){
        return categoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ){
        categoryService.delete(id);
    }

    @GetMapping
    public List<CategoryResponse> findAll(){

        return categoryService.findAll();

    }

}