import { TestBed } from '@angular/core/testing';

import { PaginatonService } from './paginaton.service';

describe('PagiantonService', () => {
  let service: PaginatonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginatonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
