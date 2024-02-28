import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArtworkListComponent } from '../artwork-list/artwork-list.component';
import { Router, RouterLink } from '@angular/router';
import { PaginatonService } from '../../services/paginaton.service';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [FormsModule, ArtworkListComponent, RouterLink],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnInit {
  constructor(private http: HttpClient, private paginacionService: PaginatonService, private router: Router) { }

  @Input() totalPages: number = 0;
  @Input() currentPage: number= this.paginacionService.currentPageNumber();
  pageNumber: number = 1;
  
  totalArtworkPages(): void {
    this.http.get<any>('https://api.artic.edu/api/v1/artworks')
    .subscribe((response: any) => {
      this.totalPages = response.pagination.total_pages;
    });
  }
  
  ngOnInit(): void {
    this.totalArtworkPages(); 
    this.paginacionService.updateCurrentPage(this.currentPage);
  }
  
  goPage(page:number): void{
    this.currentPage=page;
    this.paginacionService.updateCurrentPage(this.currentPage);
    this.router.navigate(['/artwork/page/', this.currentPage]);
  }

  goToPageInput(): void {
    if (this.pageNumber > 0 && this.pageNumber <= this.totalPages) {
      this.currentPage = this.pageNumber;
      this.paginacionService.updateCurrentPage(this.currentPage);
      this.router.navigate(['/artwork/page/', this.currentPage]);
    } else {
      alert('The entered page number is out of range');
    }
  }
}