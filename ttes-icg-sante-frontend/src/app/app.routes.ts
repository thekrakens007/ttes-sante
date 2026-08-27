import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import {authGuard} from "./core/guards/auth.guard";
import {UsersComponent} from "./pages/users/users.component";
import {ProductsComponent} from "./pages/products/products.component";
import {CreateProductComponent} from "./pages/admin/products/product-form/create-product.component";
import {CategoryFormPageComponent} from "./pages/categories/category-form-page.component";
import {CategoriesComponent} from "./pages/categories/categories.component";
import {CompaniesComponent} from "./pages/admin/companies/companies.component";
import {CompanyFormComponent} from "./pages/admin/companies/company-form/company-form.component";
import {TherapeuticAreasComponent} from "./pages/admin/therapeutic-areas/therapeutic-areas.component";
import {TherapeuticAreaEditComponent} from "./pages/admin/therapeutic-areas/therapeutic-area-edit.component";
import {TherapeuticAreaCreateComponent} from "./pages/admin/therapeutic-areas/therapeutic-area-create.component";
import { InventoriesComponent } from "./pages/admin/inventories/inventories.component";
import {InventoryEditComponent} from "./pages/admin/inventories/inventory-edit.component";
import {OrdersComponent} from "./pages/orders/orders.component";
import {ClientLayoutComponent} from "./shared/layout/client-layout/client-layout.component";
import {HomeComponent} from "./pages/client/home/home.component";
import {CartComponent} from "./pages/shop/cart/cart.component";
import {ShopHomeComponent} from "./pages/shop/home/shop-home.component";
import {CheckoutComponent} from "./pages/shop/checkout/checkout.component";
import {OrderSuccessComponent} from "./pages/shop/order-success/order-success.component";
import {MyOrdersComponent} from "./pages/shop/my-orders/my-orders.component";
import {adminGuard} from "./core/guards/admin.guard";
import {ProductDetailComponent} from "./pages/shop/product-detail/product-detail.component";
import {CompanyListComponent} from "./pages/shop/company-list/company-list.component";
import {CompanyDetailComponent} from "./pages/shop/company-detail/company-detail.component";

export const routes: Routes = [
  // =====================================================
  // ESPACE CLIENT PUBLIC
  // =====================================================

  {
    path: '',
    component: ShopHomeComponent,
    title: 'TTES-ICG Santé - Boutique'
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'companies',
    component: CompanyListComponent
  },

  {
    path: 'companies/:id',
    component: CompanyDetailComponent
  },
  {
    path: 'products/:id',
    component: ProductDetailComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
    title: 'Finaliser la commande'
  },

  {
    path: 'order-success/:id',
    component: OrderSuccessComponent,
    canActivate: [authGuard],
    title: 'Commande confirmée'
  },

  {
    path: 'my-orders',
    component: MyOrdersComponent,
    canActivate: [authGuard],
    title: 'Mes commandes'
  },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard],
    title: 'Mon panier'
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
    title: 'Finaliser la commande'
  },

  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [authGuard],
    title: 'Mes commandes'
  },

  {
    path: 'admin',
    component: AppLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [

      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'orders',
        component: OrdersComponent,
        title: 'Gestion des commandes'
      },
      {
        path: 'inventories',
        component: InventoriesComponent,
        title: 'Gestion des stocks'
      },
      {
        path: 'inventories/:productId/edit',
        component: InventoryEditComponent,
        title: 'Modifier le stock'
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        title: 'Gestion des catégories'
      },

      {
        path: 'categories/new',
        component: CategoryFormPageComponent,
        title: 'Nouvelle catégorie'
      },
      {
        path: 'companies',
        component: CompaniesComponent,
        title: 'Gestion des entreprises'
      },

      {
        path: 'therapeutic-areas',
        component: TherapeuticAreasComponent
      },
      {
        path: 'therapeutic-areas/new',
        component: TherapeuticAreaCreateComponent
      },
      {
        path: 'therapeutic-areas/:id/edit',
        component: TherapeuticAreaEditComponent
      },
      {
        path: 'companies/new',
        component: CompanyFormComponent
      },
      {
        path: 'companies/:id/edit',
        component: CompanyFormComponent
      },
      {
        path: 'categories/edit/:id',
        component: CategoryFormPageComponent,
        title: 'Modifier une catégorie'
      },
      {
        path: 'products/new',
        component: CreateProductComponent
      },

      {
        path: 'products/edit/:id',
        component: CreateProductComponent
      },
      {
        path: 'products',
        component: ProductsComponent,
        title: 'Gestion des produits'
      },
      {
        path: 'users',
        component: UsersComponent,
        title: 'Gestion des utilisateurs'
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
    ]
  },
  // =====================================================
  // AUTHENTIFICATION
  // =====================================================
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Connexion'
  },

  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Créer un compte'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
