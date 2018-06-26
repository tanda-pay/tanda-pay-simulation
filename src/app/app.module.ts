import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialAppModule} from './ngmaterial.module';
import {MatInputModule} from '@angular/material/input';

import {AppComponent} from './app.component';
import {ExampleDialogComponent} from './component/dialog/example-dialog.component';
import {PolicyHolderGenerationService} from './service/policy-holder-generation.service';
import {SimulationService} from './service/simulation.service';
import {UtilService} from './service/util.service';
import {InputComponent} from './component/input/input.component';
import {ContentComponent} from './component/content/content.component';

@NgModule({
  declarations: [
    AppComponent,
    ExampleDialogComponent,
    InputComponent,
    ContentComponent,
  ],
  entryComponents: [
    ExampleDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialAppModule
  ],
  providers: [
    PolicyHolderGenerationService,
    SimulationService,
    UtilService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
