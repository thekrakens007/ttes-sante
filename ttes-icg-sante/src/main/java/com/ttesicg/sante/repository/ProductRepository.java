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
        SELECT DISTINCT p
        FROM Product p
        LEFT JOIN p.categories c
        LEFT JOIN p.therapeuticAreas ta
        LEFT JOIN p.company company
        WHERE
            unaccent(LOWER(p.name))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(p.sku))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(p.brand, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(p.activeIngredient, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(p.description, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(p.ingredients, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(p.dosage, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(p.form, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(company.name, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(c.name, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

            OR unaccent(LOWER(COALESCE(ta.name, '')))
                LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')
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
    Page<Product> findAvailableProducts(Pageable pageable);


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

                OR unaccent(LOWER(p.name))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(p.sku))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(p.brand, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(p.activeIngredient, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(p.description, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(p.ingredients, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(p.dosage, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(p.form, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(company.name, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(c.name, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')

                OR unaccent(LOWER(COALESCE(ta.name, '')))
                    LIKE CONCAT('%', unaccent(LOWER(:keyword)), '%')
            )

            AND (
                :categoryId IS NULL
                OR c.id = :categoryId
            )

            AND (
                :companyId IS NULL
                OR p.company.id = :companyId
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
    // PRODUITS DISPONIBLES + RECHERCHE GLOBALE
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
            function('unaccent', LOWER(p.name))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(p.sku))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(p.brand, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(p.activeIngredient, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(p.description, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(p.ingredients, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(p.dosage, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(p.form, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(company.name, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(c.name, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')

            OR function('unaccent', LOWER(COALESCE(ta.name, '')))
                LIKE CONCAT('%', function('unaccent', LOWER(:keyword)), '%')
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
