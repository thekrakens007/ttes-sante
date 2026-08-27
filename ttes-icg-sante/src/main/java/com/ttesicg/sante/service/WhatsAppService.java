package com.ttesicg.sante.service;

import com.ttesicg.sante.entity.Order;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class WhatsAppService {

    /**
     * Numéro WhatsApp de l'administration.
     *
     * IMPORTANT :
     * format international sans +
     * Exemple Cameroun : 237691085447
     */
    private final String ADMIN_NUMBER = "237691085447";


    // ==========================================================
    // GENERER LE MESSAGE DE COMMANDE
    // ==========================================================

    public String generateOrderMessage(Order order) {

        StringBuilder message = new StringBuilder();

        message.append("🛒 *NOUVELLE COMMANDE TTES-ICG SANTE*")
                .append("\n\n");


        // ======================================================
        // COMMANDE
        // ======================================================

        message.append("📦 *Commande N° :* ")
                .append(order.getId())
                .append("\n");

        message.append("📌 *Statut :* ")
                .append(order.getStatus())
                .append("\n\n");


        // ======================================================
        // CLIENT
        // ======================================================

        message.append("👤 *CLIENT*")
                .append("\n");

        message.append("Nom : ")
                .append(order.getUser().getFirstName())
                .append(" ")
                .append(order.getUser().getLastName())
                .append("\n");

        message.append("📱 Téléphone : ")
                .append(order.getUser().getPhone())
                .append("\n");

        message.append("📧 Email : ")
                .append(order.getUser().getEmail())
                .append("\n");

        message.append("📍 Adresse : ")
                .append(order.getDeliveryAddress())
                .append("\n");


        // ======================================================
        // NOTE CLIENT
        // ======================================================

        if (order.getCustomerNote() != null
                && !order.getCustomerNote().isBlank()) {

            message.append("📝 Note : ")
                    .append(order.getCustomerNote())
                    .append("\n");
        }


        // ======================================================
        // PRODUITS
        // ======================================================

        message.append("\n")
                .append("🛍️ *PRODUITS*")
                .append("\n\n");


        order.getItems().forEach(item -> {

            BigDecimal subtotal =
                    item.getPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            item.getQuantity()
                                    )
                            );

            message.append("• ")
                    .append(item.getProduct().getName())
                    .append("\n");

            message.append("  Quantité : ")
                    .append(item.getQuantity())
                    .append("\n");

            message.append("  Prix unitaire : ")
                    .append(item.getPrice())
                    .append(" FCFA")
                    .append("\n");

            message.append("  Sous-total : ")
                    .append(subtotal)
                    .append(" FCFA")
                    .append("\n\n");
        });


        // ======================================================
        // TOTAL
        // ======================================================

        message.append("💰 *TOTAL :* ")
                .append(order.getTotalAmount())
                .append(" FCFA")
                .append("\n\n");


        message.append("📦 *Statut :* ")
                .append(order.getStatus());


        return message.toString();
    }


    // ==========================================================
    // GENERER LE LIEN WHATSAPP
    // ==========================================================

    public String generateWhatsAppLink(Order order) {

        String message =
                generateOrderMessage(order);


        String encodedMessage =
                URLEncoder.encode(
                        message,
                        StandardCharsets.UTF_8
                );


        return "https://wa.me/"
                + ADMIN_NUMBER
                + "?text="
                + encodedMessage;
    }

}