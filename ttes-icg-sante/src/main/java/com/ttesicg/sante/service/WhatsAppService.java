package com.ttesicg.sante.service;


import com.ttesicg.sante.dto.OrderResponse;
import com.ttesicg.sante.entity.Order;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;


@Service
public class WhatsAppService {


    private final String ADMIN_NUMBER =
            "+237691085447"; // numéro WhatsApp admin


    public String generateOrderMessage(Order order) {

        StringBuilder message = new StringBuilder();

        message.append("🛒 *Nouvelle commande TTES ICG SANTE*")
                .append("\n\n");

        message.append("Commande N° : ")
                .append(order.getId())
                .append("\n\n");

        message.append("👤 Client : ")
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

        if (order.getCustomerNote() != null
                && !order.getCustomerNote().isBlank()) {

            message.append("📝 Note : ")
                    .append(order.getCustomerNote())
                    .append("\n");
        }

        message.append("\n🛍️ Produits :\n");

        order.getItems()
                .forEach(item -> {

                    message.append("- ")
                            .append(item.getProduct().getName())
                            .append(" x ")
                            .append(item.getQuantity())
                            .append(" = ")
                            .append(
                                    item.getPrice()
                                            .multiply(
                                                    BigDecimal.valueOf(
                                                            item.getQuantity()
                                                    )
                                            )
                            )
                            .append(" FCFA\n");
                });

        message.append("\n💰 Total : ")
                .append(order.getTotalAmount())
                .append(" FCFA");

        message.append("\n\n📦 Statut : ")
                .append(order.getStatus());

        return message.toString();
    }


    public String generateWhatsAppLink(Order order){


        String message =
                generateOrderMessage(order);


        return "https://wa.me/"
                + ADMIN_NUMBER
                + "?text="
                + message.replace(" ", "%20");

    }

    public String sendOrderNotification(Order order) {


        String message =
                "Nouvelle commande TTES ICG SANTE\n\n"
                        + "Commande N° : " + order.getId() + "\n"
                        + "Client : "
                        + order.getUser().getFirstName()
                        + " "
                        + order.getUser().getLastName()
                        + "\n\n"
                        + "Montant : "
                        + order.getTotalAmount()
                        + " FCFA\n\n"
                        + "Statut : "
                        + order.getStatus();


        return "https://wa.me/"
                + ADMIN_NUMBER
                + "?text="
                + URLEncoder.encode(
                message,
                StandardCharsets.UTF_8
        );
    }

    public void sendOrderToAdmin(OrderResponse order){

        String message =
                "Nouvelle commande\n"+
                        "Client : "+order.getCustomerName()+"\n"+
                        "Téléphone : "+order.getCustomerPhone();

    }

}