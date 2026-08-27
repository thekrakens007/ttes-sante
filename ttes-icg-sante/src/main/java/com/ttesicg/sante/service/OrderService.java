package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.CreateOrderRequest;
import com.ttesicg.sante.dto.OrderItemResponse;
import com.ttesicg.sante.dto.OrderResponse;
import com.ttesicg.sante.entity.*;
import com.ttesicg.sante.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;


@Service
@RequiredArgsConstructor
public class OrderService {


    private final OrderRepository orderRepository;

    private final UserRepository userRepository;

    private final CartRepository cartRepository;

    private final CartItemRepository cartItemRepository;

    private final WhatsAppService whatsappService;

    private final InventoryRepository inventoryRepository;

    @Transactional
    public OrderResponse createOrder(
            Long userId,
            CreateOrderRequest request
    ) {

        User user =
                userRepository.findById(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Utilisateur introuvable"
                                )
                        );


        Cart cart =
                cartRepository.findByUser(user)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Panier introuvable"
                                )
                        );


        if (cart.getItems().isEmpty()) {

            throw new RuntimeException(
                    "Le panier est vide"
            );
        }


        Order order =
                Order.builder()

                        .user(user)

                        .status(OrderStatus.PENDING)

                        .totalAmount(BigDecimal.ZERO)

                        .deliveryAddress(
                                request.getDeliveryAddress()
                        )

                        .customerNote(
                                request.getCustomerNote()
                        )

                        .items(
                                new java.util.ArrayList<>()
                        )

                        .build();


        BigDecimal total =
                BigDecimal.ZERO;


        for (CartItem cartItem : cart.getItems()) {

            checkAndUpdateStock(cartItem);


            OrderItem item =
                    OrderItem.builder()

                            .order(order)

                            .product(
                                    cartItem.getProduct()
                            )

                            .quantity(
                                    cartItem.getQuantity()
                            )

                            .price(
                                    cartItem.getPrice()
                            )

                            .build();


            order.getItems()
                    .add(item);


            BigDecimal subtotal =
                    cartItem.getPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            cartItem.getQuantity()
                                    )
                            );


            total =
                    total.add(subtotal);
        }


        order.setTotalAmount(total);


        // ==========================================================
        // ENREGISTRER LA COMMANDE
        // ==========================================================

        Order saved =
                orderRepository.save(order);


        // ==========================================================
        // GENERER LE LIEN WHATSAPP
        // ==========================================================

        String whatsappLink =
                whatsappService.generateWhatsAppLink(saved);


        // ==========================================================
        // VIDER LE PANIER
        // ==========================================================

        cartItemRepository.deleteAll(
                cart.getItems()
        );

        cart.getItems().clear();

        cartRepository.save(cart);


        // ==========================================================
        // REPONSE
        // ==========================================================

        OrderResponse response =
                map(saved);


        response.setWhatsappLink(
                whatsappLink
        );


        return response;
    }

    private OrderResponse map(Order order){


        OrderResponse response = OrderResponse.builder()

                .id(order.getId())

                .status(
                        order.getStatus().name()
                )

                .totalAmount(
                        order.getTotalAmount()
                )
                .customerName(
                        order.getUser().getFirstName()
                                +" "
                                +order.getUser().getLastName()
                )

                .customerPhone(
                        order.getUser().getPhone()
                )

                .customerEmail(
                        order.getUser().getEmail()
                )
                .deliveryAddress(
                        order.getDeliveryAddress()
                )

                .customerNote(
                        order.getCustomerNote()
                )
                .items(
                        order.getItems()
                                .stream()
                                .map(item ->

                                        OrderItemResponse.builder()

                                                .id(item.getId())

                                                .productName(
                                                        item.getProduct()
                                                                .getName()
                                                )

                                                .quantity(
                                                        item.getQuantity()
                                                )

                                                .price(
                                                        item.getPrice()
                                                )


                                                .build()


                                )

                                .toList()
                )

                .build();



        return response;

    }


    private User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Utilisateur introuvable"
                        )
                );
    }

    @Transactional
    public OrderResponse createOrderByEmail(
            String email,
            CreateOrderRequest request
    ) {

        User user = getUserByEmail(email);

        return createOrder(
                user.getId(),
                request
        );
    }

    public List<OrderResponse> findMyOrdersByEmail(
            String email
    ) {

        User user = getUserByEmail(email);

        return findMyOrders(
                user.getId()
        );
    }

    public List<OrderResponse> findMyOrders(Long userId){


        return orderRepository
                .findByUserId(userId)
                .stream()
                .map(this::map)
                .toList();

    }

    public List<OrderResponse> findAllOrders(){


        return orderRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::map)
                .toList();

    }

    public OrderResponse updateStatus(
            Long orderId,
            String status
    ){

        Order order =
                orderRepository.findById(orderId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Commande introuvable"
                                )
                        );


        order.setStatus(
                OrderStatus.valueOf(status)
        );


        orderRepository.save(order);


        return map(order);

    }

    private void checkAndUpdateStock(CartItem cartItem){


        Inventory inventory =
                inventoryRepository
                        .findByProductId(
                                cartItem.getProduct().getId()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Stock introuvable pour "
                                                + cartItem.getProduct().getName()
                                )
                        );


        if(inventory.getQuantity() < cartItem.getQuantity()){

            throw new RuntimeException(
                    "Stock insuffisant pour "
                            + cartItem.getProduct().getName()
            );

        }


        inventory.setQuantity(
                inventory.getQuantity()
                        -
                        cartItem.getQuantity()
        );


        inventoryRepository.save(inventory);

    }

}