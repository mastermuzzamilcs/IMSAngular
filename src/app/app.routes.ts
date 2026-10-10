import { Routes } from '@angular/router';
import { UserRolesResolver } from './core/Resolvers/UserRolesResolver';
import { BranchResolver } from './core/Resolvers/BranchResolver';
import { privileges } from './core/auth/privilege-catalog';
import { authGuard } from './core/guards/auth.guard';
import { privilegeGuard } from './core/guards/privilege.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/auth/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [privilegeGuard],
        data: { privilege: privileges.dashboard.page },
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'branches',
        canActivate: [privilegeGuard],
        data: { privilege: privileges.branches.page },
        loadChildren: () =>
          import('./features/branches/branches.module').then((m) => m.BranchesModule),
        resolve: { roles: UserRolesResolver },
      },
      {
        path: 'inventory',
        children: [
          {
            path: '',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.inventory.page },
            loadComponent: () =>
              import('./features/inventory/list/inventory-list.component').then(
                (m) => m.InventoryListComponent,
              ),
          },
          {
            path: 'stock-in',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.stockIn.page },
            loadComponent: () =>
              import('./features/inventory/stock-in/stock-in.component').then(
                (m) => m.StockInComponent,
              ),
          },
          {
            path: 'stock-out',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.stockOut.page },
            loadComponent: () =>
              import('./features/inventory/stock-out/stock-out.component').then(
                (m) => m.StockOutComponent,
              ),
          },
        ],
      },
      {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.module').then((m) => m.SalesModule),
      },
      {
        path: 'reports',
        canActivate: [privilegeGuard],
        data: { privilege: privileges.reports.page },
        loadChildren: () =>
          import('./features/reports/reports.module').then((m) => m.ReportsModule),
      },
      {
        path: 'requests',
        children: [
          {
            path: '',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.workflowRequests.page },
            loadComponent: () =>
              import('./features/RequestManagement/request-management/request-management.component').then(
                (m) => m.RequestManagementComponent,
              ),
          },
          {
            path: 'new-transfer',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.newTransfer.page },
            loadComponent: () =>
              import('./features/RequestManagement/new-transfer-request/new-transfer-request.component').then(
                (m) => m.NewTransferRequestComponent,
              ),
          },
        ],
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.users.page },
            loadComponent: () =>
              import('./features/users/list/user-list.component').then((m) => m.UserListComponent),
          },
          {
            path: 'roles',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.roles.page },
            loadComponent: () =>
              import('./features/users/roles/roles.component').then((m) => m.RolesComponent),
          },
          {
            path: 'groups',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.userGroups.page },
            loadComponent: () =>
              import('./features/users/groups/user-groups.component').then(
                (m) => m.UserGroupsComponent,
              ),
          },
          {
            path: 'group-associations',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.groupAssociations.page },
            loadComponent: () =>
              import('./features/users/group-associations/group-associations.component').then(
                (m) => m.GroupAssociationsComponent,
              ),
          },
          {
            path: 'group-privileges',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.groupPrivileges.page },
            loadComponent: () =>
              import('./features/users/group-privileges/group-privileges.component').then(
                (m) => m.GroupPrivilegesComponent,
              ),
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
            canActivate: [privilegeGuard],
            data: { privilege: privileges.products.page },
            loadComponent: () =>
              import('./features/setup/products-setup/products-setup.component').then(
                (m) => m.ProductsSetupComponent,
              ),
          },
          {
            path: 'vendor',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.vendors.page },
            loadComponent: () =>
              import('./features/setup/vendor-setup/vendor-setup.component').then(
                (m) => m.VendorSetupComponent,
              ),
          },
          {
            path: 'customers',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.customers.page },
            loadComponent: () =>
              import('./features/setup/customer-setup/customer-setup.component').then(
                (m) => m.CustomerSetupComponent,
              ),
          },
          {
            path: 'brand',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.brands.page },
            loadComponent: () =>
              import('./features/setup/brand-setup/brand-setup.component').then(
                (m) => m.BrandSetupComponent,
              ),
          },
          {
            path: 'workflow-transitions',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.workflowTransitions.page },
            loadComponent: () =>
              import('./features/setup/workflow-transitions/workflow-transitions.component').then(
                (m) => m.WorkflowTransitionsComponent,
              ),
          },
          {
            path: 'notification-templates',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.notificationTemplates.page },
            loadComponent: () =>
              import('./features/setup/notification-templates/notification-templates.component').then(
                (m) => m.NotificationTemplatesComponent,
              ),
          },
          {
            path: 'item-sources',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.itemSources.page },
            loadComponent: () =>
              import('./features/setup/item-sources/item-sources.component').then(
                (m) => m.ItemSourcesComponent,
              ),
          },
          {
            path: 'workflow-functions',
            canActivate: [privilegeGuard],
            data: { privilege: privileges.workflowFunctions.page },
            loadComponent: () =>
              import('./features/setup/workflow-functions/workflow-functions.component').then(
                (m) => m.WorkflowFunctionsComponent,
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
    ],
  },
];
