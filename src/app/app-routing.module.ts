import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

const routes: Routes = [
  {
    path: "blog",
    loadChildren: () => import("./blog/blog.module").then((m) => m.BlogModule),
  },
  {
    path: "",
    loadChildren: () => import("./home/home.module").then((m) => m.HomeModule),
  },
  {
    path: "contact",
    loadChildren: () =>
      import("./contact/contact.module").then((m) => m.ContactModule),
  },
  {
    path: "webcomponents",
    loadChildren: () =>
      import("./workshop/workshop.module").then((m) => m.WorkshopModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
