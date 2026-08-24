package com.ttesicg.sante.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", nullable=false)
    @JsonIgnore
    private User user;



    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private OrderStatus status;



    @Column(name="total_amount", nullable=false)
    private BigDecimal totalAmount;



    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();



    @Column(name="created_at")
    private LocalDateTime createdAt;



    @Column(name="updated_at")
    private LocalDateTime updatedAt;



    @PrePersist
    protected void onCreate(){

        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }



    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;


    @Column(name = "customer_note", columnDefinition = "TEXT")
    private String customerNote;

    @PreUpdate
    protected void onUpdate(){

        updatedAt = LocalDateTime.now();
    }

}