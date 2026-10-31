
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

@Component({
    selector: 'app-chat-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-widget.component.html',
    styleUrl: './chat-widget.component.css',
})
export class ChatWidgetComponent {
    private readonly chatService = inject(ChatService);

    @ViewChild('messageList')
    private messageList?: ElementRef<HTMLDivElement>;

    isOpen = false;
    isLoading = false;
    message = '';
    errorMessage = '';

    messages: ChatMessage[] = [
        {
            role: 'assistant',
            text: 'Bonjour ! Bienvenue chez TTES-ICG Santé. Comment puis-je vous aider ?',
        },
    ];

    toggleChat(): void {
        this.isOpen = !this.isOpen;
        this.errorMessage = '';
    }

    sendMessage(): void {
        const text = this.message.trim();

        if (!text || this.isLoading) {
            return;
        }

        this.messages.push({ role: 'user', text });
        this.message = '';
        this.errorMessage = '';
        this.isLoading = true;

        this.chatService
            .sendMessage(text)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (response) => {
                    this.messages.push({
                        role: 'assistant',
                        text: response.reply,
                    });
                    this.scrollToBottom();
                },
                error: (error) => {
                    console.error('Erreur du chatbot :', error);

                    this.errorMessage =
                        'Impossible de contacter notre assistant. Veuillez réessayer.';

                    this.scrollToBottom();
                },
            });

        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            const element = this.messageList?.nativeElement;

            if (element) {
                element.scrollTop = element.scrollHeight;
            }
        }, 0);
    }
}
