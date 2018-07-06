import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialAppModule} from './ngmaterial.module';

import {AppComponent} from './app.component';
import {ExampleDialogComponent} from './component/dialog/example-dialog.component';
import {SimulationSetupService} from './service/simulation.setup.service';
import {SimulationService} from './service/simulation.service';
import {UtilService} from './service/util.service';
import {InputComponent} from './component/input/input.component';
import {ContentComponent} from './component/content/content.component';
import {SimulationViewerComponent} from './component/simulation-viewer/simulation.viewer.component';
import {DatePipe} from './pipe/date/date.pipe';

@NgModule({
  declarations: [
    AppComponent,
    ExampleDialogComponent,
    SimulationViewerComponent,
    InputComponent,
    ContentComponent,
    DatePipe,
  ],
  entryComponents: [
    ExampleDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialAppModule,
    FlexLayoutModule
  ],
  providers: [
    SimulationSetupService,
    SimulationService,
    UtilService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
