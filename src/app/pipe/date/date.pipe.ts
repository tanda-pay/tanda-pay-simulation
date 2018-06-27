import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {

  transform(unixTime: number): string {
    if (unixTime != null) {
      return new Date(unixTime).toDateString();
    } else {
      return 'undefined';
    }
  }
}
