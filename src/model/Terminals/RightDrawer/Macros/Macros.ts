import { makeAutoObservable } from 'mobx';

export class Macro {
  name: string;
  data: string;

  constructor(name: string, data: string) {
    this.name = name;
    this.data = data;

    makeAutoObservable(this); // Make sure this near the end
  }

}

export class Macros {

  macrosArray: Macro[] = [];

  constructor() {

    for (let i = 0; i < 3; i++) {
      this.macrosArray.push(new Macro(`M${i}`, ''));
    }

    makeAutoObservable(this); // Make sure this near the end
  }
}