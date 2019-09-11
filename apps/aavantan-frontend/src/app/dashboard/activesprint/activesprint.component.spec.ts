import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivesprintComponent } from './activesprint.component';

describe('ActivesprintComponent', () => {
  let component: ActivesprintComponent;
  let fixture: ComponentFixture<ActivesprintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivesprintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivesprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
