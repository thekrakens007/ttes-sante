import { Component, OnInit } from '@angular/core';
import {
    ActivatedRoute,
    Router,
    RouterModule
} from '@angular/router';

@Component({
    selector: 'app-signup-success',
    imports: [
        RouterModule
    ],
    templateUrl: './signup-success.component.html',
    styles: ``
})
export class SignupSuccessComponent implements OnInit {

    email = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {

        this.email =
            this.route.snapshot.queryParamMap.get('email') || '';

        /*
         * Si quelqu'un accède directement à /signup-success
         * sans passer par l'inscription, on peut le renvoyer
         * vers la page d'inscription.
         */

        if (!this.email) {

            this.router.navigate(['/signup']);

        }
    }

    goToLogin(): void {

        this.router.navigate(['/signin']);

    }
}