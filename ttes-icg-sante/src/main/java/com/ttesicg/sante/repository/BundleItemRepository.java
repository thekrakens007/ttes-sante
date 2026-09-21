package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.BundleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BundleItemRepository extends JpaRepository<BundleItem, Long> {

    List<BundleItem> findByBundleId(Long bundleId);

    void deleteByBundleId(Long bundleId);
}