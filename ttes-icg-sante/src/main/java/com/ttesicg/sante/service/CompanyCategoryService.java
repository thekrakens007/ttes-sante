
package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.CompanyCategoryRequest;
import com.ttesicg.sante.dto.CompanyCategoryResponse;
import com.ttesicg.sante.entity.CompanyCategory;
import com.ttesicg.sante.repository.CompanyCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyCategoryService {

    private final CompanyCategoryRepository categoryRepository;

    public CompanyCategoryResponse create(CompanyCategoryRequest request) {
        String name = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException(
                    "Une catégorie d'entreprise portant ce nom existe déjà"
            );
        }

        CompanyCategory category = CompanyCategory.builder()
                .name(name)
                .description(request.getDescription())
                .build();

        return map(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public List<CompanyCategoryResponse> findAll() {
        return categoryRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyCategoryResponse findById(Long id) {
        return map(getCategory(id));
    }

    public CompanyCategoryResponse update(
            Long id,
            CompanyCategoryRequest request
    ) {
        CompanyCategory category = getCategory(id);
        String name = request.getName().trim();

        categoryRepository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "Une catégorie d'entreprise portant ce nom existe déjà"
                    );
                });

        category.setName(name);
        category.setDescription(request.getDescription());

        return map(categoryRepository.save(category));
    }

    public void delete(Long id) {
        CompanyCategory category = getCategory(id);

        try {
            categoryRepository.delete(category);
            categoryRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer cette catégorie : elle est utilisée par une entreprise."
            );
        }
    }

    private CompanyCategory getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Catégorie d'entreprise introuvable : " + id
                ));
    }

    private CompanyCategoryResponse map(CompanyCategory category) {
        return CompanyCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}
