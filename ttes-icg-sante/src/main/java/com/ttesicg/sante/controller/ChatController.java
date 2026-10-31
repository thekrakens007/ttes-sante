
package com.ttesicg.sante.controller;

import com.ttesicg.sante.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ChatResponse sendMessage(@Valid @RequestBody ChatRequest request) {
        String reply = chatService.sendMessage(
                request.message(),
                request.sessionId()
        );

        return new ChatResponse(reply);
    }

    public record ChatRequest(

            @NotBlank(message = "Le message ne peut pas être vide.")
            @Size(max = 2000, message = "Le message ne doit pas dépasser 2000 caractères.")
            String message,

            @NotBlank(message = "L'identifiant de session est obligatoire.")
            @Size(max = 100, message = "L'identifiant de session est trop long.")
            String sessionId

    ) {}

    public record ChatResponse(String reply) {}
}
