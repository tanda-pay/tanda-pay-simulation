import {Injectable} from '@angular/core';

@Injectable()
export class UtilService {

  constructor() {
  }

  flatten(array) {
    let flat = [];
    for (let i = 0, l = array.length; i < l; i++) {
      const type = Object.prototype.toString.call(array[i]).split(' ').pop().split(']').shift().toLowerCase();
      if (type) {
        flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? this.flatten(array[i]) : array[i]);
      }
    }
    return flat;
  }
}
