package com.ttesicg.sante.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "carts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;



    @OneToMany(
            mappedBy = "cart",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private Set<CartItem> items = new HashSet<>();



    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;



    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;



    @PrePersist
    protected void onCreate(){

        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }



    @PreUpdate
    protected void onUpdate(){

        updatedAt = LocalDateTime.now();

    }

}