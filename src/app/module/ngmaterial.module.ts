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
  MatTooltipModule
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
];

@NgModule({
  imports: [modules],
  exports: [modules]
})
export class MaterialAppModule {
}
