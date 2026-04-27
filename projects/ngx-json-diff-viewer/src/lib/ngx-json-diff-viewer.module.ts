import { NgModule } from '@angular/core';
import { NgxJsonDiffViewerComponent } from './ngx-json-diff-viewer.component';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";



@NgModule({
  declarations: [
    NgxJsonDiffViewerComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    NgxJsonDiffViewerComponent
  ]
})
export class NgxJsonDiffViewerModule { }
