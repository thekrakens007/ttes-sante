// =========================================================
// QUANTITÉ D'UN PRODUIT DANS LE PANIER
// =========================================================

getProductCartQuantity(productId: number): number {

    if (!this.cart?.items) {
        return 0;
    }

    const item = this.cart.items.find((cartItem: any) => {

        // Selon la structure retournée par le backend,
        // le produit peut être directement productId
        // ou être contenu dans product.id.
        return (
            cartItem.productId === productId ||
            cartItem.product?.id === productId
        );
    });

    return item?.quantity ?? 0;
}


// =========================================================
// AJOUTER AU PANIER
// =========================================================

addToCart(product: Product): void {

    if (!this.authService.isLoggedIn()) {

        this.cartError =
            'Connectez-vous pour ajouter un produit au panier.';

        this.cartMessage = '';

        return;
    }


    if (product.stock <= 0) {

        this.cartError =
            'Ce produit est actuellement en rupture de stock.';

        this.cartMessage = '';

        return;
    }


    if (this.addingToCartId !== null) {
        return;
    }


    this.addingToCartId = product.id;

    this.cartMessage = '';

    this.cartError = '';


    this.cartService
        .addItem(product.id, 1)
        .subscribe({

            next: (cart: Cart) => {

                // Le backend retourne le panier
                // après modification.
                this.cart = cart;

                // Mise à jour du compteur global.
                this.updateCartCount();

                this.cartMessage =
                    `${product.name} a été ajouté au panier.`;

                this.addingToCartId = null;


                setTimeout(() => {

                    this.cartMessage = '';

                }, 3000);
            },


            error: (err: unknown) => {

                console.error(
                    'Erreur ajout au panier :',
                    err
                );

                this.cartError =
                    'Impossible d’ajouter ce produit au panier.';

                this.addingToCartId = null;


                setTimeout(() => {

                    this.cartError = '';

                }, 4000);
            }
        });
}
