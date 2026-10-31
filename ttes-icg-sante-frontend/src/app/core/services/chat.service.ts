
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
    reply: string;
}

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private readonly http = inject(HttpClient);

    private readonly sessionId = this.getOrCreateSessionId();

    private getOrCreateSessionId(): string {
        const storageKey = 'ttes-icg-chat-session-id';

        let sessionId = sessionStorage.getItem(storageKey);

        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem(storageKey, sessionId);
        }

        return sessionId;
    }

    sendMessage(message: string): Observable<ChatResponse> {
        return this.http.post<ChatResponse>('/api/chat', {
            message,
            sessionId: this.sessionId,
        });
    }
}
