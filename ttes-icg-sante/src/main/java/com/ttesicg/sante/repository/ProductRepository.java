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

    // SKU
    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    // RECHERCHE SIMPLE (sans accents)
    @Query("""
        SELECT p FROM Product p
        WHERE LOWER(function('unaccent', p.name))
              LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
        """)
    List<Product> findByNameContainingIgnoreCase(@Param("keyword") String keyword);

    // PRODUITS PAR ENTREPRISE
    List<Product> findByCompanyId(Long companyId);

    // PRODUITS DISPONIBLES AVEC FILTRES
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
                OR LOWER(function('unaccent', p.name))        LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', p.sku))         LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', p.brand))       LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', p.description)) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', c.name))        LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
              )
          AND (:categoryId IS NULL OR cat.id = :categoryId)
          AND (:companyId IS NULL OR c.id = :companyId)
          AND (:therapeuticAreaId IS NULL OR ta.id = :therapeuticAreaId)
          AND (i IS NULL OR i.quantity > 0)
        ORDER BY p.id DESC
        """)
    Page<Product> findAvailableProductsWithFilters(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("companyId") Long companyId,
            @Param("therapeuticAreaId") Long therapeuticAreaId,
            Pageable pageable
    );

    // PRODUITS DISPONIBLES SANS FILTRE
    @Query("""
        SELECT DISTINCT p
        FROM Product p
        LEFT JOIN p.inventory i
        WHERE p.active = true
          AND (i IS NULL OR i.quantity > 0)
        ORDER BY p.id DESC
        """)
    Page<Product> findAvailableProducts(Pageable pageable);

    // RECHERCHE PRODUITS CLIENT
    @Query("""
        SELECT DISTINCT p
        FROM Product p
        LEFT JOIN p.company c
        WHERE p.active = true
          AND (
                LOWER(function('unaccent', p.name))        LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', p.sku))         LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', p.brand))       LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', p.description)) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
                OR LOWER(function('unaccent', c.name))        LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
              )
        ORDER BY p.id DESC
        """)
    Page<Product> searchAvailableProducts(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // RECHERCHE ADMIN
    @Query("""
        SELECT DISTINCT p
        FROM Product p
        LEFT JOIN p.company c
        WHERE
            LOWER(function('unaccent', p.name))        LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
            OR LOWER(function('unaccent', p.sku))         LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
            OR LOWER(function('unaccent', p.brand))       LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
            OR LOWER(function('unaccent', p.description)) LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
            OR LOWER(function('unaccent', c.name))        LIKE LOWER(function('unaccent', CONCAT('%', :keyword, '%')))
        ORDER BY p.id DESC
        """)
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}