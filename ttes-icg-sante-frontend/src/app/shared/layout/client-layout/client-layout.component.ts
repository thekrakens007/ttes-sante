import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClientHeaderComponent } from '../../components/client/client-header/client-header.component';

@Component({
    selector: 'app-client-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        ClientHeaderComponent
    ],
    templateUrl: './client-layout.component.html',
})
export class ClientLayoutComponent {
}