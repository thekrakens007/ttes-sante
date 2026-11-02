
package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.ProductBundle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductBundleRepository extends JpaRepository<ProductBundle, Long> {

    // Packs actifs avec pagination
    Page<ProductBundle> findByActiveTrue(Pageable pageable);

    // Packs actifs sans pagination (conservé)
    List<ProductBundle> findByActiveTrueOrderByCreatedAtDesc();

    // Tous les packs sans pagination (conservé)
    List<ProductBundle> findAllByOrderByCreatedAtDesc();

}
