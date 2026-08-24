package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.*;
import com.ttesicg.sante.entity.*;
import com.ttesicg.sante.repository.*;


import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;


import java.math.BigDecimal;
import java.util.List;



@Service
@RequiredArgsConstructor
public class CartService {


    private final CartRepository cartRepository;

    private final CartItemRepository cartItemRepository;

    private final ProductRepository productRepository;

    private final UserRepository userRepository;

    private User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Utilisateur introuvable"
                        )
                );
    }

    public CartResponse getCartByEmail(String email) {

        User user = getUserByEmail(email);

        return getCart(user.getId());
    }
    public CartResponse addItemByEmail(
            String email,
            CartItemRequest request
    ) {

        User user = getUserByEmail(email);

        return addItem(
                user.getId(),
                request
        );
    }

    public CartResponse updateQuantityByEmail(
            String email,
            Long itemId,
            Integer quantity
    ) {

        User user = getUserByEmail(email);

        return updateQuantity(
                user.getId(),
                itemId,
                quantity
        );
    }

    public CartResponse removeItemByEmail(
            String email,
            Long itemId
    ) {

        User user = getUserByEmail(email);

        return removeItem(
                user.getId(),
                itemId
        );
    }

    public CartResponse getCart(Long userId){


        User user =
                userRepository.findById(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Utilisateur introuvable"
                                )
                        );


        Cart cart =
                cartRepository.findByUser(user)
                        .orElseGet(() -> {


                            Cart newCart =
                                    Cart.builder()
                                            .user(user)
                                            .build();


                            return cartRepository.save(newCart);

                        });



        return map(cart);

    }




    public CartResponse addItem(
            Long userId,
            CartItemRequest request
    ) {

        if (
                request.getQuantity() == null ||
                        request.getQuantity() <= 0
        ) {

            throw new RuntimeException(
                    "La quantité doit être supérieure à zéro"
            );
        }


        User user =
                userRepository.findById(userId)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Utilisateur introuvable"
                                )
                        );


        Cart cart =
                cartRepository.findByUser(user)
                        .orElseGet(() ->
                                cartRepository.save(
                                        Cart.builder()
                                                .user(user)
                                                .build()
                                )
                        );


        Product product =
                productRepository.findById(
                                request.getProductId()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Produit introuvable"
                                )
                        );


        /*
         * Vérification du stock
         */
        if (
                product.getInventory() == null ||
                        product.getInventory().getQuantity()
                                < request.getQuantity()
        ) {

            throw new RuntimeException(
                    "Stock insuffisant pour "
                            + product.getName()
            );
        }


        /*
         * Chercher si le produit est déjà
         * dans le panier
         */
        CartItem item =
                cartItemRepository
                        .findByCartAndProduct(
                                cart,
                                product
                        )
                        .orElse(null);


        /*
         * PRODUIT DÉJÀ DANS LE PANIER
         */
        if (item != null) {

            int newQuantity =
                    item.getQuantity()
                            + request.getQuantity();


            /*
             * Vérifier que la nouvelle quantité
             * ne dépasse pas le stock
             */
            if (
                    product.getInventory().getQuantity()
                            < newQuantity
            ) {

                throw new RuntimeException(
                        "Quantité demandée supérieure au stock disponible"
                );
            }


            item.setQuantity(newQuantity);

        }


        /*
         * NOUVEAU PRODUIT
         */
        else {

            item =
                    CartItem.builder()

                            .cart(cart)

                            .product(product)

                            .quantity(
                                    request.getQuantity()
                            )

                            .price(
                                    product.getPrice()
                            )

                            .build();
        }


        cartItemRepository.save(item);


        return map(cart);
    }




    private CartResponse map(Cart cart) {

        List<CartItemResponse> items =
                cart.getItems()
                        .stream()
                        .map(item ->
                                CartItemResponse.builder()

                                        .id(item.getId())

                                        .productId(
                                                item.getProduct().getId()
                                        )

                                        .productName(
                                                item.getProduct().getName()
                                        )

                                        .quantity(
                                                item.getQuantity()
                                        )

                                        .price(
                                                item.getPrice()
                                        )

                                        .subtotal(
                                                item.getPrice()
                                                        .multiply(
                                                                BigDecimal.valueOf(
                                                                        item.getQuantity()
                                                                )
                                                        )
                                        )

                                        .build()
                        )
                        .toList();


        BigDecimal total =
                items.stream()
                        .map(CartItemResponse::getSubtotal)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );


        return CartResponse.builder()

                .id(cart.getId())

                .items(items)

                .total(total)

                .build();
    }


    public CartResponse updateQuantity(
            Long userId,
            Long itemId,
            Integer quantity
    ){

        if(quantity <= 0){

            throw new RuntimeException(
                    "La quantité doit être supérieure à zéro"
            );
        }


        User user =
                userRepository.findById(userId)
                        .orElseThrow();



        Cart cart =
                cartRepository.findByUser(user)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Panier introuvable"
                                )
                        );


        CartItem item =
                cart.getItems()
                        .stream()
                        .filter(i ->
                                i.getId()
                                        .equals(itemId)
                        )
                        .findFirst()
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Article introuvable"
                                )
                        );


        item.setQuantity(quantity);


        cartItemRepository.save(item);


        return map(cart);

    }

    public CartResponse removeItem(
            Long userId,
            Long itemId
    ){

        User user =
                userRepository.findById(userId)
                        .orElseThrow();



        Cart cart =
                cartRepository.findByUser(user)
                        .orElseThrow();



        CartItem item =
                cart.getItems()
                        .stream()
                        .filter(i ->
                                i.getId()
                                        .equals(itemId)
                        )
                        .findFirst()
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Article introuvable"
                                )
                        );


        cart.getItems()
                .remove(item);


        cartItemRepository.delete(item);


        return map(cart);

    }

}