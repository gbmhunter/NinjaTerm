import { makeAutoObservable } from 'mobx';

export default class TextSegment {
  text: string = '';

  color: string = '';

  key: number;

  constructor(text: string, color: string, key: number) {
    this.text = text;
    this.color = color;
    this.key = key;
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}
