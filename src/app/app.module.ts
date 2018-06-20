import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialAppModule } from './module/ngmaterial.module';

import { AppComponent } from './app.component';
import {ExampleDialogComponent} from './component/dialog/example-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    ExampleDialogComponent
  ],
  entryComponents: [
    ExampleDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialAppModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
