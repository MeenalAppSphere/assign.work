import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RunningSprintComponent } from './running-sprint.component';

describe('RunningSprintComponent', () => {
  let component: RunningSprintComponent;
  let fixture: ComponentFixture<RunningSprintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RunningSprintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RunningSprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
