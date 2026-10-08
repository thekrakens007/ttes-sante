package com.ttesicg.sante.repository;

import com.ttesicg.sante.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

// =========================================================
// SKU
// =========================================================

Optional<Product> findBySku(String sku);

boolean existsBySku(String sku);

// =========================================================
// RECHERCHE SIMPLE
// =========================================================

List<Product> findByNameContainingIgnoreCase(String keyword);

// =========================================================
// PRODUITS PAR ENTREPRISE
// =========================================================

List<Product> findByCompanyId(Long companyId);

// =========================================================
// PRODUITS DISPONIBLES
// =========================================================

@Query("""
    SELECT DISTINCT p
    FROM Product p
    LEFT JOIN p.company c
    LEFT JOIN p.categories cat
    LEFT JOIN p.therapeuticAreas ta
    LEFT JOIN p.inventory i
    WHERE p.active = true
      AND (
            :keyword = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
      AND (
            :categoryId IS NULL
            OR cat.id = :categoryId
          )
      AND (
            :companyId IS NULL
            OR c.id = :companyId
          )
      AND (
            :therapeuticAreaId IS NULL
            OR ta.id = :therapeuticAreaId
          )
      AND (
            i IS NULL
            OR i.quantity > 0
          )
    ORDER BY p.id DESC
    """)
Page<Product> findAvailableProductsWithFilters(
        @Param("keyword") String keyword,
        @Param("categoryId") Long categoryId,
        @Param("companyId") Long companyId,
        @Param("therapeuticAreaId") Long therapeuticAreaId,
        Pageable pageable
);

// =========================================================
// PRODUITS DISPONIBLES SANS FILTRE
// =========================================================

@Query("""
    SELECT DISTINCT p
    FROM Product p
    LEFT JOIN p.inventory i
    WHERE p.active = true
      AND (
            i IS NULL
            OR i.quantity > 0
          )
    ORDER BY p.id DESC
    """)
Page<Product> findAvailableProducts(Pageable pageable);

// =========================================================
// RECHERCHE PRODUITS CLIENT
// =========================================================

@Query("""
    SELECT DISTINCT p
    FROM Product p
    LEFT JOIN p.company c
    WHERE p.active = true
      AND (
            LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
    ORDER BY p.id DESC
    """)
Page<Product> searchAvailableProducts(
        @Param("keyword") String keyword,
        Pageable pageable
);

// =========================================================
// RECHERCHE ADMIN
// =========================================================

@Query("""
    SELECT DISTINCT p
    FROM Product p
    LEFT JOIN p.company c
    WHERE
        LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
    ORDER BY p.id DESC
    """)
Page<Product> searchProducts(
        @Param("keyword") String keyword,
        Pageable pageable
);

}
