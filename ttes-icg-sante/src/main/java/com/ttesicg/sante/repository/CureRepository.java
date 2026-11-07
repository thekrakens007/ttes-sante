package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.Cure;
import com.ttesicg.sante.entity.CureType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CureRepository extends JpaRepository<Cure, Long> {

    Page<Cure> findByActiveTrue(Pageable pageable);

    Page<Cure> findByActiveTrueAndType(
            CureType type,
            Pageable pageable
    );
}