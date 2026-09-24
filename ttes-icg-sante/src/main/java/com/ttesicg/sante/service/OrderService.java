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

    private final BundleItemRepository bundleItemRepository;

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

        BigDecimal total = BigDecimal.ZERO;

        /*
         * IMPORTANT :
         *
         * On parcourt les articles du panier.
         *
         * Chaque article peut être :
         *
         * - un produit
         * - un pack
         */
        for (CartItem cartItem : cart.getItems()) {

            /*
             * Vérifier et décrémenter le stock.
             */
            checkAndUpdateStock(cartItem);

            /*
             * Créer la ligne de commande.
             */
            OrderItem item =
                    OrderItem.builder()
                            .order(order)
                            .product(cartItem.getProduct())
                            .bundle(cartItem.getBundle())
                            .quantity(cartItem.getQuantity())
                            .price(cartItem.getPrice())
                            .build();

            order.getItems()
                    .add(item);

            /*
             * Calcul du sous-total.
             */
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

        /*
         * ENREGISTRER LA COMMANDE
         */
        Order saved =
                orderRepository.save(order);

        /*
         * GENERER LE LIEN WHATSAPP
         */
        String whatsappLink =
                whatsappService.generateWhatsAppLink(saved);

        /*
         * VIDER LE PANIER
         */
        cartItemRepository.deleteAll(
                cart.getItems()
        );

        cart.getItems().clear();

        cartRepository.save(cart);

        /*
         * REPONSE
         */
        OrderResponse response =
                map(saved);

        response.setWhatsappLink(
                whatsappLink
        );

        return response;
    }

    /**
     * Vérifie le stock et le décrémente.
     *
     * Produit :
     *
     *   stock produit -= quantité commandée
     *
     * Pack :
     *
     *   pour chaque produit du pack :
     *   stock produit -=
     *       quantité du pack × quantité commandée
     */
    private void checkAndUpdateStock(
            CartItem cartItem
    ) {

        /*
         * ==========================
         * PRODUIT
         * ==========================
         */
        if (cartItem.getProduct() != null) {

            Product product =
                    cartItem.getProduct();

            Inventory inventory =
                    inventoryRepository
                            .findByProductId(
                                    product.getId()
                            )
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "Stock introuvable pour "
                                                    + product.getName()
                                    )
                            );

            if (inventory.getQuantity()
                    < cartItem.getQuantity()) {

                throw new RuntimeException(
                        "Stock insuffisant pour "
                                + product.getName()
                );
            }

            inventory.setQuantity(
                    inventory.getQuantity()
                            - cartItem.getQuantity()
            );

            inventoryRepository.save(inventory);

            return;
        }

        /*
         * ==========================
         * PACK
         * ==========================
         */
        if (cartItem.getBundle() != null) {

            ProductBundle bundle =
                    cartItem.getBundle();

            List<BundleItem> bundleItems =
                    bundleItemRepository
                            .findByBundleId(
                                    bundle.getId()
                            );

            if (bundleItems.isEmpty()) {

                throw new RuntimeException(
                        "Le pack "
                                + bundle.getName()
                                + " ne contient aucun produit"
                );
            }

            /*
             * Première étape :
             * vérifier TOUT le stock avant
             * de modifier quoi que ce soit.
             */
            for (BundleItem bundleItem : bundleItems) {

                Product product =
                        bundleItem.getProduct();

                Inventory inventory =
                        inventoryRepository
                                .findByProductId(
                                        product.getId()
                                )
                                .orElseThrow(
                                        () -> new RuntimeException(
                                                "Stock introuvable pour "
                                                        + product.getName()
                                        )
                                );

                int requiredQuantity =
                        bundleItem.getQuantity()
                                * cartItem.getQuantity();

                if (inventory.getQuantity()
                        < requiredQuantity) {

                    throw new RuntimeException(
                            "Stock insuffisant pour "
                                    + product.getName()
                                    + " dans le pack "
                                    + bundle.getName()
                    );
                }
            }

            /*
             * Deuxième étape :
             * décrémenter les stocks.
             */
            for (BundleItem bundleItem : bundleItems) {

                Product product =
                        bundleItem.getProduct();

                Inventory inventory =
                        inventoryRepository
                                .findByProductId(
                                        product.getId()
                                )
                                .orElseThrow(
                                        () -> new RuntimeException(
                                                "Stock introuvable pour "
                                                        + product.getName()
                                        )
                                );

                int requiredQuantity =
                        bundleItem.getQuantity()
                                * cartItem.getQuantity();

                inventory.setQuantity(
                        inventory.getQuantity()
                                - requiredQuantity
                );

                inventoryRepository.save(inventory);
            }

            return;
        }

        /*
         * ==========================
         * ARTICLE INVALIDE
         * ==========================
         */
        throw new RuntimeException(
                "Article du panier invalide"
        );
    }

    private OrderResponse map(
            Order order
    ) {

        OrderResponse response =
                OrderResponse.builder()

                        .id(order.getId())

                        .status(
                                order.getStatus().name()
                        )

                        .totalAmount(
                                order.getTotalAmount()
                        )

                        .createdAt(
                                order.getCreatedAt()
                        )

                        .customerName(
                                order.getUser().getFirstName()
                                        + " "
                                        + order.getUser().getLastName()
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
                                        .map(this::mapOrderItem)
                                        .toList()
                        )

                        .build();

        return response;
    }

    private OrderItemResponse mapOrderItem(
            OrderItem item
    ) {

        /*
         * Ligne = PRODUIT
         */
        if (item.getProduct() != null) {

            Product product =
                    item.getProduct();

            return OrderItemResponse.builder()

                    .id(item.getId())

                    .productId(
                            product.getId()
                    )

                    .productName(
                            product.getName()
                    )

                    .bundleId(null)

                    .bundleName(null)

                    .quantity(
                            item.getQuantity()
                    )

                    .price(
                            item.getPrice()
                    )

                    .build();
        }

        /*
         * Ligne = PACK
         */
        if (item.getBundle() != null) {

            ProductBundle bundle =
                    item.getBundle();

            return OrderItemResponse.builder()

                    .id(item.getId())

                    .productId(null)

                    .productName(null)

                    .bundleId(
                            bundle.getId()
                    )

                    .bundleName(
                            bundle.getName()
                    )

                    .quantity(
                            item.getQuantity()
                    )

                    .price(
                            item.getPrice()
                    )

                    .build();
        }

        throw new RuntimeException(
                "Ligne de commande invalide"
        );
    }

    private User getUserByEmail(
            String email
    ) {

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

        User user =
                getUserByEmail(email);

        return createOrder(
                user.getId(),
                request
        );
    }

    public List<OrderResponse> findMyOrdersByEmail(
            String email
    ) {

        User user =
                getUserByEmail(email);

        return findMyOrders(
                user.getId()
        );
    }

    public List<OrderResponse> findMyOrders(
            Long userId
    ) {

        return orderRepository
                .findByUserId(userId)
                .stream()
                .map(this::map)
                .toList();
    }

    public List<OrderResponse> findAllOrders() {

        return orderRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::map)
                .toList();
    }

    public OrderResponse updateStatus(
            Long orderId,
            String status
    ) {

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
}