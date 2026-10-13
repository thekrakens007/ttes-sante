
package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.CompanyCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyCategoryRepository
        extends JpaRepository<CompanyCategory, Long> {

    Optional<CompanyCategory> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
