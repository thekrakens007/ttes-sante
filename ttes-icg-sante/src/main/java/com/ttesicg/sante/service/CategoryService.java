package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.CategoryRequest;
import com.ttesicg.sante.dto.CategoryResponse;
import com.ttesicg.sante.entity.Category;
import com.ttesicg.sante.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;


import java.util.List;


@Service
@RequiredArgsConstructor
public class CategoryService {


    private final CategoryRepository categoryRepository;


    public CategoryResponse findById(Long id){

        Category category =
                categoryRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Catégorie introuvable"
                                )
                        );

        return map(category);
    }

    public CategoryResponse update(
            Long id,
            CategoryRequest request
    ){

        Category category =
                categoryRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Catégorie introuvable"
                                )
                        );

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        categoryRepository.save(category);

        return map(category);
    }
    public void delete(Long id){

        categoryRepository.deleteById(id);

    }
    public CategoryResponse create(CategoryRequest request){


        Category category = Category.builder()

                .name(request.getName())

                .description(request.getDescription())

                .active(true)

                .build();



        categoryRepository.save(category);



        return map(category);
    }



    public List<CategoryResponse> findAll(){


        return categoryRepository.findAll()
                .stream()
                .map(this::map)
                .toList();

    }



    private CategoryResponse map(Category category){


        return CategoryResponse.builder()

                .id(category.getId())

                .name(category.getName())

                .description(category.getDescription())

                .imageUrl(category.getImageUrl())

                .active(category.getActive())

                .build();

    }

}