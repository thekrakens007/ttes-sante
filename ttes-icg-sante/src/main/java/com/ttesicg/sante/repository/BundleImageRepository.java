package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.BundleImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BundleImageRepository extends JpaRepository<BundleImage, Long> {

    List<BundleImage> findByBundleIdOrderByDisplayOrderAsc(Long bundleId);

    void deleteByBundleId(Long bundleId);
}