
package com.ttesicg.sante.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Slf4j
@Service
public class ChatService {

    private final RestClient restClient;
    private final String webhookUrl;

    public ChatService(
            RestClient.Builder restClientBuilder,
            @Value("${n8n.webhook-url}") String webhookUrl
    ) {
        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(60_000);

        this.restClient = restClientBuilder
                .requestFactory(factory)
                .build();

        this.webhookUrl = webhookUrl;
    }

    public String sendMessage(String message, String sessionId) {


        try {
            JsonNode response = restClient.post()
                    .uri(webhookUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(
                            new MediaType("application", "json", java.nio.charset.StandardCharsets.UTF_8)
                    )
                    .body(Map.of(
                            "message", message,
                            "sessionId", sessionId
                    ))
                    .retrieve()
                    .body(JsonNode.class);


            if (response == null
                    || !response.hasNonNull("reply")
                    || !response.get("reply").isTextual()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "La réponse reçue de n8n est invalide."
                );
            }

            return response.get("reply").asText();

        } catch (RestClientException exception) {

            log.error(
                    "Échec de l'appel n8n : {}",
                    exception.getMessage(),
                    exception
            );

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Impossible de joindre le service n8n.",
                    exception
            );
        }
    }
}
