import { Injectable } from '@angular/core';
import { pagination } from '../interfaces/pagination';

@Injectable({
  providedIn: 'root'
})
export class PaginatonService {

  pagination : pagination;
  constructor() { 
    this.pagination = {current_page: 1}
  }

  currentPageNumber(): number{
    return this.pagination.current_page;
  }

  updateCurrentPage(valor: number): void{
    this.pagination.current_page = valor;
  }
}
