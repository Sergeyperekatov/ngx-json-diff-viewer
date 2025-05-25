import { NgModule } from '@angular/core';
import { NgxJsonDiffViewerComponent } from './ngx-json-diff-viewer.component';
import {CommonModule} from "@angular/common";



@NgModule({
  declarations: [
    NgxJsonDiffViewerComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    NgxJsonDiffViewerComponent
  ]
})
export class NgxJsonDiffViewerModule { }
