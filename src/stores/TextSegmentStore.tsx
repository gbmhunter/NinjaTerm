import { makeAutoObservable } from 'mobx';

export default class TextSegment {
  text: string = '';

  color: string = '';

  key: number;

  constructor(text: string, color: string, key: number) {
    makeAutoObservable(this);
    this.text = text;
    this.color = color;
    this.key = key;
  }
}
