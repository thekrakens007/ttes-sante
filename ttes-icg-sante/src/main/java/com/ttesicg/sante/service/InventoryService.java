package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.InventoryRequest;
import com.ttesicg.sante.dto.InventoryResponse;
import com.ttesicg.sante.entity.Inventory;
import com.ttesicg.sante.entity.Product;
import com.ttesicg.sante.repository.InventoryRepository;

import com.ttesicg.sante.repository.ProductRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class InventoryService {


    private final InventoryRepository inventoryRepository;

    private final ProductRepository productRepository;

    public InventoryResponse findByProductId(Long productId){


        Inventory inventory =
                inventoryRepository.findByProductId(productId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Stock introuvable"
                                )
                        );


        return map(inventory);

    }




    public InventoryResponse update(
            Long productId,
            InventoryRequest request
    ) {

        Inventory inventory =
                inventoryRepository.findByProductId(productId)
                        .orElseGet(() -> {

                            Product product =
                                    productRepository.findById(productId)
                                            .orElseThrow(
                                                    () -> new RuntimeException(
                                                            "Produit introuvable"
                                                    )
                                            );

                            return Inventory.builder()
                                    .product(product)
                                    .quantity(0)
                                    .minimumQuantity(0)
                                    .build();
                        });

        inventory.setQuantity(
                request.getQuantity()
        );

        inventory.setMinimumQuantity(
                request.getMinimumQuantity()
        );

        inventoryRepository.save(inventory);

        return map(inventory);
    }





    private InventoryResponse map(
            Inventory inventory
    ){

        return InventoryResponse.builder()

                .id(inventory.getId())

                .productId(
                        inventory.getProduct().getId()
                )

                .productName(
                        inventory.getProduct().getName()
                )

                .quantity(
                        inventory.getQuantity()
                )

                .minimumQuantity(
                        inventory.getMinimumQuantity()
                )

                .available(
                        inventory.getQuantity() > 0
                )

                .build();

    }

}