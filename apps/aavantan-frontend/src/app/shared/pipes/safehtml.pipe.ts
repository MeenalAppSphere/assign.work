import { DomSanitizer } from '@angular/platform-browser';
import { Pipe } from '@angular/core';

@Pipe({name: 'safeHtml'})
export class Safe {
  constructor(private sanitizer:DomSanitizer){}

  transform(value: any, args?: any): any {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
