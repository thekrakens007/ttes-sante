package com.ttesicg.sante.service;

import com.ttesicg.sante.dto.CartItemRequest;
import com.ttesicg.sante.dto.CartItemResponse;
import com.ttesicg.sante.dto.CartResponse;
import com.ttesicg.sante.entity.Cart;
import com.ttesicg.sante.entity.CartItem;
import com.ttesicg.sante.entity.Product;
import com.ttesicg.sante.entity.ProductBundle;
import com.ttesicg.sante.entity.BundleItem;
import com.ttesicg.sante.entity.User;
import com.ttesicg.sante.repository.BundleItemRepository;
import com.ttesicg.sante.repository.CartItemRepository;
import com.ttesicg.sante.repository.CartRepository;
import com.ttesicg.sante.repository.ProductBundleRepository;
import com.ttesicg.sante.repository.ProductRepository;
import com.ttesicg.sante.repository.UserRepository;

import jakarta.transaction.Transactional;
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
    private final ProductBundleRepository bundleRepository;
    private final BundleItemRepository bundleItemRepository;
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

    public CartResponse getCart(Long userId) {

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

    @Transactional
    public CartResponse addItem(
            Long userId,
            CartItemRequest request
    ) {

        if (request.getQuantity() == null
                || request.getQuantity() <= 0) {

            throw new RuntimeException(
                    "La quantité doit être supérieure à zéro"
            );
        }

        /*
         * Il faut obligatoirement choisir
         * soit un produit, soit un pack.
         */
        if (request.getProductId() == null
                && request.getBundleId() == null) {

            throw new RuntimeException(
                    "Vous devez sélectionner un produit ou un pack"
            );
        }

        /*
         * Impossible d'envoyer les deux.
         */
        if (request.getProductId() != null
                && request.getBundleId() != null) {

            throw new RuntimeException(
                    "Un article ne peut pas être à la fois un produit et un pack"
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

        /*
         * ============================
         * AJOUT D'UN PRODUIT
         * ============================
         */
        if (request.getProductId() != null) {

            return addProductToCart(
                    cart,
                    request
            );
        }

        /*
         * ============================
         * AJOUT D'UN PACK
         * ============================
         */
        return addBundleToCart(
                cart,
                request
        );
    }

    private CartResponse addProductToCart(
            Cart cart,
            CartItemRequest request
    ) {

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
         * Vérification du stock.
         */
        if (product.getInventory() == null
                || product.getInventory().getQuantity()
                < request.getQuantity()) {

            throw new RuntimeException(
                    "Stock insuffisant pour "
                            + product.getName()
            );
        }

        /*
         * Chercher si le produit
         * existe déjà dans le panier.
         */
        CartItem item =
                cartItemRepository
                        .findByCartAndProduct(
                                cart,
                                product
                        )
                        .orElse(null);

        if (item != null) {

            int newQuantity =
                    item.getQuantity()
                            + request.getQuantity();

            if (product.getInventory().getQuantity()
                    < newQuantity) {

                throw new RuntimeException(
                        "Quantité demandée supérieure au stock disponible"
                );
            }

            item.setQuantity(newQuantity);

        } else {

            item =
                    CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .bundle(null)
                            .quantity(request.getQuantity())
                            .price(product.getPrice())
                            .build();
        }

        cartItemRepository.save(item);

        return map(cart);
    }

    private CartResponse addBundleToCart(
            Cart cart,
            CartItemRequest request
    ) {

        ProductBundle bundle =
                bundleRepository.findById(
                                request.getBundleId()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Pack introuvable"
                                )
                        );

        /*
         * Un pack inactif ne peut pas être
         * ajouté au panier.
         */
        if (!Boolean.TRUE.equals(bundle.getActive())) {

            throw new RuntimeException(
                    "Ce pack n'est plus disponible"
            );
        }

        /*
         * Vérifier le stock calculé du pack.
         */
        int availableStock =
                calculateBundleStock(bundle);

        if (availableStock < request.getQuantity()) {

            throw new RuntimeException(
                    "Stock insuffisant pour le pack "
                            + bundle.getName()
            );
        }

        /*
         * Chercher si le pack existe déjà
         * dans le panier.
         */
        CartItem item =
                cartItemRepository
                        .findByCartAndBundle(
                                cart,
                                bundle
                        )
                        .orElse(null);

        if (item != null) {

            int newQuantity =
                    item.getQuantity()
                            + request.getQuantity();

            if (availableStock < newQuantity) {

                throw new RuntimeException(
                        "Quantité demandée supérieure au stock disponible pour le pack"
                );
            }

            item.setQuantity(newQuantity);

        } else {

            item =
                    CartItem.builder()
                            .cart(cart)
                            .product(null)
                            .bundle(bundle)
                            .quantity(request.getQuantity())
                            .price(bundle.getPrice())
                            .build();
        }

        cartItemRepository.save(item);

        return map(cart);
    }

    /*
     * Calcule combien de packs peuvent
     * réellement être constitués.
     *
     * Exemple :
     *
     * Produit A : 10 / 2 = 5
     * Produit B : 7  / 1 = 7
     * Produit C : 20 / 3 = 6
     *
     * Stock du pack = 5
     */
    private int calculateBundleStock(
            ProductBundle bundle
    ) {

        List<BundleItem> items =
                bundleItemRepository
                        .findByBundleId(bundle.getId());

        if (items == null || items.isEmpty()) {
            return 0;
        }

        int stockPack = Integer.MAX_VALUE;

        for (BundleItem item : items) {

            Product product =
                    item.getProduct();

            int productStock = 0;

            if (product.getInventory() != null) {
                productStock =
                        product.getInventory().getQuantity();
            }

            int quantityRequired =
                    item.getQuantity();

            int possiblePacks =
                    productStock / quantityRequired;

            stockPack =
                    Math.min(
                            stockPack,
                            possiblePacks
                    );
        }

        return stockPack == Integer.MAX_VALUE
                ? 0
                : stockPack;
    }

    private CartResponse map(Cart cart) {

        List<CartItemResponse> items =
                cart.getItems()
                        .stream()
                        .map(this::mapItem)
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

    private CartItemResponse mapItem(
            CartItem item
    ) {

        BigDecimal subtotal =
                item.getPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        item.getQuantity()
                                )
                        );

        /*
         * Article = PRODUIT
         */
        if (item.getProduct() != null) {

            Product product =
                    item.getProduct();

            return CartItemResponse.builder()
                    .id(item.getId())
                    .productId(product.getId())
                    .productName(product.getName())
                    .bundleId(null)
                    .bundleName(null)
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .subtotal(subtotal)
                    .build();
        }

        /*
         * Article = PACK
         */
        if (item.getBundle() != null) {

            ProductBundle bundle =
                    item.getBundle();

            return CartItemResponse.builder()
                    .id(item.getId())
                    .productId(null)
                    .productName(null)
                    .bundleId(bundle.getId())
                    .bundleName(bundle.getName())
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .subtotal(subtotal)
                    .build();
        }

        throw new RuntimeException(
                "Article du panier invalide"
        );
    }

    @Transactional
    public CartResponse updateQuantity(
            Long userId,
            Long itemId,
            Integer quantity
    ) {

        if (quantity == null || quantity <= 0) {

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

        /*
         * Produit
         */
        if (item.getProduct() != null) {

            Product product =
                    item.getProduct();

            if (product.getInventory() == null
                    || product.getInventory().getQuantity()
                    < quantity) {

                throw new RuntimeException(
                        "Stock insuffisant pour "
                                + product.getName()
                );
            }
        }

        /*
         * Pack
         */
        if (item.getBundle() != null) {

            int availableStock =
                    calculateBundleStock(
                            item.getBundle()
                    );

            if (availableStock < quantity) {

                throw new RuntimeException(
                        "Stock insuffisant pour le pack "
                                + item.getBundle().getName()
                );
            }
        }

        item.setQuantity(quantity);

        cartItemRepository.save(item);

        return map(cart);
    }

    @Transactional
    public CartResponse removeItem(
            Long userId,
            Long itemId
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