package com.ttesicg.sante.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(
            @Value("${google.client-id}") String clientId
    ) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public GoogleIdToken.Payload verify(String idTokenString) {

        try {

            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken == null) {
                throw new RuntimeException(
                        "Token Google invalide"
                );
            }

            GoogleIdToken.Payload payload =
                    idToken.getPayload();

            if (!Boolean.TRUE.equals(
                    payload.getEmailVerified()
            )) {
                throw new RuntimeException(
                        "L'adresse email Google n'est pas vérifiée"
                );
            }

            return payload;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Échec de la vérification du token Google",
                    e
            );
        }
    }
}