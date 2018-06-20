import {NgModule} from '@angular/core';
import {MatButtonModule, MatFormFieldModule, MatInputModule} from '@angular/material';
import {MatSliderModule} from '@angular/material/slider';
import {MatDialogModule} from '@angular/material/dialog';
import {MatStepperModule} from '@angular/material/stepper';


@NgModule({
  imports: [
    MatButtonModule,
    MatSliderModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule
  ],
  exports: [
    MatButtonModule,
    MatSliderModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule
  ]
})
export class MaterialAppModule { }
