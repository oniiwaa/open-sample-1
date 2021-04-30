import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { LoginComponent } from '@app/login/login.component';
import { AppComponent } from '@app/app.component';
import { MenuComponent } from '@app/menu/menu.component';
import { GoodsListComponent } from '@app/goods/goods-list/goods-list.component';
import { GoodsDetailsComponent } from '@app/goods/goods-details/goods-details.component';
import { GoodsUpdateComponent } from '@app/goods/goods-update/goods-update.component';
import { GoodsCreateComponent } from '@app/goods/goods-create/goods-create.component';
import { Login2Component } from '@app/login2/login2.component';
import { RedirectComponent } from '@app/redirect/redirect.component';
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'prefix' },
  { path: 'goods', component: MenuComponent },
  { path: 'goods/create', component: GoodsCreateComponent },
  { path: 'goods/update', component: GoodsUpdateComponent },
  { path: 'goods/details', component: GoodsDetailsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'goods/list', component: GoodsListComponent },
  { path: 'user/authorize', component: Login2Component },
  { path: 'redirect', component: RedirectComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
