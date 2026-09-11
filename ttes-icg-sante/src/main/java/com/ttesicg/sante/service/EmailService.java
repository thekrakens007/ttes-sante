package com.ttesicg.sante.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.mail.from}")
    private String from;

    public void sendVerificationEmail(String to, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Vérifiez votre adresse email - TTES Santé");
        message.setText(
                "Bonjour,\n\n" +
                        "Merci de vous être inscrit sur TTES Santé.\n" +
                        "Confirmez votre adresse email en cliquant sur ce lien :\n\n" +
                        link + "\n\n" +
                        "Ce lien est valable 24 heures."
        );
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Réinitialisation de votre mot de passe - TTES Santé");
        message.setText(
                "Bonjour,\n\n" +
                        "Vous avez demandé la réinitialisation de votre mot de passe.\n" +
                        "Cliquez sur ce lien pour en choisir un nouveau :\n\n" +
                        link + "\n\n" +
                        "Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
        );
        mailSender.send(message);
    }
}