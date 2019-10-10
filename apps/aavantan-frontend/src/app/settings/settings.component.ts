import { Component, OnInit } from '@angular/core';

@Component({
    templateUrl: './settings.component.html',
    styleUrls:['./settings.component.scss']
})

export class SettingsComponent implements OnInit{
  public activeView:any={
    title:'Stages',
    view:'stages'
  };
  public stagesList:any=[
    {
      title:'TO Do',
      id:'1',
      position:1
    },
    {
      title:'In-Progress',
      id:'2',
      position:2
    },
    {
      title:'Done',
      id:'1',
      position:3
    }];
  constructor( ) {}

  ngOnInit(): void {
  }


  public activeTab(view:string, title:string) {
    this.activeView = {
      title: title,
      view: view
    }
  }

  public addStage(){

  }

}
