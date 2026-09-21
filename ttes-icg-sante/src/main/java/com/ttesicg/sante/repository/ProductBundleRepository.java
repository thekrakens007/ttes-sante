package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.ProductBundle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductBundleRepository extends JpaRepository<ProductBundle, Long> {

    List<ProductBundle> findByActiveTrueOrderByCreatedAtDesc();

    List<ProductBundle> findAllByOrderByCreatedAtDesc();
}