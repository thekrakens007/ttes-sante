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

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    // =========================================================
    // RECHERCHE ADMIN
    // =========================================================

    @Query("""
        SELECT p
        FROM Product p
        LEFT JOIN p.company company
        WHERE
            LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(COALESCE(p.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(COALESCE(p.activeIngredient, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(COALESCE(company.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
        """)
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            Pageable pageable
    );


    // =========================================================
    // PRODUITS DISPONIBLES
    // =========================================================

    @Query("""
        SELECT p
        FROM Product p
        WHERE
            p.active = true
            AND p.inventory.quantity > 0
        """)
    Page<Product> findAvailableProducts(
            Pageable pageable
    );


    // =========================================================
    // PRODUITS DISPONIBLES + RECHERCHE + FILTRES
    // =========================================================

    @Query("""
        SELECT DISTINCT p
        FROM Product p
        LEFT JOIN p.categories c
        LEFT JOIN p.therapeuticAreas ta
        LEFT JOIN p.company company
        WHERE
            p.active = true
            AND p.inventory.quantity > 0

            AND (
                :keyword IS NULL
                OR :keyword = ''
                OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.activeIngredient, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(company.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )

            AND (
                :categoryId IS NULL
                OR c.id = :categoryId
            )

            AND (
                :companyId IS NULL
                OR company.id = :companyId
            )

            AND (
                :therapeuticAreaId IS NULL
                OR ta.id = :therapeuticAreaId
            )
        """)
    Page<Product> findAvailableProductsWithFilters(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("companyId") Long companyId,
            @Param("therapeuticAreaId") Long therapeuticAreaId,
            Pageable pageable
    );


    // =========================================================
    // PRODUITS DISPONIBLES + RECHERCHE
    // =========================================================

    @Query("""
        SELECT p
        FROM Product p
        LEFT JOIN p.company company
        WHERE
            p.active = true
            AND p.inventory.quantity > 0
            AND (
                LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.activeIngredient, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(company.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
        """)
    Page<Product> searchAvailableProducts(
            @Param("keyword") String keyword,
            Pageable pageable
    );


    // =========================================================
    // PAR ENTREPRISE
    // =========================================================

    List<Product> findByCompanyId(Long companyId);


    // =========================================================
    // PRODUITS ACTIFS
    // =========================================================

    List<Product> findByActiveTrue();


    // =========================================================
    // RECHERCHE SIMPLE PAR NOM
    // =========================================================

    List<Product> findByNameContainingIgnoreCase(String name);
}
