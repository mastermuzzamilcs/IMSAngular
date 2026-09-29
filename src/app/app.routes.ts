import { Routes } from '@angular/router';
import { UserRolesResolver } from './core/Resolvers/UserRolesResolver';
import { BranchResolver } from './core/Resolvers/BranchResolver';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'branches',
    loadChildren: () => import('./features/branches/branches.module').then((m) => m.BranchesModule),
    resolve: { roles: UserRolesResolver },
  },
  {
    path: 'inventory',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/inventory/list/inventory-list.component').then(
            (m) => m.InventoryListComponent,
          ),
      },
      {
        path: 'stock-in',
        loadComponent: () =>
          import('./features/inventory/stock-in/stock-in.component').then(
            (m) => m.StockInComponent,
          ),
      },
      {
        path: 'stock-out',
        loadComponent: () =>
          import('./features/inventory/stock-out/stock-out.component').then(
            (m) => m.StockOutComponent,
          ),
      },
    ],
  },
  {
    path: 'transfers',
    loadChildren: () =>
      import('./features/transfers/transfers.module').then((m) => m.TransfersModule),
  },
  {
    path: 'sales',
    loadChildren: () => import('./features/sales/sales.module').then((m) => m.SalesModule),
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.module').then((m) => m.ReportsModule),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./features/RequestManagement/request-management/request-management.component').then(
        (m) => m.RequestManagementComponent,
      ),
  },
  {
    path: 'users',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/users/list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/users/roles/roles.component').then((m) => m.RolesComponent),
      },
    ],
    resolve: { roles: UserRolesResolver, branches: BranchResolver },
  },
  {
    path: 'setup',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'products',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/setup/products-setup/products-setup.component').then(
            (m) => m.ProductsSetupComponent,
          ),
      },
      {
        path: 'vendor',
        loadComponent: () =>
          import('./features/setup/vendor-setup/vendor-setup.component').then(
            (m) => m.VendorSetupComponent,
          ),
      },
      {
        path: 'brand',
        loadComponent: () =>
          import('./features/setup/brand-setup/brand-setup.component').then(
            (m) => m.BrandSetupComponent,
          ),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
