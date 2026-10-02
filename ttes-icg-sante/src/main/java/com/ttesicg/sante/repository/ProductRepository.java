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

    /*
     * =========================================================
     * RECHERCHE ADMIN
     * =========================================================
     */
    @Query("""
        SELECT p
        FROM Product p
        WHERE
            LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(COALESCE(p.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(COALESCE(p.activeIngredient, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(COALESCE(p.company.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
        """)
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /*
     * =========================================================
     * PRODUITS DISPONIBLES
     * =========================================================
     */
    @Query("""
        SELECT p
        FROM Product p
        WHERE p.active = true
          AND p.inventory.quantity > 0
        """)
    Page<Product> findAvailableProducts(Pageable pageable);

    /*
     * =========================================================
     * RECHERCHE CLIENT
     * =========================================================
     */
    @Query("""
        SELECT p
        FROM Product p
        WHERE
            p.active = true
            AND p.inventory.quantity > 0
            AND (
                LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.brand, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.activeIngredient, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(p.company.name, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
        """)
    Page<Product> searchAvailableProducts(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    List<Product> findByCompanyId(Long companyId);

    List<Product> findByActiveTrue();

    List<Product> findByNameContainingIgnoreCase(String name);
}
