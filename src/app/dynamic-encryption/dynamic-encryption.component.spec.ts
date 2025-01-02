import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicEncryptionComponent } from './dynamic-encryption.component';

describe('DynamicEncryptionComponent', () => {
  let component: DynamicEncryptionComponent;
  let fixture: ComponentFixture<DynamicEncryptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicEncryptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicEncryptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
