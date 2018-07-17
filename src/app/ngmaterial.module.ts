import {NgModule} from '@angular/core';
import {
  MatButtonModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatRippleModule,
  MatSidenavModule,
  MatSliderModule,
  MatStepperModule,
  MatTooltipModule,
  MatCheckboxModule,
  MatTabsModule,
  MatRadioModule,
  MatGridListModule
} from '@angular/material';

const modules = [
  MatButtonModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatRippleModule,
  MatSidenavModule,
  MatSliderModule,
  MatStepperModule,
  MatTooltipModule,
  MatCheckboxModule,
  MatTabsModule,
  MatRadioModule,
  MatGridListModule
];

@NgModule({
  imports: [modules],
  exports: [modules]
})
export class MaterialAppModule {
}
