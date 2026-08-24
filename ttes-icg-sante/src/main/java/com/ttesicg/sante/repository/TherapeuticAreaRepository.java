package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.TherapeuticArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TherapeuticAreaRepository extends JpaRepository<TherapeuticArea, Long> {

    Optional<TherapeuticArea> findByName(String name);

    boolean existsByName(String name);
}