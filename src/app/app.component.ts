import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ExampleDialogComponent} from './component/dialog/example-dialog.component';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PolicyHolderGenerationService} from './service/policy-holder-generation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  animal: string;
  name: string;

  isLinear = false;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;

  constructor(public dialog: MatDialog,
              private _formBuilder: FormBuilder,
              private policyHolderGeneratorService: PolicyHolderGenerationService) {}

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required]
    });

    console.log(this.policyHolderGeneratorService.generatePolicyholders(100, 50, 5.5, 1, 7, 100000, .05, .01, .03));
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ExampleDialogComponent, {
      width: '250px',
      data: { name: this.name, animal: this.animal }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.animal = result;
    });
  }
}
