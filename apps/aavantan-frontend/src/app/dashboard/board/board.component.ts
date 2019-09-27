import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'aavantan-app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

  tasksData=true;

  itemStringsTODO = [
    'Some quick example text to build on the card title and make up the bulk of the card\'s content',
    'Task 2',
    'Task 3',
    'Task 4',
    'Some quick example text to build on the card title and make up the bulk of the card\'s content',
    'Task 6',
    'Task 7',
    'Task 8'
  ];

  itemStringsPROGRESS = ['Task 1-1', 'Task 1-2'];

  itemStringsQA = ['Task 1-1', 'Task 1-2'];

  itemStringsDONE = ['Task 1-1', 'Task 1-2'];

  constructor() { }

  ngOnInit() {
  }

}
