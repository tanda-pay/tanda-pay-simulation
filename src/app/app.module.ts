import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialAppModule} from './ngmaterial.module';

import {AppComponent} from './app.component';
import {SimulationSetupService} from './service/simulation.setup.service';
import {TandapaySimulationService} from './service/tandapay.simulation.service';
import {InputComponent} from './component/input/input.component';
import {ContentComponent} from './component/content/content.component';
import {SimulationViewerComponent} from './component/simulation-viewer/simulation.viewer.component';
import {UnitySimulationService} from './service/unity.simulation.service';
import {ScenarioSelectionComponent} from './component/scenario-selection/scenario.selection.component';

@NgModule({
  declarations: [
    AppComponent,
    SimulationViewerComponent,
    ScenarioSelectionComponent,
    InputComponent,
    ContentComponent,
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
    TandapaySimulationService,
    UnitySimulationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
