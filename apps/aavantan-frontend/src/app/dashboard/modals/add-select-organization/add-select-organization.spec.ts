import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSelectOrganization } from './add-select-organization';

describe('AddSelectOrganization', () => {
  let component: AddSelectOrganization;
  let fixture: ComponentFixture<AddSelectOrganization>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSelectOrganization ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSelectOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
