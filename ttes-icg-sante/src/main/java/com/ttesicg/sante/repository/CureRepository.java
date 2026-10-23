
package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.Cure;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CureRepository extends JpaRepository<Cure, Long> {

    @EntityGraph(attributePaths = {"items", "items.product"})
    List<Cure> findByActiveTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<Cure> findWithItemsById(Long id);

    @EntityGraph(attributePaths = {"items", "items.product"})
    List<Cure> findAllByOrderByCreatedAtDesc();
}
