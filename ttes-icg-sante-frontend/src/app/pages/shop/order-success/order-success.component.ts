import {
    Component,
    OnInit,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    ActivatedRoute,
    Router,
    RouterModule
} from '@angular/router';

import {
    OrderResponse
} from '../../../core/interfaces/order-response.interface';


@Component({
    selector: 'app-order-success',
    standalone: true,

    imports: [
        CommonModule,
        RouterModule
    ],

    templateUrl: './order-success.component.html'
})
export class OrderSuccessComponent implements OnInit {

    private route = inject(ActivatedRoute);

    private router = inject(Router);


    order: OrderResponse | null = null;

    orderId: number | null = null;


    ngOnInit(): void {

        this.orderId = Number(
            this.route.snapshot.paramMap.get('id')
        );


        const navigation =
            this.router.getCurrentNavigation();

        this.order =
            navigation?.extras?.state?.['order']
            ?? history.state?.order
            ?? null;

    }


    formatPrice(price: number): string {

        return new Intl.NumberFormat(
            'fr-FR'
        ).format(price) + ' FCFA';

    }


    goToShop(): void {

        this.router.navigate(['/']);

    }


    goToCart(): void {

        this.router.navigate(['/cart']);

    }


    goToProfile(): void {

        this.router.navigate(['/profile']);

    }


    goToOrders(): void {

        this.router.navigate(['/my-orders']);

    }

}